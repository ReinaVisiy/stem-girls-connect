import {
  CATEGORY_LABELS, STATUS_LABELS, safeUrl,
  type ProgramCategory, type ProgramStatus,
} from './programs';

/**
 * Program JSON import. Pure, dependency-free, client-side only.
 *
 * The file is configuration/content only: it is parsed with JSON.parse,
 * every value is copied through an explicit allow-list with type and
 * length checks, and nothing is ever executed or published. The result
 * is used to prefill the normal admin form for the admin to inspect.
 */

export const MAX_IMPORT_BYTES = 200_000;

const MAX_SHORT = 500;
const MAX_LINE = 300;
const MAX_TEXT = 10_000;
const MAX_ITEMS = 50;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TEMPLATE_RE = /^[a-z0-9_]+$/;

/** Subset of the editor's form that an import may set. Never includes published/featured/cover. */
export interface ProgramImportValues {
  title?: string;
  slug?: string;
  shortDescription?: string;
  category?: ProgramCategory;
  status?: ProgramStatus;
  pageTemplate?: string;
  startDate?: string;
  endDate?: string;
  applicationOpenDate?: string;
  applicationCloseDate?: string;
  applicationUrl?: string;
  applicationButtonText?: string;
  location?: string;
  format?: string;
  cost?: string;
  tagline?: string;
  overview?: string;
  howToApply?: string;
  contactNote?: string;
  quickFacts?: { label: string; value: string }[];
  phases?: { title: string; description: string }[];
  objectives?: string[];
  eligibility?: string[];
  benefits?: string[];
  faq?: { question: string; answer: string }[];
}

export interface ProgramImportResult {
  values: ProgramImportValues;
  /** Things in the file that were wrong and were skipped. */
  errors: string[];
  /** Things that were adjusted or deliberately ignored. */
  warnings: string[];
  /** True when the file could not be read at all (nothing was imported). */
  fatal: boolean;
}

const KNOWN_TOP_LEVEL = new Set([
  'title', 'slug', 'short_description', 'category', 'status', 'page_template',
  'start_date', 'end_date', 'application_open_date', 'application_close_date',
  'application_url', 'application_button_text', 'location', 'format', 'cost', 'content',
]);
// Deliberately ignored, with an explanation, rather than reported as "unknown".
const IGNORED_WITH_REASON: Record<string, string> = {
  published: 'Visibility is never set by an import. Use the Published checkbox yourself.',
  featured: 'Featured is never set by an import. Use the Featured checkbox yourself.',
  cover_image_url: 'Images are not imported. Upload the cover image in the form.',
  reports: 'Reports are not imported. Link existing reports in the form.',
  display_order: 'Display order is managed from the programs list.',
  id: 'Ids are assigned automatically.',
};
const KNOWN_CONTENT = new Set(['tagline', 'overview', 'objectives', 'howToApply', 'quickFacts', 'phases', 'eligibility', 'benefits', 'faq', 'contactNote']);

const has = (obj: object, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function parseProgramJson(rawText: string): ProgramImportResult {
  const values: ProgramImportValues = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  const fail = (message: string): ProgramImportResult => ({ values: {}, errors: [message], warnings: [], fatal: true });

  let data: unknown;
  try {
    data = JSON.parse(rawText.replace(/^\uFEFF/, ''));
  } catch (e) {
    return fail(`This file is not valid JSON (${e instanceof Error ? e.message : 'parse error'}).`);
  }
  if (!isPlainObject(data)) return fail('The JSON must be a single object, for example { "title": "..." }.');

  // --- helpers that record problems against a field name ---
  const str = (field: string, v: unknown, max: number): string | null => {
    if (typeof v !== 'string') {
      errors.push(`"${field}" must be text.`);
      return null;
    }
    const t = v.trim();
    if (t.length > max) {
      errors.push(`"${field}" is too long (${t.length} characters, the limit is ${max}).`);
      return null;
    }
    return t;
  };
  const date = (field: string, v: unknown): string | null => {
    if (typeof v !== 'string' || !isRealDate(v.trim())) {
      errors.push(`"${field}" must be a real date written as YYYY-MM-DD (e.g. 2027-08-04).`);
      return null;
    }
    return v.trim();
  };

  for (const key of Object.keys(data)) {
    if (KNOWN_TOP_LEVEL.has(key)) continue;
    warnings.push(has(IGNORED_WITH_REASON, key) ? `"${key}" was ignored. ${IGNORED_WITH_REASON[key]}` : `Unknown field "${key}" was ignored.`);
  }

  // --- simple text fields ---
  if (has(data, 'title')) {
    const t = str('title', data.title, 200);
    if (t) values.title = t;
    else if (t === '') errors.push('"title" is empty.');
  }
  if (has(data, 'short_description')) {
    const t = str('short_description', data.short_description, MAX_SHORT);
    if (t !== null) values.shortDescription = t;
  }
  for (const [jsonKey, formKey, max] of [
    ['location', 'location', MAX_LINE], ['format', 'format', MAX_LINE], ['cost', 'cost', MAX_LINE],
    ['application_button_text', 'applicationButtonText', 80],
  ] as const) {
    if (has(data, jsonKey)) {
      const t = str(jsonKey, data[jsonKey], max);
      if (t !== null) values[formKey] = t;
    }
  }

  // --- slug ---
  if (has(data, 'slug')) {
    const raw = str('slug', data.slug, 120);
    if (raw) {
      if (SLUG_RE.test(raw)) values.slug = raw;
      else {
        const fixed = slugify(raw);
        if (fixed && SLUG_RE.test(fixed)) {
          values.slug = fixed;
          warnings.push(`"slug" was adjusted from "${raw}" to "${fixed}" so it works in a web address.`);
        } else errors.push(`"slug" "${raw}" cannot be turned into a valid web address.`);
      }
    }
  }

  // --- category / status (accepts "Training" or "training", "Applications Open" or "applications_open") ---
  if (has(data, 'category')) {
    const raw = str('category', data.category, 50);
    if (raw) {
      const key = normalizeKey(raw);
      if (has(CATEGORY_LABELS, key)) values.category = key as ProgramCategory;
      else errors.push(`"category" must be one of: ${Object.values(CATEGORY_LABELS).join(', ')}.`);
    }
  }
  if (has(data, 'status')) {
    const raw = str('status', data.status, 50);
    if (raw) {
      const key = normalizeKey(raw);
      if (has(STATUS_LABELS, key)) values.status = key as ProgramStatus;
      else errors.push(`"status" must be one of: ${Object.values(STATUS_LABELS).join(', ')}.`);
    }
  }

  // --- page template: only standard pages are authored through this importer ---
  if (has(data, 'page_template')) {
    const raw = str('page_template', data.page_template, 50);
    if (raw) {
      if (!TEMPLATE_RE.test(raw)) errors.push('"page_template" can only contain lowercase letters, numbers and underscores.');
      else if (raw !== 'standard') {
        values.pageTemplate = 'standard';
        warnings.push(`"page_template" "${raw}" cannot be imported, so the standard information page was used instead.`);
      } else values.pageTemplate = 'standard';
    }
  }

  // --- dates ---
  for (const [jsonKey, formKey] of [
    ['start_date', 'startDate'], ['end_date', 'endDate'],
    ['application_open_date', 'applicationOpenDate'], ['application_close_date', 'applicationCloseDate'],
  ] as const) {
    if (has(data, jsonKey) && data[jsonKey] !== '' && data[jsonKey] !== null) {
      const d = date(jsonKey, data[jsonKey]);
      if (d) values[formKey] = d;
    }
  }
  if (values.startDate && values.endDate && values.endDate < values.startDate) {
    errors.push('"end_date" is before "start_date". Both were imported so you can correct them.');
  }
  if (values.applicationOpenDate && values.applicationCloseDate && values.applicationCloseDate < values.applicationOpenDate) {
    errors.push('"application_close_date" is before "application_open_date". Both were imported so you can correct them.');
  }

  // --- application URL ---
  if (has(data, 'application_url') && data.application_url !== '' && data.application_url !== null) {
    const raw = str('application_url', data.application_url, 2000);
    if (raw) {
      if (safeUrl(raw)) values.applicationUrl = raw;
      else errors.push('"application_url" must start with https:// (or http:// or mailto:).');
    }
  }

  // --- structured content ---
  if (has(data, 'content')) {
    const content = data.content;
    if (!isPlainObject(content)) {
      errors.push('"content" must be an object.');
    } else {
      for (const key of Object.keys(content)) {
        if (!KNOWN_CONTENT.has(key)) warnings.push(`Unknown field "content.${key}" was ignored.`);
      }

      for (const [key, formKey, max] of [
        ['tagline', 'tagline', MAX_LINE], ['overview', 'overview', MAX_TEXT], ['howToApply', 'howToApply', MAX_TEXT], ['contactNote', 'contactNote', MAX_LINE],
      ] as const) {
        if (has(content, key)) {
          const t = str(`content.${key}`, content[key], max);
          if (t !== null) values[formKey] = t;
        }
      }

      const list = (key: string): unknown[] | null => {
        if (!(has(content, key))) return null;
        const v = content[key];
        if (!Array.isArray(v)) {
          errors.push(`"content.${key}" must be a list.`);
          return null;
        }
        if (v.length > MAX_ITEMS) {
          errors.push(`"content.${key}" has ${v.length} items; the limit is ${MAX_ITEMS}.`);
          return null;
        }
        return v;
      };

      for (const key of ['objectives', 'eligibility', 'benefits'] as const) {
        const items = list(key);
        if (items) {
          const out: string[] = [];
          items.forEach((item, i) => {
            const t = str(`content.${key}[${i + 1}]`, item, MAX_LINE);
            if (t) out.push(t);
          });
          values[key] = out;
        }
      }

      const facts = list('quickFacts');
      if (facts) {
        const out: { label: string; value: string }[] = [];
        facts.forEach((item, i) => {
          const where = `content.quickFacts[${i + 1}]`;
          if (!isPlainObject(item)) return void errors.push(`"${where}" must be an object with "label" and "value".`);
          const label = str(`${where}.label`, item.label, MAX_LINE);
          const value = str(`${where}.value`, item.value, MAX_LINE);
          if (label && value) out.push({ label, value });
          else if (label !== null && value !== null) warnings.push(`"${where}" was skipped because the label or value is empty.`);
        });
        values.quickFacts = out;
      }

      const phases = list('phases');
      if (phases) {
        const out: { title: string; description: string }[] = [];
        phases.forEach((item, i) => {
          const where = `content.phases[${i + 1}]`;
          if (!isPlainObject(item)) return void errors.push(`"${where}" must be an object with "title" and "description".`);
          const title = str(`${where}.title`, item.title, MAX_LINE);
          const description = has(item, 'description') ? str(`${where}.description`, item.description, 2000) : '';
          if (title && description !== null) out.push({ title, description });
          else if (title === '') warnings.push(`"${where}" was skipped because it has no title.`);
        });
        values.phases = out;
      }

      const faq = list('faq');
      if (faq) {
        const out: { question: string; answer: string }[] = [];
        faq.forEach((item, i) => {
          const where = `content.faq[${i + 1}]`;
          if (!isPlainObject(item)) return void errors.push(`"${where}" must be an object with "question" and "answer".`);
          const question = str(`${where}.question`, item.question, MAX_LINE);
          const answer = str(`${where}.answer`, item.answer, 2000);
          if (question && answer) out.push({ question, answer });
          else if (question !== null && answer !== null) warnings.push(`"${where}" was skipped because the question or answer is empty.`);
        });
        values.faq = out;
      }
    }
  }

  return { values, errors, warnings, fatal: false };
}

/** Reads a user-chosen file, enforcing the .json-only and size rules before parsing. */
export async function readProgramJsonFile(file: File): Promise<string> {
  if (!/\.json$/i.test(file.name)) throw new Error('Only .json files can be imported.');
  if (file.size > MAX_IMPORT_BYTES) throw new Error(`That file is too large (limit ${Math.round(MAX_IMPORT_BYTES / 1000)} KB).`);
  return file.text();
}

export const EXAMPLE_PROGRAM_JSON = {
  title: 'HVI-STEM',
  slug: 'hvi-stem',
  short_description: 'A multi-stage STEM learning and mentorship programme.',
  category: 'Training',
  status: 'upcoming',
  page_template: 'standard',
  start_date: '2027-08-04',
  end_date: '2028-07-23',
  application_open_date: '2027-06-20',
  application_close_date: '2027-07-20',
  application_url: 'https://example.org/apply',
  location: 'Cameroon',
  format: 'Hybrid',
  cost: 'Free',
  content: {
    tagline: '',
    overview: '',
    objectives: [],
    howToApply: '',
    quickFacts: [{ label: 'Participants', value: '30 girls' }],
    phases: [{ title: 'Phase 1', description: 'What happens in this phase.' }],
    eligibility: [],
    benefits: [],
    faq: [{ question: 'Is it free?', answer: 'Yes.' }],
    contactNote: '',
  },
};

/** Browser-only: saves the example file so admins can see the expected shape. */
export function downloadExampleProgramJson(): void {
  const blob = new Blob([JSON.stringify(EXAMPLE_PROGRAM_JSON, null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'program-example.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
