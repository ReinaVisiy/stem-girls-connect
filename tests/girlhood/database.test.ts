import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
test("PostgreSQL migration, grants, privacy, moderation, withdrawal, counts and durable limits", async (t) => {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key);",
  );
  await db.exec(
    "create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create function public.is_admin() returns boolean language sql stable as $$ select auth.uid() = '00000000-0000-0000-0000-000000000001'::uuid $$; grant usage on schema auth to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;",
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261008000000_girlhood_campaign.sql",
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261008012326_girlhood_hardening.sql",
      "utf8",
    ),
  );
  await db.exec(
    "create table public.subscribers(id bigint generated always as identity primary key, email text unique not null); alter table public.subscribers enable row level security; grant all on public.subscribers to anon, authenticated;",
  );
  await db.exec(
    await readFile(
      "supabase/migrations/20261008105340_girlhood_receipts_identity_newsletter.sql",
      "utf8",
    ),
  );
  const admin = "00000000-0000-0000-0000-000000000001";
  await db.query<Record<string, unknown>>(
    "insert into auth.users values ($1)",
    [admin],
  );
  const insert = async (
    age: number,
    consent = true,
    status = "approved",
    perspective = "own",
  ) => {
    const result = await db.query<{ id: string }>(
      "insert into public.girlhood_submissions (public_reference,withdrawal_hash,age,perspective,public_category,language,girlhood_response,public_girlhood_response,consent_public,consent_display_name,consent_display_country,consent_display_city,consent_reuse,consent_analysis,consent_version,moderation_status,display_name,city_region,country) values (gen_random_uuid()::text,'hash',$1,$4,'woman','en','Freedom to learn','Freedom to learn',$2,true,true,true,true,true,'test',$3,'Nickname','City','Country') returning id",
      [age, consent, status, perspective],
    );
    return result.rows[0].id;
  };
  const ids = new Map<number, string>();
  for (const age of [0, 8, 12, 13, 17, 18, 24, 25, 120])
    ids.set(age, await insert(age));
  await insert(30, false);
  await insert(20, true, "pending");
  await insert(20, true, "approved_redacted", "ally");
  await t.test(
    "public projection excludes children, unconsented and pending records",
    async () => {
      const visible = await db.query<Record<string, unknown>>(
        "select * from public.girlhood_public_responses",
      );
      assert.equal(visible.rows.length, 7);
      for (const row of visible.rows) {
        assert.ok(!("age" in row));
        assert.ok(!("withdrawal_hash" in row));
        assert.ok(!("girlhood_response" in row));
      }
      const child = (
        await db.query<Record<string, unknown>>(
          "select * from public.girlhood_submissions where age=8",
        )
      ).rows[0];
      assert.equal(child.consent_public, false);
      assert.equal(child.display_name, null);
      assert.equal(child.city_region, null);
      assert.equal(child.consent_display_country, false);
      assert.deepEqual(
        (
          await db.query<Record<string, unknown>>(
            "select public_category from public.girlhood_submissions where age in (13,18,24,25) order by age",
          )
        ).rows.map((r) => r.public_category),
        ["girl", "young_woman", "young_woman", "woman"],
      );
    },
  );
  await t.test(
    "anonymous and ordinary signed-in users cannot read responses",
    async () => {
      await db.exec("set role anon");
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "select public_reference from public.girlhood_submissions",
        ),
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "select * from public.girlhood_public_responses",
        ),
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "select public.girlhood_rate_limit(repeat('a',64),20)",
        ),
      );
      await db.exec(
        "reset role; set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false)",
      );
      assert.equal(
        (
          await db.query<Record<string, unknown>>(
            "select public_reference from public.girlhood_submissions",
          )
        ).rows.length,
        0,
      );
      await db.exec("reset role");
    },
  );
  await t.test(
    "admin moderates but cannot read hashes, change consent, or forge audit events",
    async () => {
      await db.exec(
        "set role authenticated; select set_config('request.jwt.claim.sub','" +
          admin +
          "',false)",
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "select withdrawal_hash from public.girlhood_submissions",
        ),
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set age=18 where id=$1",
          [ids.get(8)],
        ),
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set consent_public=true where id=$1",
          [ids.get(8)],
        ),
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "insert into public.girlhood_moderation_events(submission_id,moderator_id,new_status) values($1,$2,'approved')",
          [ids.get(13), admin],
        ),
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set featured=true where id=$1",
          [ids.get(8)],
        ),
      );
      await db.query<Record<string, unknown>>(
        "update public.girlhood_submissions set moderation_status='approved_redacted',public_girlhood_response='A safer public response' where id=$1",
        [ids.get(13)],
      );
      assert.equal(
        (
          await db.query<Record<string, unknown>>(
            "select reviewed_by from public.girlhood_submissions where id=$1",
            [ids.get(13)],
          )
        ).rows[0].reviewed_by,
        admin,
      );
      assert.equal(
        (
          await db.query<Record<string, unknown>>(
            "select * from public.girlhood_moderation_events where submission_id=$1",
            [ids.get(13)],
          )
        ).rows.length,
        1,
      );
    },
  );
  await t.test(
    "escalation requires an owner, reason and resolution",
    async () => {
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set moderation_status='escalated' where id=$1",
          [ids.get(17)],
        ),
      );
      await db.query<Record<string, unknown>>(
        "update public.girlhood_submissions set moderation_status='escalated',moderation_reason='Needs safeguarding review',escalation_owner='Assigned lead' where id=$1",
        [ids.get(17)],
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set moderation_status='approved' where id=$1",
          [ids.get(17)],
        ),
      );
      await db.query<Record<string, unknown>>(
        "update public.girlhood_submissions set moderation_status='approved',escalation_resolution='Reviewed by assigned lead' where id=$1",
        [ids.get(17)],
      );
    },
  );
  await t.test(
    "admin withdrawal is final and records reuse removal follow-up",
    async () => {
      await db.query<Record<string, unknown>>(
        "update public.girlhood_submissions set moderation_status='withdrawn' where id=$1",
        [ids.get(13)],
      );
      const row = (
        await db.query<Record<string, unknown>>(
          "select withdrawn_at,consent_public,consent_reuse,consent_analysis,reuse_cleanup_required from public.girlhood_submissions where id=$1",
          [ids.get(13)],
        )
      ).rows[0];
      assert.ok(row.withdrawn_at);
      assert.equal(row.consent_public, false);
      assert.equal(row.consent_reuse, false);
      assert.equal(row.consent_analysis, false);
      assert.equal(row.reuse_cleanup_required, true);
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set moderation_status='approved' where id=$1",
          [ids.get(13)],
        ),
      );
      await db.exec(
        "reset role; select set_config('request.jwt.claim.sub','',false); set role service_role",
      );
      assert.equal(
        (
          await db.query<{ n: number }>(
            "select count(*)::int n from public.girlhood_public_responses",
          )
        ).rows[0].n,
        6,
      );
    },
  );
  await t.test(
    "participant withdrawal is idempotent and cannot be reversed",
    async () => {
      await db.query<Record<string, unknown>>(
        "update public.girlhood_submissions set moderation_status='withdrawn' where id=$1",
        [ids.get(18)],
      );
      await db.query<Record<string, unknown>>(
        "update public.girlhood_submissions set moderation_status='withdrawn' where id=$1",
        [ids.get(18)],
      );
      await assert.rejects(() =>
        db.query<Record<string, unknown>>(
          "update public.girlhood_submissions set moderation_status='approved',withdrawn_at=null where id=$1",
          [ids.get(18)],
        ),
      );
    },
  );
  await t.test("shared atomic rate limit enforces budget", async () => {
    for (let i = 0; i < 5; i++) {
      const r = await db.query<{ ok: boolean }>(
        "select public.girlhood_rate_limit(repeat('a',64),3) ok",
      );
      assert.equal(r.rows[0].ok, i < 3);
    }
  });
  await t.test(
    "aggregates count all rows beyond the REST row cap",
    async () => {
      await db.exec("reset role");
      await db.exec(
        "insert into public.girlhood_submissions(public_reference,withdrawal_hash,age,perspective,public_category,language,girlhood_response,public_girlhood_response,consent_public,consent_version,moderation_status) select 'bulk-'||n,'hash',18,'own','young_woman','en','Freedom to explore','Freedom to explore',true,'test','approved' from generate_series(1,1050) n",
      );
      await db.exec("set role service_role");
      assert.equal(
        (
          await db.query<{ stats: { publicVoices: number } }>(
            "select public.girlhood_public_stats() stats",
          )
        ).rows[0].stats.publicVoices,
        1055,
      );
    },
  );
  await t.test(
    "retention deletes expired contributions and their audit events only",
    async () => {
      await db.exec("reset role");
      await db.query(
        "update public.girlhood_submissions set created_at=now()-interval '13 months' where id=$1",
        [ids.get(13)],
      );
      await db.exec("set role service_role");
      assert.equal(
        (
          await db.query<{ n: number }>(
            "select public.girlhood_expire_records() n",
          )
        ).rows[0].n,
        1,
      );
      assert.equal(
        (
          await db.query(
            "select id from public.girlhood_moderation_events where submission_id=$1",
            [ids.get(13)],
          )
        ).rows.length,
        0,
      );
      assert.equal(
        (
          await db.query(
            "select id from public.girlhood_submissions where id=$1",
            [ids.get(18)],
          )
        ).rows.length,
        1,
      );
    },
  );
  await t.test(
    "moderated public identity is separate, consent-gated, and audited",
    async () => {
      await db.exec("reset role");
      const id = await insert(17);
      let result = await db.query<any>(
        "select safe_display_name,safe_country,safe_city from girlhood_public_responses where public_reference=(select public_reference from girlhood_submissions where id=$1)",
        [id],
      );
      assert.deepEqual(result.rows[0], {
        safe_display_name: "Anonymous",
        safe_country: null,
        safe_city: null,
      });
      await db.exec(
        "set role authenticated; select set_config('request.jwt.claim.sub','" +
          admin +
          "',false)",
      );
      await db.query(
        "update girlhood_submissions set public_display_name='Safe nickname',public_country='Broad country',public_city=null where id=$1",
        [id],
      );
      await assert.rejects(() =>
        db.query(
          "select request_token_hash,request_payload_hash from girlhood_submissions",
        ),
      );
      await assert.rejects(() =>
        db.query(
          "update girlhood_submissions set display_name='Changed private identity' where id=$1",
          [id],
        ),
      );
      const events = await db.query<any>(
        "select changes from girlhood_moderation_events where submission_id=$1",
        [id],
      );
      assert.ok(events.rows.some((r) => r.changes.public_display_name));
      await db.exec(
        "reset role; select set_config('request.jwt.claim.sub','',false)",
      );
      result = await db.query<any>(
        "select safe_display_name,safe_country,safe_city from girlhood_public_responses where public_reference=(select public_reference from girlhood_submissions where id=$1)",
        [id],
      );
      assert.equal(result.rows[0].safe_display_name, "Safe nickname");
      assert.equal(result.rows[0].safe_city, null);
      await db.query(
        "update girlhood_submissions set consent_display_name=false,consent_display_country=false where id=$1",
        [id],
      );
      result = await db.query<any>(
        "select safe_display_name,safe_country from girlhood_public_responses where public_reference=(select public_reference from girlhood_submissions where id=$1)",
        [id],
      );
      assert.deepEqual(result.rows[0], {
        safe_display_name: "Anonymous",
        safe_country: null,
      });
    },
  );
  await t.test(
    "recovery token uniqueness is enforced in PostgreSQL",
    async () => {
      await db.exec("reset role");
      const one = await insert(20),
        two = await insert(21);
      await db.query(
        "update girlhood_submissions set request_token_hash=repeat('f',64) where id=$1",
        [one],
      );
      await assert.rejects(() =>
        db.query(
          "update girlhood_submissions set request_token_hash=repeat('f',64) where id=$1",
          [two],
        ),
      );
    },
  );
  await t.test(
    "newsletter cannot bypass the API using public credentials",
    async () => {
      await db.exec("set role anon");
      await assert.rejects(() =>
        db.query("insert into subscribers(email) values('bypass@example.org')"),
      );
      await assert.rejects(() => db.query("select * from subscribers"));
      await db.exec("reset role; set role authenticated");
      await assert.rejects(() =>
        db.query("insert into subscribers(email) values('bypass@example.org')"),
      );
      await db.exec(
        "reset role; select set_config('request.jwt.claim.sub','',false); set role service_role",
      );
      await db.query(
        "insert into subscribers(email) values('server@example.org')",
      );
    },
  );
  await db.close();
});
