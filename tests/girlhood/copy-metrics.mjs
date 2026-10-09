// Compare two local builds with identical fixture responses; never contacts production.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'msedge'});
const result={};
try {
 for(const [name,base] of [['before','http://127.0.0.1:4183'],['after','http://127.0.0.1:4182']]){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.route('**/api/girlhood/wall?*',r=>r.fulfill({json:{responses:[],hasMore:false,nextCursor:null}}));
  await page.goto(base+'/programs/girlhood');await page.locator('#campaign-content h1').waitFor();
  await page.getByRole('link',{name:name==='before'?'Add your voice ✦':'Leave a little wish',exact:false}).first().waitFor();
  const text=await page.locator('#campaign-content').innerText();
  result[name]={words:text.trim().split(/\s+/).length,text};
  await page.close();
 }
 result.reductionPercent=Math.round((1-result.after.words/result.before.words)*100);
 await writeFile('../../outputs/girlhood-redesign/copy-metrics.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify({beforeWords:result.before.words,afterWords:result.after.words,reductionPercent:result.reductionPercent}));
}finally{await browser.close();}
