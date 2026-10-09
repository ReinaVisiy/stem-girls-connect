import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import note from '../../api/_lib/girlhood/note';

function response() {return {code:0, body:null as any, headers:{} as Record<string,string>, setHeader(k:string,v:string){this.headers[k]=v;}, status(n:number){this.code=n;return this;},json(b:any){this.body=b;return this;}};}
test('public lookup validates input and uses only the safe view and approved projection', async () => {
  process.env.SUPABASE_URL='http://127.0.0.1:9'; process.env.SUPABASE_SERVICE_ROLE_KEY='fixture';
  let calls=0;
  const stub=mock.method(globalThis,'fetch',async (input:any) => {
    const url=new URL(String(input)); calls++;
    assert.equal(url.pathname,'/rest/v1/girlhood_public_responses');
    const projection=url.searchParams.get('select')!;
    assert.ok(projection.includes('public_girlhood_response'));
    assert.ok(!projection.includes('withdrawal') && !projection.split(',').includes('age') && !projection.includes('request_token'));
    return new Response(JSON.stringify(url.searchParams.get('public_reference') === 'eq.available' ? [{public_reference:'available',public_girlhood_response:'Approved only'}] : []), {headers:{'content-type':'application/json'}});
  });
  try {
    for (const reference of ['private','withdrawn','missing','age12','x'.repeat(81),'bad/ref']) {
      const res=response(); await note({method:'GET',query:{reference}} as any,res as any);
      assert.equal(res.code,404); assert.deepEqual(res.body,{error:'Note unavailable'}); assert.equal(res.headers['Cache-Control'],'no-store');
    }
    assert.equal(calls,4);
    const res=response(); await note({method:'GET',query:{reference:'available'}} as any,res as any);
    assert.equal(res.code,200);assert.equal(res.body.response.public_girlhood_response,'Approved only');
  } finally {stub.mock.restore();}
});
