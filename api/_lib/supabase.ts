import { createClient } from '@supabase/supabase-js';

/**
 * Server-side only. Never imported from src/ — these env vars are
 * intentionally NOT prefixed with VITE_ so they never reach the
 * client bundle. See SGC-website-build-spec.md Section 2.
 */
export function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  }

  return createClient(url, key);
}
