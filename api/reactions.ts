import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

function parseId(value: unknown): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parseClientId(value: unknown): string | null {
  const s = Array.isArray(value) ? value[0] : value;
  // A client_id is just an opaque UUID the browser generates and stores
  // in localStorage — this isn't identity, it's only there so the same
  // visitor's like/dislike toggles instead of stacking. Loosely validated
  // to keep the column sane, not to authenticate anyone.
  return typeof s === 'string' && /^[\w-]{8,64}$/.test(s) ? s : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const supabase = getSupabaseClient();

  if (req.method === 'GET') {
    const postId = parseId(req.query.postId);
    const clientId = parseClientId(req.query.clientId);
    if (!postId || !clientId) return res.status(400).json({ error: 'postId and clientId are required' });

    const { data, error } = await supabase.rpc('get_post_reaction_summary', {
      p_post_id: postId,
      p_client_id: clientId,
    });
    if (error) return res.status(500).json({ error: error.message });

    const row = data?.[0] ?? { likes: 0, dislikes: 0, user_reaction: null };
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ likes: Number(row.likes), dislikes: Number(row.dislikes), userReaction: row.user_reaction });
  }

  if (req.method === 'POST') {
    const postId = parseId(req.body?.postId);
    const clientId = parseClientId(req.body?.clientId);
    const reaction = req.body?.reaction;

    if (!postId || !clientId) return res.status(400).json({ error: 'postId and clientId are required' });
    if (reaction !== null && reaction !== 'like' && reaction !== 'dislike') {
      return res.status(400).json({ error: 'reaction must be "like", "dislike", or null' });
    }

    const { data, error } = await supabase.rpc('set_post_reaction', {
      p_post_id: postId,
      p_client_id: clientId,
      p_reaction: reaction,
    });
    if (error) return res.status(500).json({ error: error.message });

    const row = data?.[0] ?? { likes: 0, dislikes: 0, user_reaction: null };
    return res.status(200).json({ likes: Number(row.likes), dislikes: Number(row.dislikes), userReaction: row.user_reaction });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
