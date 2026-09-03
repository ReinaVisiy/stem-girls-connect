import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseClient } from './_lib/supabase.js';
import { organization } from '../src/config/organization.js';

interface StaticPage {
  path: string;
  changefreq: string;
  priority: string;
}

const STATIC_PAGES: StaticPage[] = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/activities', changefreq: 'monthly', priority: '0.8' },
  { path: '/impact', changefreq: 'monthly', priority: '0.8' },
  { path: '/blog', changefreq: 'weekly', priority: '0.7' },
  { path: '/join', changefreq: 'monthly', priority: '0.7' },
  { path: '/contact', changefreq: 'monthly', priority: '0.6' },
  { path: '/donate', changefreq: 'monthly', priority: '0.7' },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, changefreq: string, priority: string, lastmod?: string) {
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

/**
 * Serves /sitemap.xml (see the rewrite in vercel.json). Static pages are
 * listed here directly; blog posts are pulled live from Supabase on every
 * request, so a newly published post appears without needing a redeploy.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end('Method not allowed');
  }

  const siteUrl = organization.website.replace(/\/$/, '');

  // No lastmod for static pages: we don't track real per-page modification
  // dates, and stamping today's date on every request just tells crawlers
  // "this changed today" even when it didn't, which erodes trust in the
  // signal. Blog posts DO have a real date (published_at), so those keep it.
  const entries = STATIC_PAGES.map((p) => urlEntry(`${siteUrl}${p.path}`, p.changefreq, p.priority));

  try {
    const supabase = getSupabaseClient();
    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug, published_at')
      .eq('published', true);

    if (!error && posts) {
      for (const post of posts) {
        const lastmod = post.published_at ? post.published_at.slice(0, 10) : undefined;
        entries.push(urlEntry(`${siteUrl}/blog/${post.slug}`, 'monthly', '0.6', lastmod));
      }
    }
  } catch {
    // If Supabase is unreachable, still serve the static pages rather than
    // failing the whole sitemap.
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).send(xml);
}
