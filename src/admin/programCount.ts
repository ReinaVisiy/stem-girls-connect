import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Total number of programs, INCLUDING unpublished drafts.
 *
 * Reads through the signed-in admin's Supabase session (not the public
 * /api/programs route), so Row Level Security decides what is counted:
 * admins see every row, anyone else only sees published ones. This keeps
 * draft information out of the public API entirely. A head-only count
 * request transfers no row data.
 *
 * Returns null on any failure so the dashboard can show a dash instead of
 * a misleading number.
 */
export async function fetchTotalProgramCount(client: Pick<SupabaseClient, 'from'>): Promise<number | null> {
  try {
    const { count, error } = await client.from('programs').select('id', { count: 'exact', head: true });
    if (error || count === null) return null;
    return count;
  } catch {
    return null;
  }
}
