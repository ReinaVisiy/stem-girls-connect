import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side client, used ONLY under /admin. Public pages never call
 * Supabase directly — they go through /api (see api/_lib/supabase.ts).
 *
 * This is safe to expose (hence the VITE_ prefix): the anon key alone
 * grants nothing. Every write is gated by Postgres RLS policies keyed
 * off the signed-in user's membership in admin_users (see is_admin()
 * in the database) — the key being public doesn't matter, only a
 * signed-in admin session does.
 */
const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — admin panel will not function.');
}

export const supabase = createClient(url ?? '', key ?? '');
