import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { toPublicReport, type PublicReport } from '../src/lib/reportUrls.js';

const STATUSES = ['upcoming', 'applications_open', 'applications_closed', 'ongoing', 'completed'];

// Public fields only. Internal columns (published, created_at, updated_at) are never returned.
const LIST_FIELDS =
  'id, title, slug, short_description, cover_image_url, status, category, page_template, ' +
  'start_date, end_date, application_open_date, application_close_date, location, format, cost, ' +
  'featured, display_order';
const DETAIL_FIELDS = `${LIST_FIELDS}, application_url, application_button_text, content`;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * GET /api/programs                      -> published programs (list fields)
 * GET /api/programs?featured=true        -> only featured
 * GET /api/programs?status=ongoing       -> only that status
 * GET /api/programs?slug=hvi-stem        -> one published program + linked reports
 *
 * Uses the anon client, so RLS guarantees only published rows are visible;
 * the explicit published filter is belt and braces.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = getSupabaseClient();
    const slug = first(req.query.slug);

    if (slug) {
      const { data: program, error } = await supabase
        .from('programs')
        .select(DETAIL_FIELDS)
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) return res.status(500).json({ error: error.message });
      if (!program) return res.status(404).json({ error: 'Program not found' });

      const { data: links, error: linksError } = await supabase
        .from('program_reports')
        .select(
          'edition_label, display_order, reports(id, title, description, start_date, end_date, display_order, file_path, download_name, file_url)'
        )
        .eq('program_id', (program as unknown as { id: number }).id)
        .order('display_order');

      if (linksError) return res.status(500).json({ error: linksError.message });

      const supabaseUrl = process.env.SUPABASE_URL as string;
      const reports = (links ?? [])
        .map((link) => {
          const row = Array.isArray(link.reports) ? link.reports[0] : link.reports;
          if (!row) return null;
          const report = toPublicReport(supabaseUrl, row);
          return report ? { edition_label: link.edition_label as string | null, ...report } : null;
        })
        .filter((r): r is PublicReport & { edition_label: string | null } => r !== null);

      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
      return res.status(200).json({ ...program, reports });
    }

    let query = supabase
      .from('programs')
      .select(LIST_FIELDS)
      .eq('published', true)
      .order('display_order', { ascending: true })
      .order('start_date', { ascending: false, nullsFirst: false });

    if (first(req.query.featured) === 'true') query = query.eq('featured', true);

    const status = first(req.query.status);
    if (status) {
      if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(data ?? []);
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
