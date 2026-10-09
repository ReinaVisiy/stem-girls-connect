import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';
const base=process.env.UI_BASE_URL||'http://127.0.0.1:4178';
const artifacts=resolve(process.env.UI_ARTIFACT_DIR||'../browser-release');await mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
let state='not_yet_open';let fail=false;
await page.route('**/api/girlhood/status',route=>fail?route.abort():route.fulfill({json:{state}}));
const status=()=>page.locator('.girlhood-availability').first();
async function overflow(){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),'horizontal overflow');}
try{
  if(!process.env.UI_ADMIN_ONLY){
  for(const [value,text] of [['not_yet_open','not yet open'],['closed','have closed']]){
    state=value;await page.goto(base+'/programs/girlhood');await status().filter({hasText:text}).waitFor();
    assert.equal(await page.locator('.girlhood-shell a[href$="share-your-voice"]').count(),0);
    await page.goto(base+'/programs/girlhood/share-your-voice');await status().filter({hasText:text}).waitFor();assert.equal(await page.getByRole('spinbutton').count(),0);
    await page.goto(base+'/programs/girlhood/withdraw');await page.getByLabel('Private withdrawal code',{exact:true}).waitFor();
  }
  fail=true;await page.goto(base+'/programs/girlhood/share-your-voice');await status().filter({hasText:'cannot check availability'}).waitFor();assert.equal(await page.getByRole('spinbutton').count(),0);
  fail=false;state='open';await page.getByRole('button',{name:'Check again',exact:true}).click();await page.locator('textarea').first().fill('Keep these answers when collection closes.');
  state='closed';await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await status().filter({hasText:'have closed'}).waitFor();
  assert.equal(await page.locator('textarea').first().inputValue(),'Keep these answers when collection closes.');assert.ok(await page.getByRole('button',{name:'Leave my note',exact:false}).isDisabled());
  await page.screenshot({path:resolve(artifacts,'closed-with-preserved-answers.png'),fullPage:true});
  console.log('PASS availability states, failed status, withdrawal access, mid-form closure and answer preservation');
  state='open';
  for(const width of [360,768,1440])for(const dark of [false,true])for(const language of ['en','fr']){
    await page.setViewportSize({width,height:1000});await page.goto(base+'/programs/girlhood');
    await page.locator('.girlhood-shell').waitFor();await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);
    await page.getByRole('button',{name:language==='fr'?'Français':'English',exact:true}).click();
    await page.locator('.girlhood-invitation').waitFor();await overflow();
    await page.screenshot({path:resolve(artifacts,`home-${width}-${dark?'dark':'light'}-${language}.png`),fullPage:true});
    for(const path of ['share-your-voice','wall','privacy','withdraw']){
      await page.goto(base+'/programs/girlhood/'+path);await page.locator('.girlhood-shell h1').waitFor();await page.evaluate(d=>document.documentElement.classList.toggle('dark',d),dark);await overflow();
    }
  }
  for(const path of ['/','/about','/programs','/impact','/blog']){await page.goto(base+path);await page.locator('main h1').first().waitFor();await overflow();assert.equal(await page.locator('footer').count(),1);}
  assert.deepEqual(errors,[]);console.log('PASS 60 campaign layout checks: mobile/tablet/desktop, light/dark, English/French; existing site pages/footer');
  }
  await page.goto(base+'/admin/programs/new');await page.waitForURL('**/admin/login');console.log('PASS unauthenticated admin preview denied');
  const admin=await browser.newContext({viewport:{width:1440,height:1000}});
  const token=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:'00000000-0000-0000-0000-000000000001',exp:Math.floor(Date.now()/1000)+36000})).toString('base64url'),'fixture'].join('.');
  await admin.addInitScript(({token})=>localStorage.setItem('sb-preview-db-auth-token',JSON.stringify({access_token:token,refresh_token:'fixture',expires_at:Math.floor(Date.now()/1000)+36000,expires_in:36000,token_type:'bearer',user:{id:'00000000-0000-0000-0000-000000000001',aud:'authenticated',role:'authenticated',email:'fixture@example.invalid'}})),{token});
  const ap=await admin.newPage();const mutations=[];const campaignRequests=[];
  await ap.route('https://preview-db.invalid/**',route=>{
    const url=route.request().url();if(route.request().method()!=='GET'&&!url.endsWith('/rpc/is_admin'))mutations.push(url);
    return route.fulfill({json:url.endsWith('/rpc/is_admin')?true:[]});
  });
  ap.on('request',req=>{if(req.url().includes('/api/girlhood/'))campaignRequests.push(req.url());});
  await ap.goto(base+'/admin/programs/new');await ap.getByLabel('Page template',{exact:true}).selectOption('girlhood');
  assert.equal(await ap.getByLabel('Slug',{exact:true}).inputValue(),'girlhood');
  await ap.getByRole('button',{name:'Preview',exact:true}).first().click();const preview=ap.getByRole('region',{name:'Girlhood administrator preview'});await preview.waitFor();
  await preview.getByRole('button',{name:'Français',exact:true}).click();await preview.getByRole('heading',{name:'L’enfance des filles devrait leur appartenir',exact:true}).waitFor();
  await preview.getByRole('button',{name:'English',exact:true}).click();await preview.getByRole('button',{name:'Contribution',exact:true}).click();await preview.locator('textarea').first().fill('An unsaved preview response.');
  await preview.locator('.girlhood-before summary').first().click();await preview.getByRole('spinbutton').fill('18');
  for(const c of await preview.locator('input[aria-required="true"]').all())await c.check();
  assert.ok(await preview.getByRole('button',{name:'Leave my note',exact:false}).isDisabled());
  await preview.getByRole('button',{name:'Voices / Voix',exact:true}).click();await preview.getByText('A childhood full of curiosity, friendship and possibilities.',{exact:false}).first().waitFor();
  await ap.screenshot({path:resolve(artifacts,'admin-fixture-preview.png'),fullPage:true});
  await preview.getByRole('button',{name:'Withdrawal / Retrait',exact:true}).click();assert.ok(await preview.getByRole('button',{name:'Withdraw my contribution',exact:true}).isDisabled());
  assert.deepEqual(mutations,[]);assert.deepEqual(campaignRequests,[]);assert.equal(await ap.evaluate(()=>sessionStorage.getItem('sgc-girlhood-receipt')),null);
  console.log('PASS authenticated unpublished admin preview: real bilingual components, no campaign network requests, no mutation, no recovery token');await admin.close();
}finally{await browser.close();}

