/**
 * Single source of truth for turning a stored report (bucket path +
 * friendly filename) into the two URLs the UI needs. Pure and
 * dependency-free so it can be imported by both the browser (admin
 * panel) and the Vercel API routes.
 *
 * Reports live in the public `site-assets` bucket. The database stores
 * `file_path` (e.g. "reports/<uuid>.pdf") and `download_name`
 * (e.g. "Annual-Impact-Report-2026.pdf"). The legacy `file_url` column
 * is only used as a fallback for rows that have no `file_path` yet.
 */

export const REPORTS_BUCKET = 'site-assets';

export interface ReportUrlSource {
  file_path?: string | null;
  download_name?: string | null;
  file_url?: string | null;
  title?: string | null;
}

export interface ReportUrls {
  view_url: string;
  download_url: string;
}

/** Report fields that are safe to return from public API routes. */
export interface PublicReport extends ReportUrls {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

/** "My Report: 2026!" -> "My-Report-2026.pdf" */
export function makeDownloadName(title: string): string {
  const base = title
    .trim()
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'Report'}.pdf`;
}

function encodePath(path: string): string {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function buildReportUrls(supabaseUrl: string, report: ReportUrlSource): ReportUrls | null {
  const base = supabaseUrl.replace(/\/$/, '');

  const viewUrl = report.file_path
    ? `${base}/storage/v1/object/public/${REPORTS_BUCKET}/${encodePath(report.file_path)}`
    : report.file_url || null;

  if (!viewUrl) return null;

  const filename = report.download_name || makeDownloadName(report.title ?? 'Report');
  return {
    view_url: viewUrl,
    download_url: `${viewUrl}?download=${encodeURIComponent(filename)}`,
  };
}

interface ReportRow extends ReportUrlSource {
  id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

/** Shapes a DB row into the public API response (no storage internals). */
export function toPublicReport(supabaseUrl: string, row: ReportRow): PublicReport | null {
  const urls = buildReportUrls(supabaseUrl, row);
  if (!urls) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    start_date: row.start_date,
    end_date: row.end_date,
    display_order: row.display_order,
    ...urls,
  };
}
