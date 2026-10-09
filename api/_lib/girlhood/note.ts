import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseServiceClient } from '../supabase.js';
import { PUBLIC_NOTE_FIELDS } from './public-fields.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const unavailable = () => res.status(404).json({ error: 'Note unavailable' });
  const reference = req.query.reference;
  if (typeof reference !== 'string' || !/^[A-Za-z0-9-]{1,80}$/.test(reference)) return unavailable();
  try {
    // This view alone enforces moderation, age, consent and withdrawal eligibility.
    const { data, error } = await getSupabaseServiceClient()
      .from('girlhood_public_responses').select(PUBLIC_NOTE_FIELDS)
      .eq('public_reference', reference).maybeSingle();
    if (error) throw error;
    if (!data) return unavailable();
    return res.status(200).json({ response: data });
  } catch {
    return res.status(503).json({ error: 'Voices unavailable / Voix indisponibles' });
  }
}
