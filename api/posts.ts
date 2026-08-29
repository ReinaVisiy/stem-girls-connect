import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();
    const { slug, limit } = req.query;

    if (slug) {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', Array.isArray(slug) ? slug[0] : slug)
        .eq('published', true)
        .single();

      if (error) return res.status(404).json({ error: 'Post not found' });
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      return res.status(200).json(data);
    }

    let query = supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('published_at', { ascending: false });

    if (limit) {
      const n = parseInt(Array.isArray(limit) ? limit[0] : limit, 10);
      if (!isNaN(n) && n > 0) query = query.limit(n);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
