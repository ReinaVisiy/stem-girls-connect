import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('site_images').select('*');

    if (error) return res.status(500).json({ error: error.message });

    // Returned as a placement_key -> row map so the frontend can do
    // O(1) lookups instead of scanning an array for each image slot.
    const map: Record<string, { image_url: string; alt_text: string | null }> = {};
    for (const row of data) {
      map[row.placement_key] = { image_url: row.image_url, alt_text: row.alt_text };
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(map);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
