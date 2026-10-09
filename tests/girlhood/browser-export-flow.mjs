import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const out=resolve('../../outputs/girlhood-paper/exports');await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},recordVideo:{dir:out,size:{width:390,height:844}}});
await context.addInitScript(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});});
const page=await context.newPage();
try {
 await page.goto('http://127.0.0.1:4184/programs/girlhood/share-your-voice');await page.locator('#note-0').fill('Free.');await page.locator('#note-1').fill('A scientist, an artist, herself.');await page.locator('#note-2').fill('Someone who listens and room to try.');
 await page.getByRole('spinbutton').fill('12');
 const requests=[];page.on('request',r=>{if(r.postData()) requests.push(r.postData());});
 await page.getByRole('button',{name:'Create my image',exact:true}).click();const composer=page.locator('.girlhood-composer');await composer.locator('img').first().waitFor({timeout:60000});
 assert.equal(await composer.getByLabel('Sign this note').inputValue(),'');await composer.getByText('Before sharing elsewhere',{exact:false}).waitFor();
 assert.equal(await composer.getByRole('button',{name:'Share images'}).count(),0);
 await composer.getByLabel('Sign this note').fill('A fictional writer');await composer.locator('img').first().waitFor();
 async function download(name,height){await page.waitForFunction(h=>document.querySelector('.girlhood-composer img')?.naturalHeight===h,height);const pending=page.waitForEvent('download');await composer.locator('a[download]').first().click();await (await pending).saveAs(resolve(out,name));}
 await download('portrait.png',1350);await composer.getByLabel('Format',{exact:true}).selectOption('story');await download('story.png',1920);
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__files=data.files.map(f=>({name:f.name,type:f.type}));throw new DOMException('Cancelled','AbortError');}});});
 await composer.getByLabel('Sign this note').fill('Fictional writer');await composer.locator('img').first().waitFor();await composer.getByRole('button',{name:'Share images',exact:true}).click();assert.ok(await page.evaluate(()=>window.__files.every(f=>f.type==='image/png')));assert.equal(await composer.getByRole('alert').count(),0);
 assert.deepEqual(requests,[],'local images do not post participant words');await page.keyboard.press('Escape');
 for(const input of await page.locator('input[aria-required=true]').all()) await input.check();
 await page.getByRole('button',{name:'Share my words',exact:false}).click();await page.locator('.girlhood-receipt').waitFor();
 await page.getByRole('button',{name:'Create my image',exact:true}).click();await composer.locator('img').first().waitFor({timeout:60000});await page.keyboard.press('Escape');
 const receipt=page.waitForEvent('download');await page.getByRole('button',{name:'Download my private receipt'}).click();await receipt;
 await page.reload();await page.getByRole('button',{name:'Recover my receipt'}).click();await page.locator('.girlhood-receipt').waitFor();assert.equal(await page.getByRole('button',{name:'Create my image'}).count(),0);
 console.log('PASS actual portrait/story downloads, under-13 blank signature, no private upload, native-share cancellation simulation, post-submit snapshot, receipt-only recovery');
}finally{await context.close();await browser.close();}
