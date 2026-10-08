import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';

/**
 * Consolidated read-only content endpoint.
 *
 * Replaces six separate serverless functions (stats, bureau, partners,
 * slideshow, site-content, site-images) to stay within Vercel's Hobby-plan
 * limit of 12 functions. The original public URLs (/api/stats, etc.) are
 * preserved via rewrites in vercel.json, which map to
 * /api/content?resource=<name>.
 *
 * SECURITY: `resource` is only ever used as a key into the ALLOWLIST below.
 * Table names, columns and ordering are fixed in code and are never derived
 * from request input.
 */

type Row = Record<string, unknown>;

interface ResourceConfig {
  table: string;
  select: string;
  orderBy?: string;
  transform: (rows: Row[]) => unknown;
}

const identity = (rows: Row[]) => rows;

const ALLOWLIST: ReadonlyMap<string, ResourceConfig> = new Map<string, ResourceConfig>([
  ['stats', { table: 'site_stats', select: '*', orderBy: 'display_order', transform: identity }],
  ['bureau', { table: 'bureau', select: '*', orderBy: 'display_order', transform: identity }],
  ['partners', { table: 'partners', select: '*', orderBy: 'display_order', transform: identity }],
  ['slideshow', { table: 'home_slideshow', select: '*', orderBy: 'display_order', transform: identity }],
  [
    'site-content',
    {
      table: 'site_content',
      select: 'key, content',
      // key -> content map, for O(1) lookups per content block.
      transform: (rows) => {
        const map: Record<string, string> = {};
        for (const row of rows) map[row.key as string] = row.content as string;
        return map;
      },
    },
  ],
  [
    'site-images',
    {
      table: 'site_images',
      select: '*',
      // placement_key -> { image_url, alt_text } map.
      transform: (rows) => {
        const map: Record<string, { image_url: string; alt_text: string | null }> = {};
        for (const row of rows) {
          map[row.placement_key as string] = {
            image_url: row.image_url as string,
            alt_text: (row.alt_text as string | null) ?? null,
          };
        }
        return map;
      },
    },
  ],
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = Array.isArray(req.query.resource) ? req.query.resource[0] : req.query.resource;
  const config = typeof raw === 'string' ? ALLOWLIST.get(raw) : undefined;
  if (!config) {
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    const supabase = getSupabaseClient();
    let query = supabase.from(config.table).select(config.select);
    if (config.orderBy) query = query.order(config.orderBy);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(config.transform((data ?? []) as unknown as Row[]));
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
