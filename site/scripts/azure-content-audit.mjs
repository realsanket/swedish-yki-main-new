import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Opt-in integration check: calls the configured real Azure services. No progress writes.
const base=process.env.AUDIT_BASE_URL ?? 'http://localhost:3102';
const out=path.resolve('../.audit/azure');await fs.mkdir(out,{recursive:true});
const lectures=JSON.parse(await fs.readFile('content/lectures/index.json','utf8'));
const modules=JSON.parse(await fs.readFile('content/modules.json','utf8')).modules;
const voices={Alex:'sv-SE-MattiasNeural',Elin:'sv-SE-HilleviNeural',Henrik:'sv-SE-MattiasNeural',Maja:'sv-SE-SofieNeural'};
const report={dialogues:[],pages:[],feedback:[],failures:[],playbackRate:4};
// AUDIT_CHROMIUM points at an installed Chromium when Playwright's own build is missing.
const browser=await chromium.launch({executablePath:process.env.AUDIT_CHROMIUM||undefined});const context=await browser.newContext();
await context.route('**/api/course',r=>r.request().method()==='GET'?r.fulfill({json:{lectures:{}}}):r.abort());
await context.route('**/api/progress',r=>r.request().method()==='GET'?r.fulfill({json:{profile:{name:'Learner',dailyGoal:15,level:'A0'},completed:[],reviews:{},activity:{},attempts:[]}}):r.abort());
const page=await context.newPage();
await page.addInitScript(()=>{
  window.__audioAudit={started:0,ended:0,duration:0};
  const play=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
    this.playbackRate=4;
    this.addEventListener('playing',()=>{window.__audioAudit.started++;window.__audioAudit.duration=this.duration;},{once:true});
    this.addEventListener('ended',()=>window.__audioAudit.ended++,{once:true});
    return play.apply(this,args);
  };
});
async function audio(button,expected,name) {
  const before=await page.evaluate(()=>window.__audioAudit.ended);
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/speech') && r.request().method()==='POST',{timeout:40000});
  await button.click();const response=await responsePromise;
  assert.equal(response.status(),200,`${name}: speech status ${response.status()}`);
  const sent=response.request().postDataJSON();assert.deepEqual(sent.segments,expected,`${name}: requested speakers/text`);
  // Chromium's CDP body retrieval can be empty for a consumed audio response.
  // Read the identical request from the app's in-memory TTS cache; playback is
  // still the actual AudioButton request above, and must reach its ended event.
  const cached=await fetch(`${base}/api/speech`,{method:'POST',headers:{'Content-Type':'application/json',Origin:base},body:JSON.stringify(sent)});
  assert.equal(cached.status,200);
  const bytes=Buffer.from(await cached.arrayBuffer());assert.ok(bytes.length>1000);
  assert.equal(bytes.length,Number(await response.headerValue('content-length')));
  await fs.writeFile(path.join(out,`${name}.mp3`),bytes);
  await page.waitForFunction(previous=>window.__audioAudit.ended>previous,before,{timeout:60000});
  const state=await page.evaluate(()=>window.__audioAudit);
  assert.ok(state.duration>1 && Number.isFinite(state.duration));
  return {name,status:response.status(),bytes:bytes.length,durationSeconds:state.duration,playback:'ended',voices:[...new Set(expected.map(s=>voices[s.speaker]))]};
}
try {
  // Wait for hydration: a hash change made before it is reset to the server URL.
  await page.goto(base,{waitUntil:'networkidle'});const status=await (await page.request.get(`${base}/api/ai-status`)).json();
  assert.equal(status.provider,'azure');assert.ok(status.capabilities.characterVoices && status.capabilities.feedback,'Real Azure services must be configured');
  for(const lecture of lectures.filter(l=>l.number>=3)) {
    const id=`lecture-${String(lecture.number).padStart(2,'0')}`;
    try {
      await page.goto(`${base}/#lecture/${id}`);await page.locator('.lecture-workspace').waitFor();
      await page.locator('.episode-route-panel nav').getByRole('button',{name:/^Step 1:/}).click();
      const expected=lecture.dialogue.map(l=>({text:l.fi,speaker:voices[l.speaker]?l.speaker:'Henrik',language:'sv'}));
      const result=await audio(page.getByRole('button',{name:'Listen once',exact:true}),expected,`${id}-dialogue`);report.dialogues.push(result);console.log(`PASS Azure ${id}: ${result.durationSeconds.toFixed(1)}s audio, playback ended, ${result.voices.join(', ')}`);
    } catch(e) {report.failures.push(`${id}: ${e.message}`);console.error(`FAIL Azure ${id}: ${e.message}`);}
  }
  for(const chapter of modules) {
    const lecture=lectures.find(l=>l.number>=Math.max(3,chapter.first) && l.number<=chapter.last && l.extraSteps?.length);
    const id=`lecture-${String(lecture.number).padStart(2,'0')}`;
    try {
      await page.goto(`${base}/#lecture/${id}`);await page.locator('.lecture-workspace').waitFor();
      await page.locator('.episode-route-panel nav').getByRole('button',{name:/^Step 2:/}).click();
      const source=lecture.extraSteps[0].pages[0];
      const expected=source.lines.map(l=>({text:l.fi,speaker:l.voice,language:'sv'}));
      const result=await audio(page.getByRole('button',{name:'Hear the textbook dialogue',exact:true}),expected,`chapter-${chapter.number}-textbook`);
      report.pages.push({...result,page:source.pageLabel});console.log(`PASS Azure chapter ${chapter.number}: ${source.pageLabel}, playback ended`);
      const response=await page.request.post(`${base}/api/feedback`,{headers:{Origin:base},data:{taskId:id,skill:'writing',text:lecture.practice.writing.model},timeout:180000});
      const data=await response.json();assert.equal(response.status(),200,`Feedback status ${response.status()}: ${data.error??''}`);assert.equal(data.source,'ai');assert.ok(data.feedback);
      await fs.writeFile(path.join(out,`chapter-${chapter.number}-feedback.json`),JSON.stringify(data,null,2));
      report.feedback.push({chapter:chapter.number,lecture:lecture.number,status:response.status(),source:data.source,syntheticSubmission:true});console.log(`PASS Azure chapter ${chapter.number}: writing feedback for ${id}`);
    } catch(e) {report.failures.push(`Chapter ${chapter.number}: ${e.message}`);console.error(`FAIL Azure chapter ${chapter.number}: ${e.message}`);}
  }
} finally {await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');}
console.log(`AZURE AUDIT ${report.failures.length?'FAIL':'PASS'}: ${report.dialogues.length} dialogues, ${report.pages.length} textbook pages, ${report.feedback.length} writing feedback responses; ${report.failures.length} failures. Audio played to completion at 4×; no microphone or human-listening claim.`);
if(report.failures.length)process.exitCode=1;
