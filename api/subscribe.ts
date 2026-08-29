import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

// Simple, deliberately permissive plausibility check (not full RFC 5322):
// good enough to catch typos/empty submissions without rejecting valid
// addresses on edge-case formats.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ status: 'error', error: 'Please enter a valid email address.' });
  }

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('subscribers').insert({ email });

    if (error) {
      // Postgres unique_violation
      if (error.code === '23505') {
        return res.status(200).json({ status: 'duplicate' });
      }
      return res.status(500).json({ status: 'error', error: error.message });
    }

    return res.status(200).json({ status: 'success' });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
