import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('site_content').select('key, content');

    if (error) return res.status(500).json({ error: error.message });

    // Returned as a key -> content map, same shape as /api/site-images,
    // so the frontend can do O(1) lookups per content block.
    const map: Record<string, string> = {};
    for (const row of data) {
      map[row.key] = row.content;
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(map);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
