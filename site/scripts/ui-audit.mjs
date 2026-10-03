import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

// Run against a production server: AUDIT_BASE_URL=http://localhost:3102 npm run audit:ui
// --reference audits only the unchanged pilots on the separate main-ref server.
const reference = process.argv.includes('--reference');
const base = process.env.AUDIT_BASE_URL ?? 'http://localhost:3102';
const out = path.resolve(process.env.AUDIT_OUT_DIR ?? '../.audit/ui');
const content = path.resolve(process.env.AUDIT_CONTENT_DIR ?? 'content');
const all = JSON.parse(await fs.readFile(path.join(content, 'lectures/index.json'), 'utf8'));
const modules = JSON.parse(await fs.readFile(path.join(content, 'modules.json'), 'utf8')).modules;
const selected = process.env.AUDIT_LECTURES?.split(',').map(Number);
const lectures = all.filter(l => selected ? selected.includes(l.number) : !reference || l.number <= 2);
const widths = (process.env.AUDIT_WIDTHS ?? '1440,390').split(',').map(Number);
const failures = [];
const records = [];
const stats = { routeViews: 0, textbookStages: 0, ykiStages: 0, teachingBeats: 0, completedActivities: 0, missionStages: 0, checks: 0 };
const norm = s => s.replace(/\s+/gu, ' ').trim();
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const idFor = n => `lecture-${String(n).padStart(2, '0')}`;
const plans = JSON.parse(await fs.readFile('scripts/fixtures/lecture-audit-plan.json', 'utf8'));
await fs.mkdir(out, { recursive: true });

if (!reference) {
  assert.deepEqual(all.map(l => l.number), plans.map(p => p.number), 'The gate must cover every active lecture, 1–22');
  // Static checks complement the browser: bad JSON fields previously passed type casts.
  for (const lecture of all) {
    const plan = plans.find(p => p.number === lecture.number);
    const pages = (lecture.extraSteps ?? []).flatMap(s => s.pages ?? []);
    assert.deepEqual(pages.map(p => Number(p.pageLabel.match(/\d+/)[0])).sort((a,b) => a-b), plan.pages, `${idFor(lecture.number)} mapped pages`);
    assert.equal(lecture.presentation?.template, 'conversation-first');
    const hero = lecture.presentation?.hero;
    for (const key of ['variant','meta','kicker','title','lede','startLine','speakers','connector','encounterLabel','chunks']) assert.ok(hero?.[key], `L${lecture.number}: hero.${key}`);
    assert.ok(hero.startLine.audioText);
    assert.equal(hero.speakers.length, 2);
    assert.equal(hero.chunks.length, 4);
    assert.equal(hero.meta[0], `LEKTION ${lecture.number}`);
    const months = { APRIL:'04', MAY:'05', JUNE:'06', JULY:'07', AUGUST:'08' }; // English month names, as in Lectures 1-2
    const [day, month, year] = hero.meta[1].split(' ');
    assert.equal(`${year}-${months[month]}-${day.padStart(2,'0')}`, plan.date, `L${lecture.number}: teacher date`);
    assert.equal(lecture.presentation.opening.dialogue.part, 'recall');
    assert.ok(lecture.presentation.opening.teacherNote.title && lecture.presentation.opening.teacherNote.body);
    assert.ok(lecture.presentation.opening.questionIntro);
    assert.equal(lecture.reviewPhrases.length, 8);
    assert.equal(lecture.unplannedQuestions.length, 6);
    assert.ok(lecture.checkpoint.some(q => !q.options));
  }
  for (const dir of ['components','lib','app']) {
    const files = execFileSync('rg', ['--files', dir], { encoding:'utf8' }).trim().split('\n').filter(f => /\.(?:tsx?|mjs)$/.test(f));
    for (const file of files) {
      const text = await fs.readFile(file,'utf8');
      assert.ok(!/lecture\.number\s*===/.test(text), `Number branch: ${file}`);
      assert.ok(!/(?:storyChapters|episodeArtwork|episodeObjects|legacyPrimarySkills)\s*:\s*Record<number/.test(text), `Number-keyed story data: ${file}`);
      // Literal numeric object keys in shared code are not allowed curriculum maps.
      assert.ok(!/^\s*\d+\s*:\s*["'{]/m.test(text), `Review numeric literal map: ${file}`);
    }
  }
}

// AUDIT_CHROMIUM points at an installed Chromium when Playwright's own build is missing.
const browser = await chromium.launch({ headless:true, executablePath: process.env.AUDIT_CHROMIUM || undefined });
async function settle(page) {
  await page.evaluate(async () => { await document.fonts.ready; for (const img of document.images) img.loading = 'eager'; });
  await page.waitForFunction(() => [...document.images].every(i => i.complete), {}, { timeout:30000 });
}
async function inspect(page, label, lecture, errors) {
  await settle(page);
  const state = await page.evaluate(() => ({
    width:innerWidth, scroll:document.documentElement.scrollWidth,
    bad:[...document.images].filter(i => !i.naturalWidth).map(i => i.currentSrc || i.src),
    text:document.body.innerText,
  }));
  stats.checks++;
  assert.equal(state.bad.length,0,`${label}: broken images ${state.bad.join(', ')}`);
  assert.ok(state.scroll <= state.width + 1,`${label}: sideways scrolling (${state.scroll} > ${state.width})`);
  assert.ok(!state.text.includes('a useful clue'),`${label}: stale object fallback`);
  const courseModule = modules.find(m => lecture.number >= m.first && lecture.number <= m.last);
  if (courseModule.number !== modules[0].number) {
    assert.ok(!/The first class|Alex meets Elin and learns to share a name/.test(state.text),`${label}: Chapter 1 story leak`);
  }
  assert.equal(errors.length,0,`${label}: ${errors.join('\n')}`);
}
async function capture(page, dir, name) {
  // A stage change starts a smooth scroll to the new stage; jump to the top
  // until that scroll has finished instead of racing it.
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => scrollTo({top:0,left:0,behavior:'instant'}));
    await page.waitForTimeout(250);
    if (await page.evaluate(() => scrollY===0)) break;
  }
  await page.waitForFunction(() => scrollY===0);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const bounds=await page.locator('.lecture-workspace').boundingBox();
  await page.screenshot({ path:path.join(dir,`${name}.png`), fullPage:true, animations:'disabled' });
  // Crop the full screenshot using these bounds for pixel comparison. Element
  // screenshots scroll tall elements and can place the fixed app header over them.
  await fs.writeFile(path.join(dir,`${name}-bounds.json`),JSON.stringify(bounds));
  await fs.writeFile(path.join(dir,`${name}.txt`),await page.locator('.lecture-workspace').innerText());
}
async function completeActivity(page, activity) {
  const root = page.locator('.teaching-section');
  if (activity.type === 'sort') {
    for (let i=0;i<activity.items.length;i++) {
      const text = norm(await root.locator('p[class*="sortWord"]').innerText());
      const item = activity.items.find(item => norm(item.fi) === text);
      assert.ok(item,`Unknown sort card: ${text}`);
      const bucket = activity.buckets.find(b => b.id === item.bucket);
      await root.getByRole('group',{name:'Choose a group'}).getByRole('button',{name:new RegExp(`^${esc(bucket.label)}(?!\\p{L})`,'u')}).click();
      await root.getByRole('button',{name:/^(Next card|See my result)/}).click();
    }
    assert.ok(await root.getByText(`${activity.items.length} of ${activity.items.length} on the first try`,{exact:true}).isVisible());
  } else if (activity.type === 'match') {
    for (const pair of activity.pairs) {
      await root.getByRole('group',{name:activity.leftLabel,exact:true}).getByRole('button',{name:pair.left,exact:true}).click();
      await root.getByRole('group',{name:activity.rightLabel,exact:true}).getByRole('button',{name:pair.right,exact:true}).first().click();
    }
    assert.ok(await root.getByText('All pairs matched.',{exact:true}).isVisible());
  } else if (activity.type === 'question-gap') {
    for (const gap of activity.gaps) await root.getByRole('group',{name:'Choose your question'}).getByRole('button',{name:gap.answer,exact:true}).click();
    assert.ok(await root.getByText(new RegExp(`Card complete: ${activity.gaps.length} of ${activity.gaps.length}`)).isVisible());
  } else if (activity.type === 'sound-map') {
    // The pilot's exploratory sound map has no compulsory completion state.
    assert.ok(await root.locator('button').count());
    return;
  } else throw new Error(`Unsupported audit activity: ${activity.type}`);
  stats.completedActivities++;
}

try {
  for (const width of widths) for (const lecture of lectures) {
    const id = idFor(lecture.number);
    const dir = path.join(out,id,String(width));
    await fs.mkdir(dir,{recursive:true});
    const context = await browser.newContext({ viewport:{width,height:width===1440?900:844}, reducedMotion:'reduce', locale:'en-GB' });
    // Deterministic empty learner state; never write to the owner's SQLite database.
    await context.route('**/api/course',route => route.request().method()==='GET'
      ? route.fulfill({json:{lectures:{}}}) : route.abort('blockedbyclient'));
    await context.route('**/api/progress',route => route.request().method()==='GET'
      ? route.fulfill({json:{profile:{name:'Learner',dailyGoal:15,level:'A0'},completed:[],reviews:{},activity:{},attempts:[]}}) : route.abort('blockedbyclient'));
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('console',m => { if (m.type()==='error') errors.push(m.text()); });
    page.on('pageerror',e => errors.push(e.message));
    try {
      await page.goto(`${base}/#lecture/${id}`);
      await page.locator('.lecture-workspace').waitFor();
      assert.ok(await page.locator('.lecture-template-conversation-first').count());
      const sequence = ['recall',...(lecture.extraSteps??[]).map(s=>s.id),'teach','guided','practice','check','assignment'];
      const expected = plans.find(p => p.number===lecture.number).steps;
      assert.equal(sequence.length, expected, `${id}: content route count`);
      assert.equal(await page.locator('.episode-route-panel nav > button').count(),expected,`${id}: rendered route count`);
      for (let step=0;step<sequence.length;step++) {
        if(width===390) await page.locator('.mobile-route-drawer').evaluate(e => e.open=true);
        const nav = page.locator(width===390?'.mobile-route-drawer nav':'.episode-route-panel nav');
        await nav.getByRole('button',{name:new RegExp(`^Step ${step+1}:`)}).click();
        const label = `${id}/${width}/${sequence[step]}`;
        await inspect(page,label,lecture,errors);
        assert.ok((await page.locator('.part-heading > .eyebrow').innerText()).includes(`STEP ${step+1} OF ${expected}`));
        assert.ok(await page.locator(step===0?'.lecture-conversation-brief':'.lecture-compact-title').isVisible(),`${label}: missing hero/title`);
        stats.routeViews++;
        await capture(page,dir,`step-${step+1}`);
        if(sequence[step]==='recall') {
          await page.getByRole('button',{name:'Show text support',exact:true}).click();
          await inspect(page,`${label}/dialogue`,lecture,errors);
          assert.equal(await page.locator('.story-line').count(),lecture.dialogue.length);
          if(lecture.dialogue.some(l=>l.speaker==='Servitör')) {
            const role = page.locator('.story-line').filter({has:page.locator('.story-line-copy > span',{hasText:'Servitör'})}).first();
            assert.equal(await role.locator('.story-avatar-fallback').innerText(),'S');
          }
        }
        const extra=(lecture.extraSteps??[]).find(s=>s.id===sequence[step]);
        if(extra?.kind==='yki-speaking') {
          for(let pi=0;pi<extra.parts.length;pi++) {
            if(extra.parts.length>1) await page.getByRole('group',{name:'YKI tasks for this lesson'}).getByRole('button').nth(pi).click();
            const stages=page.getByRole('navigation',{name:'YKI task stages'}).getByRole('button');
            assert.equal(await stages.count(),extra.parts[pi].type==='dialogue'?4:3,`${label}: YKI task stages`);
            for(let stage=0;stage<await stages.count();stage++) {
              await stages.nth(stage).click();
              await inspect(page,`${label}/part-${pi+1}/stage-${stage+1}`,lecture,errors);
              stats.ykiStages++;
            }
          }
        } else if(extra) {
          for(let pi=0;pi<extra.pages.length;pi++) {
            if(extra.pages.length>1) await page.getByRole('group',{name:'Textbook pages for this lesson'}).getByRole('button').nth(pi).click();
            const stages=page.getByRole('navigation',{name:'Textbook page practice stages'}).getByRole('button');
            assert.equal(await stages.count(),5,`${label}: five textbook stages`);
            for(let stage=0;stage<5;stage++) {
              await stages.nth(stage).click();
              await inspect(page,`${label}/page-${pi+1}/stage-${stage+1}`,lecture,errors);
              stats.textbookStages++;
              if(stage===2) {
                const found=page.getByRole('button',{name:/Show all/});
                if(await found.count()) await found.click();
              }
            }
          }
        }
        if(sequence[step]==='teach') {
          for(let topic=0;topic<lecture.sections.length;topic++) {
            const section=lecture.sections[topic];
            await page.getByRole('button',{name:`Topic ${topic+1}: ${section.title}`,exact:true}).click();
            const beats=page.locator('.teaching-beat-nav > button');
            const count=await beats.count();
            const activities=[...(section.activity?[section.activity]:[]),...(section.activities??[])];
            assert.ok(count >= 3+activities.length,`${label}: missing teaching beats`);
            let activityIndex=0;
            for(let beat=0;beat<count;beat++) {
              await beats.nth(beat).click();
              await inspect(page,`${label}/topic-${topic+1}/beat-${beat+1}`,lecture,errors);
              stats.teachingBeats++;
              if(await page.locator('.teaching-section [class*="sortCard"], .teaching-section [class*="matchColumns"], .teaching-section [class*="gapCard"]').count()) {
                await completeActivity(page,activities[activityIndex++]);
                await inspect(page,`${label}/topic-${topic+1}/activity-complete`,lecture,errors);
              }
            }
          }
          assert.ok(await page.getByRole('complementary',{name:'Grammar words in plain English'}).count(),`${label}: grammar support`);
        }
        // The stop card appears only after successful completion, not while previewing.
        if(sequence[step]==='guided') assert.equal(lecture.sittingBreakAfter,'guided',`${label}: Part 1 boundary`);
        if(sequence[step]==='practice') {
          for(const [skill,total] of [['Speaking',5],['Writing',3]]) {
            await page.locator('.practice-focus').getByRole('button',{name:skill,exact:true}).click();
            const mission=page.locator('ol[aria-label="Mission stages"]');
            assert.equal(await mission.count(),1,`${label}: active ${skill} mission`);
            const buttons=mission.getByRole('button');assert.equal(await buttons.count(),total,`${label}: ${skill} stages`);
            for(let stage=0;stage<total;stage++) { await buttons.nth(stage).click(); await inspect(page,`${label}/${skill}/stage-${stage+1}`,lecture,errors);stats.missionStages++; }
            await buttons.first().click();
            await capture(page,dir,`mission-${skill.toLowerCase()}`);
          }
        }
        if(sequence[step]==='check') assert.ok(await page.locator('.lecture-page').getByRole('textbox').count(),`${label}: typed checkpoint`);
        if(sequence[step]==='assignment') {
          const text=await page.locator('.lecture-page').innerText();
          for(const phrase of lecture.reviewPhrases) assert.ok(text.includes(phrase.fi),`${label}: missing review phrase ${phrase.id}`);
        }
      }
      records.push({lecture:lecture.number,width,result:'PASS',steps:expected});
      console.log(`PASS ${id} ${width}: ${expected} route steps, all inner stages`);
    } catch(e) {
      const failure=`${id}/${width}: ${e.message}`;failures.push(failure);records.push({lecture:lecture.number,width,result:'FAIL',error:e.message});
      await page.screenshot({path:path.join(dir,'failure.png'),fullPage:true}).catch(()=>{});
      console.error(`FAIL ${failure}`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
const report={base,reference,revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),stats,records,failures};
await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(`UI AUDIT ${failures.length?'FAIL':'PASS'}: ${stats.routeViews} route views; ${stats.textbookStages} textbook stages; ${stats.ykiStages} YKI task stages; ${stats.teachingBeats} teaching beats; ${stats.completedActivities} completed activities; ${stats.missionStages} mission stages; ${failures.length} failures.`);
if(failures.length) process.exitCode=1;
