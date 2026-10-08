import type { PublicReport } from './reportUrls';

export type ProgramStatus = 'upcoming' | 'applications_open' | 'applications_closed' | 'ongoing' | 'completed';
export type ProgramCategory = 'training' | 'mentorship' | 'outreach' | 'campaign' | 'competition' | 'event' | 'other';

export const STATUS_LABELS: Record<ProgramStatus, string> = {
  upcoming: 'Upcoming',
  applications_open: 'Applications Open',
  applications_closed: 'Applications Closed',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

export const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  training: 'Training',
  mentorship: 'Mentorship',
  outreach: 'Outreach',
  campaign: 'Campaign',
  competition: 'Competition',
  event: 'Event',
  other: 'Other',
};

export interface ProgramContent {
  tagline?: string;
  overview?: string;
  quickFacts?: { label: string; value: string }[];
  phases?: { title: string; description: string }[];
  eligibility?: string[];
  benefits?: string[];
  faq?: { question: string; answer: string }[];
  contactNote?: string;
}

export interface ProgramSummary {
  id: number;
  title: string;
  slug: string;
  short_description: string | null;
  cover_image_url: string | null;
  status: ProgramStatus;
  category: ProgramCategory;
  page_template: string;
  start_date: string | null;
  end_date: string | null;
  application_open_date: string | null;
  application_close_date: string | null;
  location: string | null;
  format: string | null;
  cost: string | null;
  featured: boolean;
  display_order: number;
}

export interface ProgramDetail extends ProgramSummary {
  application_url: string | null;
  application_button_text: string | null;
  content: ProgramContent;
  reports: (PublicReport & { edition_label: string | null })[];
}

export const CURRENT_STATUSES: ProgramStatus[] = ['upcoming', 'applications_open', 'applications_closed', 'ongoing'];

export function statusLabel(status: string): string {
  return STATUS_LABELS[status as ProgramStatus] ?? status;
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category as ProgramCategory] ?? 'Other';
}

/** ISO date (YYYY-MM-DD) -> "March 5, 2026", parsed as a local date to avoid timezone shifts. */
export function formatProgramDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatMonthYear(iso: string): string | null {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/** Short timeframe for cards, e.g. "Mar 2026 – Jun 2026". */
export function formatTimeframe(start: string | null, end: string | null): string | null {
  const s = start ? formatMonthYear(start) : null;
  const e = end ? formatMonthYear(end) : null;
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s ?? e;
}

/** Only allow web and mailto links from admin-entered URLs (blocks javascript: etc). */
export function safeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^(https?:\/\/|mailto:)/i.test(trimmed) ? trimmed : null;
}
