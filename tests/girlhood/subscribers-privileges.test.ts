import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PGlite } from '@electric-sql/pglite';

const HARDENING = '20261008194500_newsletter_subscribers_privilege_hardening.sql';
const ADMIN = '00000000-0000-0000-0000-000000000001';
const MEMBER = '00000000-0000-0000-0000-000000000002';
const DENIED = /permission denied/i;

async function install(db: PGlite, options: { withHardening: boolean }) {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
    create schema auth;create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to anon,authenticated,service_role;
    create schema storage;create table storage.buckets(id text primary key,file_size_limit bigint,allowed_mime_types text[]);
    insert into storage.buckets(id) values('site-assets');`);
  const files = (await readdir('supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
  const read = (f: string) => readFile(join('supabase/migrations', f), 'utf8');
  for (const f of files.filter((f) => f < '202610')) await db.exec(await read(f));
  await db.exec(await readFile('supabase/bootstrap/legacy_prerequisites.sql', 'utf8'));
  // Supabase grants every new table to the API roles with ALL by default.
  await db.exec('grant all on all tables in schema public to anon, authenticated, service_role');
  for (const f of files.filter((f) => f >= '202610' && f !== HARDENING)) await db.exec(await read(f));
  if (options.withHardening) await db.exec(await read(HARDENING));
  await db.exec(`insert into auth.users values('${ADMIN}'),('${MEMBER}');
    insert into public.admin_users(id,email) values('${ADMIN}','admin@example.org');`);
}

async function as<T>(db: PGlite, role: string, sub: string | null, run: () => Promise<T>): Promise<T> {
  await db.exec(`set role ${role}`);
  try {
    if (sub) await db.query("select set_config('request.jwt.claim.sub',$1,false)", [sub]);
    return await run();
  } finally {
    await db.exec("reset role; select set_config('request.jwt.claim.sub','',false)");
  }
}

async function seed(db: PGlite, emails: string[]) {
  let i = 0;
  for (const email of emails) {
    const fingerprint = String.fromCharCode(97 + i++).repeat(64);
    await as(db, 'service_role', null, () => db.query('select public.newsletter_signup($1,$2)', [email, fingerprint]));
  }
}

const count = async (db: PGlite) => (await db.query<{ n: number }>('select count(*)::int as n from public.subscribers')).rows[0].n;
const can = async (db: PGlite, role: string, privilege: string) =>
  (await db.query<{ ok: boolean }>('select has_table_privilege($1,$2,$3) as ok', [role, 'public.subscribers', privilege])).rows[0].ok;

test('baseline: default Supabase grants leave destructive privileges that RLS cannot stop', async () => {
  const db = new PGlite();
  try {
    await install(db, { withHardening: false });
    await seed(db, ['one@example.org', 'two@example.org']);
    assert.equal(await can(db, 'authenticated', 'TRUNCATE'), true, 'test setup must reproduce the exposure');
    assert.equal(await can(db, 'authenticated', 'UPDATE'), true);
    // A signed-in user who is not an administrator can wipe the list.
    await as(db, 'authenticated', MEMBER, () => db.exec('truncate public.subscribers'));
    assert.equal(await count(db), 0);
  } finally {
    await db.close();
  }
});

test('hardening removes TRUNCATE/UPDATE while admin list, export and delete keep working', async () => {
  const db = new PGlite();
  try {
    await install(db, { withHardening: true });
    await seed(db, ['one@example.org', 'two@example.org', 'three@example.org']);

    // Privilege catalogue.
    for (const privilege of ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'SELECT']) {
      assert.equal(await can(db, 'anon', privilege), false, `anon must not hold ${privilege}`);
    }
    assert.deepEqual(
      await Promise.all(['SELECT', 'DELETE'].map((p) => can(db, 'authenticated', p))),
      [true, true],
    );
    for (const privilege of ['INSERT', 'UPDATE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
      assert.equal(await can(db, 'authenticated', privilege), false, `authenticated must not hold ${privilege}`);
    }
    assert.equal(await can(db, 'service_role', 'INSERT'), true);
    for (const privilege of ['UPDATE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
      assert.equal(await can(db, 'service_role', privilege), false, `service_role must not hold ${privilege}`);
    }

    // Admin panel behaviour: exactly the two queries AdminSubscribers.tsx issues.
    const listed = await as(db, 'authenticated', ADMIN, () =>
      db.query<{ id: number; email: string; subscribed_at: string }>(
        'select * from public.subscribers order by subscribed_at desc',
      ),
    );
    assert.equal(listed.rows.length, 3);
    assert.deepEqual(Object.keys(listed.rows[0]).sort(), ['email', 'id', 'subscribed_at']);
    const target = listed.rows[0].id;
    const removed = await as(db, 'authenticated', ADMIN, () =>
      db.query('delete from public.subscribers where id=$1 returning id', [target]),
    );
    assert.equal(removed.rows.length, 1);
    assert.equal(await count(db), 2);

    // Admin still cannot do anything beyond list and delete.
    await as(db, 'authenticated', ADMIN, async () => {
      await assert.rejects(db.exec('truncate public.subscribers'), DENIED);
      await assert.rejects(db.exec("update public.subscribers set email='x@example.org'"), DENIED);
      await assert.rejects(db.exec("insert into public.subscribers(email) values('direct@example.org')"), DENIED);
    });
    assert.equal(await count(db), 2);

    // A signed-in non-admin sees and removes nothing, and cannot truncate.
    await as(db, 'authenticated', MEMBER, async () => {
      assert.equal((await db.query('select * from public.subscribers')).rows.length, 0);
      assert.equal((await db.query('delete from public.subscribers returning id')).rows.length, 0);
      await assert.rejects(db.exec('truncate public.subscribers'), DENIED);
      await assert.rejects(db.exec("update public.subscribers set email='x@example.org'"), DENIED);
    });
    assert.equal(await count(db), 2);

    // Anonymous visitors have no access at all.
    await as(db, 'anon', null, async () => {
      await assert.rejects(db.query('select * from public.subscribers'), DENIED);
      await assert.rejects(db.exec('delete from public.subscribers'), DENIED);
      await assert.rejects(db.exec('truncate public.subscribers'), DENIED);
      await assert.rejects(db.exec("insert into public.subscribers(email) values('anon@example.org')"), DENIED);
    });
    assert.equal(await count(db), 2);

    // Newsletter signup (service role RPC) is unaffected, duplicates stay silent.
    await as(db, 'service_role', null, async () => {
      const first = await db.query<{ ok: boolean }>("select public.newsletter_signup('fresh@example.org',repeat('z',64)) as ok");
      assert.equal(first.rows[0].ok, true);
      const duplicate = await db.query<{ ok: boolean }>("select public.newsletter_signup('fresh@example.org',repeat('y',64)) as ok");
      assert.equal(duplicate.rows[0].ok, true);
      await assert.rejects(db.exec('truncate public.subscribers'), DENIED);
      await assert.rejects(db.exec("update public.subscribers set email='x@example.org'"), DENIED);
    });
    assert.equal(await count(db), 3);
  } finally {
    await db.close();
  }
});

test('subscriber policies allow only admin select and delete, and the migration is re-runnable', async () => {
  const db = new PGlite();
  try {
    await install(db, { withHardening: true });
    await db.exec(await readFile(join('supabase/migrations', HARDENING), 'utf8'));
    const policies = await db.query<{ policyname: string; cmd: string }>(
      "select policyname, cmd from pg_policies where schemaname='public' and tablename='subscribers' order by cmd",
    );
    assert.deepEqual(policies.rows.map((r) => r.cmd), ['DELETE', 'SELECT']);
    assert.equal(
      (await db.query<{ rowsecurity: boolean }>("select relrowsecurity as rowsecurity from pg_class where oid='public.subscribers'::regclass")).rows[0].rowsecurity,
      true,
    );
    // Even if a privilege were re-granted by mistake, RLS still blocks writes.
    await db.exec('grant insert, update on public.subscribers to authenticated');
    await seed(db, ['keep@example.org']);
    await as(db, 'authenticated', ADMIN, async () => {
      await assert.rejects(db.exec("insert into public.subscribers(email) values('rls@example.org')"), /row-level security/i);
      assert.equal((await db.query("update public.subscribers set email='x@example.org' returning id")).rows.length, 0);
    });
    assert.equal(await count(db), 1);
  } finally {
    await db.close();
  }
});

test('application code only lists and deletes subscribers, matching the granted privileges', async () => {
  const allowed = new Set(['from', 'select', 'order', 'delete', 'eq']);
  const walk = async (dir: string): Promise<string[]> => {
    const out: string[] = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) out.push(...(await walk(path)));
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(path);
    }
    return out;
  };
  const used = new Set<string>();
  for (const file of [...(await walk('src')), ...(await walk('api')), ...(await walk('shared'))]) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(/\.from\(\s*['"]subscribers['"]\s*\)([\s\S]*?);/g)) {
      for (const call of match[1].matchAll(/\.(\w+)\s*\(/g)) {
        used.add(call[1]);
        assert.ok(allowed.has(call[1]), `${file} calls .${call[1]}() on subscribers, which the hardened grants do not allow`);
      }
    }
  }
  assert.ok(used.has('select') && used.has('delete'), 'admin panel list and delete queries must remain present');
});
