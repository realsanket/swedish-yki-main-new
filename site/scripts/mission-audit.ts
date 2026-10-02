import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { lectures } from '../lib/course.ts';
import { defaultCourseLectureState, parseCourseAction, updateCourseState } from '../lib/course-progress.ts';

// Real UI with the real progress reducer in an isolated memory fixture. No owner DB writes.
const base=process.env.AUDIT_BASE_URL ?? 'http://localhost:3103';
const out=path.resolve(process.env.AUDIT_OUT_DIR ?? '../.audit/missions');
const selected=process.env.AUDIT_LECTURES?.split(',').map(Number);
// AUDIT_CHROMIUM points at an installed Chromium when Playwright's own build is missing.
const browser=await chromium.launch({executablePath:process.env.AUDIT_CHROMIUM||undefined});
const failures:string[]=[];
let runs=0,savedAttempts=0;
try {
 for(const width of [1440,390]) for(const lecture of lectures.filter(l=>!selected||selected.includes(l.number))) {
  const dir=path.join(out,lecture.id,String(width));await fs.mkdir(dir,{recursive:true});
  const state={...defaultCourseLectureState(),completedParts:['recall','teach'] as ('recall'|'teach'|'guided'|'practice'|'check'|'assignment')[],completedExtraSteps:(lecture.extraSteps??[]).map(s=>s.id),part:'guided' as const,answers:Object.fromEntries(lecture.guided.map(q=>[q.id,q.answers[0]])),drafts:{speaking:lecture.speaking.model,writing:lecture.writing.model}};
  // The explicit type permits the reducer to advance the part and optional drafts.
  let current:ReturnType<typeof defaultCourseLectureState>=state;
  const context=await browser.newContext({viewport:{width,height:width===1440?900:844},reducedMotion:'reduce'});
  await context.route('**/api/course',async route=>{
   try {
    if(route.request().method()==='POST') current=updateCourseState(current,parseCourseAction(route.request().postDataJSON()),lecture);
    await route.fulfill({json:{lectures:{[lecture.id]:current}}});
   } catch(error) {await route.fulfill({status:422,json:{error:error instanceof Error?error.message:String(error)}});}
  });
  await context.route('**/api/progress',route=>route.fulfill({json:{profile:{name:'Audit fixture',dailyGoal:15,level:'A0'},completed:[],reviews:{},activity:{},attempts:[]}}));
  const page=await context.newPage();page.setDefaultTimeout(15000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  async function shot(name:string){
   await page.evaluate(async()=>{await document.fonts.ready;for(const img of document.images)img.loading='eager';});
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('.lecture-workspace').screenshot({path:path.join(dir,name+'.png'),animations:'disabled'});
  }
  try {
   await page.goto(`${base}/#lecture/${lecture.id}`);await page.locator('.lecture-workspace').waitFor();
   await page.getByRole('button',{name:'Check my built line',exact:true}).click();
   await page.locator('.lecture-actions').getByRole('button',{name:'Next: Do the task',exact:true}).click();
   await page.locator('.sitting-break').waitFor();await shot('part-one-stop');
   assert.ok(current.completedParts.includes('guided'));
   await page.getByRole('button',{name:'Continue with part 2 now',exact:true}).click();
   await page.locator('#part-two-recall-heading').waitFor();
   for(const skill of ['Speaking','Writing'] as const){
    await page.locator('.practice-focus').getByRole('button',{name:skill,exact:true}).click();
    const buttons=page.locator('ol[aria-label="Mission stages"]').getByRole('button');
    await buttons.nth(skill==='Speaking'?2:1).click();
    const mission=page.locator('article[id^="mission-"]');
    const checks=mission.locator('input[type="checkbox"]');
    assert.ok(await checks.count()>0);
    for(const checkbox of await checks.all())await checkbox.check();
    await shot(skill.toLowerCase()+'-check');
    if(skill==='Speaking'){
     await buttons.nth(3).click();
     for(let q=0;q<3;q++){
      await page.getByRole('button',{name:'Start my 15 seconds',exact:true}).click();
      await page.getByRole('button',{name:'I answered',exact:true}).click();
      await page.getByRole('button',{name:'I got stuck',exact:true}).click();
     }
     assert.ok(await page.getByText(/You answered 0 of 3/).isVisible());
    }
    await buttons.last().click();await shot(skill.toLowerCase()+'-retry');
    await mission.getByRole('button',{name:'Save this attempt',exact:true}).click();
    await mission.getByText(/Practice saved/).waitFor();
    assert.ok(current.practice[skill.toLowerCase() as 'speaking'|'writing']);savedAttempts++;
   }
   await page.locator('.lecture-actions').getByRole('button',{name:'Next: Check yourself',exact:true}).click();
   assert.ok(current.completedParts.includes('practice'));
   assert.equal(errors.length,0,errors.join('\n'));
   runs++;console.log(`PASS mission fixture ${lecture.id}/${width}: stop card, recall, both checks, three-question round, two saved attempts`);
  } catch(error){const message=`${lecture.id}/${width}: ${error instanceof Error?error.message:String(error)}`;failures.push(message);console.error('FAIL '+message);await page.screenshot({path:path.join(dir,'failure.png'),fullPage:true}).catch(()=>{});}
  finally{await context.close();}
 }
} finally{await browser.close();await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'report.json'),JSON.stringify({runs,savedAttempts,failures,storage:'isolated memory fixture using the real progress reducer',speech:'synthetic typed drafts; no microphone claim'},null,2)+'\n');}
console.log(`MISSION AUDIT ${failures.length?'FAIL':'PASS'}: ${runs} lecture/width cases, ${savedAttempts} saved fixture attempts, ${failures.length} failures.`);
if(failures.length)process.exitCode=1;
