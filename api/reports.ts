import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { toPublicReport, type PublicReport } from '../src/lib/reportUrls.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('reports')
      .select('id, title, description, start_date, end_date, display_order, file_path, download_name, file_url')
      .order('display_order');

    if (error) return res.status(500).json({ error: error.message });

    const supabaseUrl = process.env.SUPABASE_URL as string;
    const reports = (data ?? [])
      .map((row) => toPublicReport(supabaseUrl, row))
      .filter((r): r is PublicReport => r !== null);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(reports);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
