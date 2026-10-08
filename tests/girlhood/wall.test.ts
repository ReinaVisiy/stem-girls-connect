import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import wall from '../../api/_lib/girlhood/wall';

test('cursor wall traversal neither skips nor duplicates rows when new voices arrive', async () => {
  process.env.SUPABASE_URL='http://127.0.0.1:9';process.env.SUPABASE_SERVICE_ROLE_KEY='test-key';
  const rows=Array.from({length:55},(_,i)=>({ public_reference:'GSH-'+String(i).padStart(16,'0'),created_at:new Date(Date.UTC(2026,0,1,0,i)).toISOString(),featured:i%2===0,public_category:'girl',language:'en',public_girlhood_response:'Freedom to learn and explore',safe_display_name:'Anonymous' }));
  const stub=mock.method(globalThis,'fetch',async(raw:any,init:any)=>{
    const url=new URL(String(raw));
    assert.ok(url.pathname.endsWith('/girlhood_public_responses'));
    assert.doesNotMatch(url.searchParams.get('select')!,/(^|,)(age|withdrawal_hash|girlhood_response|display_name)(,|$)/);
    let list=[...rows].sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.public_reference.localeCompare(a.public_reference));
    const cursor=url.searchParams.get('or');
    if(cursor){
      const matched=cursor.match(/created_at.lt.([^,]+),and\(created_at.eq.([^,]+),public_reference.lt.([A-Za-z0-9-]+)/)!;
      assert.ok(matched);assert.equal(matched[1],matched[2]);
      list=list.filter(row=>row.created_at<matched[1]||(row.created_at===matched[1]&&row.public_reference<matched[3]));
    }
    const offset=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??25);
    return new Response(JSON.stringify(list.slice(offset,offset+limit)),{headers:{'content-type':'application/json'}});
  });
  const run=async(query:any)=>{const res={statusCode:0,body:null as any,setHeader(){},status(n){this.statusCode=n;return this;},json(body){this.body=body;return this;}};await wall({method:'GET',query} as any,res as any);return res;};
  try {
    const first=await run({page:'1'});assert.equal(first.statusCode,200);assert.equal(first.body.responses.length,24);
    rows.push({...rows[0],public_reference:'GSH-9999999999999999',created_at:'2026-02-01T00:00:00.000Z'});
    const second=await run({page:'2',cursor:first.body.nextCursor});
    const third=await run({page:'3',cursor:second.body.nextCursor});
    const references=[...first.body.responses,...second.body.responses,...third.body.responses].map(r=>r.public_reference);
    assert.equal(references.length,55);assert.equal(new Set(references).size,55);assert.equal(third.body.hasMore,false);
    assert.equal((await run({cursor:Buffer.from(JSON.stringify({created:'bad',reference:'bad),or(id.gt.0'})).toString('base64url')})).statusCode,400);
  } finally {stub.mock.restore();}
});
