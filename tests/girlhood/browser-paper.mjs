import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const output=resolve(process.env.UI_ARTIFACT_DIR || '../../outputs/girlhood-paper/after');
await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
let available=true, empty=false, state='open';
const notes=Array.from({length:6},(_,i)=>({public_reference:'fixture-'+i,public_category:'girl',language:'en',public_girlhood_response:['Free.','Room to dream.','To be heard.','Safe.','Curious.','My own choices.'][i],public_future_response:i===0?'Anything she imagines.':null,public_support_response:i===0?'A voice that listens. '.repeat(80):null,safe_display_name:i===0?'A fictional writer':'Anonymous',safe_city:null,safe_country:null,featured:true,created_at:'2026-10-09'}));
await page.route('**/api/girlhood/wall?*',r=>r.fulfill({json:{responses:empty?[]:notes,hasMore:false,nextCursor:null}}));
await page.route('**/api/girlhood/note?*',r=>r.fulfill({status:available?200:404,json:available?{response:notes[0]}:{error:'Note unavailable'}}));
await page.route('**/api/girlhood/status',r=>r.fulfill({json:{state}}));
const base='http://127.0.0.1:4184/programs/girlhood';
try {
 for(const width of [320,360,390,768,1440]) {
  await page.setViewportSize({width,height:900});
  for(const route of ['', '/wall','/share-your-voice']) {
   await page.goto(base+route);await page.locator('.girlhood-shell').waitFor();await page.waitForTimeout(400);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${route} ${width}`);
   if(route==='/wall' && width<=390 && width>=360) assert.equal(await page.locator('.girlhood-notes-grid').evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length),3);
   if(route==='/share-your-voice'){for(let i=0;i<3;i++) assert.ok(await page.locator('#note-'+i).isVisible());assert.ok(await page.getByRole('spinbutton').isVisible());}
   await page.screenshot({path:resolve(output,(route.split('/').pop()||'home')+'-'+width+'.png'),fullPage:true});
  }
 }
 await page.setViewportSize({width:390,height:844});
 await page.goto(base+'/wall');const trigger=page.locator('.girlhood-note-preview').first();await trigger.click();
 const dialog=page.locator('.girlhood-note-dialog');await dialog.getByText('Anything she imagines.').waitFor();
 assert.equal(await dialog.locator('img').count(),0);
 await page.screenshot({path:resolve(output,'expanded-390.png'),fullPage:true});
 await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(e=>e===document.activeElement));
 await page.goto(base+'/wall?note=fixture-0');await dialog.getByText('Anything she imagines.').waitFor();
 available=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await dialog.getByText('This note is unavailable.').waitFor();assert.equal(await dialog.getByText('Anything she imagines.').count(),0);available=true;
 await page.keyboard.press('Escape');await page.waitForURL('**/wall');empty=true;await page.reload();await page.getByText('No stories here yet.',{exact:true}).waitFor();await page.screenshot({path:resolve(output,'empty-390.png'),fullPage:true});empty=false;
 state='closed';await page.goto(base+'/share-your-voice');await page.locator('#note-0').fill('Free.');await page.locator('#note-1').fill('A scientist, an artist, herself.');await page.locator('#note-2').fill('Someone who listens and room to try.');
 assert.ok(await page.getByRole('button',{name:'Share my words'}).isDisabled());
 const outgoing=[];const track=r=>{if(r.postData())outgoing.push(r.postData());};page.on('request',track);
 await page.getByRole('button',{name:'Create my image'}).click();const composer=page.locator('.girlhood-composer');
 await composer.locator('img').waitFor({timeout:60000});
 await composer.getByLabel('Sign this note').fill('A fictional writer');await page.waitForTimeout(600);
 const save=async(name)=>{const img=composer.locator('img').first();await img.waitFor();const raw=await img.evaluate(async e=>Array.from(new Uint8Array(await (await fetch(e.src)).arrayBuffer())));await writeFile(resolve(output,name),Buffer.from(raw));};
 await save('personal-portrait.png');
 await composer.getByLabel('Format',{exact:true}).selectOption('story');await composer.locator('img').waitFor();await save('personal-story.png');
 assert.ok(!outgoing.some(s=>s.includes('Free.')),'private image text uploaded');
 await page.evaluate(() => {
 Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});
 Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__sharedFiles=data.files?.map(f=>f.name);throw new DOMException('Cancelled','AbortError');}});
 });
 await composer.getByLabel('Sign this note').fill('Fictional writer');await composer.locator('img').first().waitFor();
 await composer.getByRole('button',{name:'Share images',exact:true}).click();
 assert.ok(await page.evaluate(()=>window.__sharedFiles.length>0));assert.equal(await composer.getByRole('alert').count(),0);
 await page.keyboard.press('Escape');
 state='open';await page.reload();
 const long='École, liberté et curiosité 👩🏽‍🔬. '.repeat(65).slice(0,1990);
 for(let i=0;i<3;i++)await page.locator('#note-'+i).fill(long);
 await page.getByRole('button',{name:'Create my image'}).click();await composer.locator('img').first().waitFor({timeout:60000});assert.ok(await composer.locator('img').count()>1);await save('personal-long-first.png');
 await page.screenshot({path:resolve(output,'composer-long-390.png'),fullPage:true});
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{localStorage.setItem('sgc-girlhood-language','fr');document.documentElement.classList.add('dark');});
 await page.goto(base);await page.screenshot({path:resolve(output,'home-dark-390.png'),fullPage:true});
 assert.deepEqual(errors,[]);await writeFile(resolve(output,'results.json'),JSON.stringify({passed:true,widths:[320,360,390,768,1440],tests:['three visible prompts','visible age','3-column wall','direct note','withdrawal refresh','Escape focus restoration','closed-state local export','portrait and story PNG','long pagination','no private upload'],realDevices:false},null,2));
 console.log('PASS paper browser acceptance');
}finally{await context.close();await browser.close();}
