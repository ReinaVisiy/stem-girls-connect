import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import status, { campaignState } from '../../api/_lib/girlhood/status';
import subscribe from '../../api/subscribe';
import { validateGirlhoodProgram } from '../../src/lib/girlhoodProgram';

const response = () => ({ statusCode: 0, body: null as any, headers: {}, setHeader(k,v){this.headers[k]=v;}, status(n){this.statusCode=n;return this;}, json(body){this.body=body;return this;} }) as any;
test('public availability distinguishes all states, exposes no secrets and fails closed', async () => {
  const previous={...process.env};
  try {
    for(const key of ['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','GIRLHOOD_WITHDRAWAL_PEPPER','GIRLHOOD_RATE_LIMIT_SECRET','GIRLHOOD_ALLOWED_ORIGINS']) delete process.env[key];
    process.env.GIRLHOOD_SUBMISSIONS_OPEN='true'; assert.equal(campaignState(),'closed');
    Object.assign(process.env,{SUPABASE_URL:'https://db.invalid',SUPABASE_SERVICE_ROLE_KEY:'private',GIRLHOOD_WITHDRAWAL_PEPPER:'p'.repeat(32),GIRLHOOD_RATE_LIMIT_SECRET:'r'.repeat(32),GIRLHOOD_ALLOWED_ORIGINS:'https://site.invalid'});
    assert.equal(campaignState(),'open');
    process.env.GIRLHOOD_SUBMISSIONS_OPEN='false';process.env.GIRLHOOD_CAMPAIGN_PHASE='not_yet_open';assert.equal(campaignState(),'not_yet_open');
    process.env.GIRLHOOD_CAMPAIGN_PHASE='closed';assert.equal(campaignState(),'closed');
    const r=response(); await status({method:'GET'} as any,r);
    assert.deepEqual(r.body,{state:'closed'});assert.equal(r.headers['Cache-Control'],'no-store');
  } finally { for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous); }
});
test('canonical program validation leaves other programs unrestricted',()=>{
  assert.equal(validateGirlhoodProgram('girlhood','girlhood'),null);
  assert.ok(validateGirlhoodProgram('girlhood','other'));
  assert.ok(validateGirlhoodProgram('standard','girlhood'));
  assert.equal(validateGirlhoodProgram('standard','code-club'),null);
});

test('fresh baseline, safe newsletter rollout and campaign safeguards on isolated PostgreSQL', async () => {
  const db = new PGlite();
  const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
  const sql=(file:string)=>readFile('supabase/migrations/'+file,'utf8');
  const admin='00000000-0000-0000-0000-000000000001';
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role;
    create schema storage;create table storage.buckets(id text primary key,file_size_limit bigint,allowed_mime_types text[]);
    insert into storage.buckets(id) values('site-assets');`);
  try {
    for(const f of files.filter(f=>f<'202610')) await db.exec(await sql(f));
    await db.exec(await readFile('supabase/bootstrap/legacy_prerequisites.sql','utf8'));
    // Existing production configuration: content/Programs migrations only.
    for(const f of files.filter(f=>f>='202610'&&!f.includes('girlhood')&&!f.includes('newsletter'))) await db.exec(await sql(f));
    await db.exec(`set role anon;insert into public.subscribers(email) values('existing@example.org');reset role;`);
    const preparation=files.find(f=>f.includes('newsletter_independent'))!;
    await db.exec(await sql(preparation));
    // PREPARE keeps the old deployed endpoint working until code switches.
    await db.exec(`set role anon;insert into public.subscribers(email) values('during-rollout@example.org');reset role;`);
    const previous={...process.env};
    Object.assign(process.env,{SUPABASE_URL:'http://127.0.0.1:9',SUPABASE_SERVICE_ROLE_KEY:'test-service',NEWSLETTER_RATE_LIMIT_SECRET:'n'.repeat(32)});
    delete process.env.VERCEL;
    let unavailable=false;
    const stub=mock.method(globalThis,'fetch',async(raw:any,options:any)=>{
      assert.ok(String(raw).endsWith('/rest/v1/rpc/newsletter_signup'));
      if(unavailable)return new Response(JSON.stringify({message:'SECRET database detail'}),{status:503,headers:{'content-type':'application/json'}});
      const body=JSON.parse(options.body);
      await db.exec('set role service_role');
      try {const result=await db.query<{allowed:boolean}>('select public.newsletter_signup($1,$2) as allowed',[body.p_email,body.p_fingerprint]);return new Response(JSON.stringify(result.rows[0].allowed),{headers:{'content-type':'application/json'}});}finally{await db.exec('reset role');}
    });
    const send=async(email:any,ip='127.0.0.1')=>{const r=response();await subscribe({method:'POST',headers:{'content-type':'application/json'},body:{email},socket:{remoteAddress:ip}} as any,r);return r;};
    try {
      const first=await send('new@example.org');const duplicate=await send('existing@example.org');
      assert.equal(first.statusCode,200);assert.deepEqual(first.body,duplicate.body);
      for(const value of ['',null,123,'bad','x'.repeat(255)+'@example.org'])assert.equal((await send(value)).statusCode,400);
      unavailable=true;assert.equal((await send('valid@example.org')).statusCode,503);unavailable=false;
      delete process.env.NEWSLETTER_RATE_LIMIT_SECRET;assert.equal((await send('valid@example.org')).statusCode,503);process.env.NEWSLETTER_RATE_LIMIT_SECRET='n'.repeat(32);
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;assert.equal((await send('valid@example.org')).statusCode,503);process.env.SUPABASE_SERVICE_ROLE_KEY='test-service';
      for(let i=0;i<3;i++)assert.equal((await send('new@example.org')).statusCode,200);
      assert.equal((await send('new@example.org')).statusCode,429);
      // CONTRACT: campaign migrations revoke legacy public INSERT only after
      // the independently prepared new newsletter handler is deployed.
      for(const f of files.filter(f=>f.includes('girlhood')))await db.exec(await sql(f));
      assert.equal((await send('after@example.org','127.0.0.2')).statusCode,200);
      assert.equal((await send('existing@example.org','127.0.0.2')).statusCode,200);
      assert.equal((await db.query<{n:number}>("select count(*)::int as n from public.subscribers where email='existing@example.org'")).rows[0].n,1);
      await db.exec('set role anon');
      await assert.rejects(db.exec("insert into public.subscribers(email) values('bypass@example.org')"));
      await assert.rejects(db.exec("select public.newsletter_signup('bypass@example.org',repeat('a',64))"));
      await assert.rejects(db.exec('select * from public.girlhood_submissions'));
      await db.exec('reset role');
    } finally {stub.mock.restore();for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
    await db.exec(`insert into auth.users values('${admin}');insert into public.admin_users(id,email) values('${admin}','admin@example.org');
      insert into public.programs(title,slug,page_template) values('Girlhood Should Be Hers','girlhood','girlhood');`);
    await assert.rejects(db.exec("insert into public.programs(title,slug,page_template) values('Duplicate','other','girlhood')"));
    await assert.rejects(db.exec("update public.programs set slug='renamed' where slug='girlhood'"));
    await db.exec("update public.programs set title='Updated description title' where slug='girlhood'");
    await assert.rejects(db.exec("delete from public.programs where slug='girlhood'"));
    await db.exec("insert into public.programs(title,slug,page_template) values('Temporary standard program','temporary','standard')");
    assert.equal((await db.query("delete from public.programs where slug='temporary' returning id")).rows.length,1);
    await db.exec(`insert into public.girlhood_submissions(public_reference,withdrawal_hash,age,perspective,public_category,language,girlhood_response,consent_version,country) values('TEST','private',12,'own','girl','en','A world full of possibilities','test','Private Country');`);
    assert.equal((await db.query<{country:string|null}>("select country from public.girlhood_submissions where public_reference='TEST'")).rows[0].country,'Private Country');
    await assert.rejects(db.exec("update public.girlhood_submissions set age=18 where public_reference='TEST'"));
    await assert.rejects(db.exec("update public.girlhood_submissions set consent_public=true where public_reference='TEST'"));
    // Two moderators use the same version: first succeeds, second affects 0 rows.
    const old=(await db.query<{version:string}>("select updated_at::text as version from public.girlhood_submissions where public_reference='TEST'")).rows[0].version;
    await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${admin}',false);`);
    const update="update public.girlhood_submissions set moderation_notes=$1 where public_reference='TEST' and updated_at=$2::timestamptz returning id";
    assert.equal((await db.query(update,['first',old])).rows.length,1);
    assert.equal((await db.query(update,['second',old])).rows.length,0);
    await assert.rejects(db.exec('select withdrawal_hash,request_token_hash from public.girlhood_submissions'));
    await db.exec("update public.girlhood_submissions set moderation_status='withdrawn' where public_reference='TEST';reset role;");
    await assert.rejects(db.exec("update public.girlhood_submissions set withdrawn_at=null where public_reference='TEST'"));
    assert.equal((await db.query<{n:number}>('select count(*)::int as n from public.girlhood_public_responses')).rows[0].n,0);
  } finally { await db.close(); }
});



test('documented fresh-install order applies every migration without production data', async()=>{
  const db=new PGlite();
  try{
    await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
      create schema auth;create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      grant usage on schema auth to anon,authenticated,service_role;
      create schema storage;create table storage.buckets(id text primary key,file_size_limit bigint,allowed_mime_types text[]);`);
    const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
    for(const f of files.filter(f=>f<'202610'))await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
    await db.exec(await readFile('supabase/bootstrap/legacy_prerequisites.sql','utf8'));
    for(const f of files.filter(f=>f>='202610'))await db.exec(await readFile('supabase/migrations/'+f,'utf8'));
    await db.exec('set role service_role');
    assert.equal((await db.query<{ready:boolean}>('select public.newsletter_backend_ready() as ready')).rows[0].ready,true);
    assert.equal((await db.query<{allowed:boolean}>("select public.newsletter_signup('fresh@example.org',repeat('a',64)) as allowed")).rows[0].allowed,true);
    await db.exec('reset role;set role anon');
    await assert.rejects(db.exec('select * from public.girlhood_submissions'));
    await assert.rejects(db.exec("insert into public.subscribers(email) values('bypass@example.org')"));
  }finally{await db.close();}
});
