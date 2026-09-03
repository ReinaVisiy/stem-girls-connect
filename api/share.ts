import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const postId = Number(req.body?.postId);
  if (!Number.isInteger(postId) || postId <= 0) {
    return res.status(400).json({ error: 'postId is required' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('increment_share_count', { p_post_id: postId });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ shareCount: data });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
