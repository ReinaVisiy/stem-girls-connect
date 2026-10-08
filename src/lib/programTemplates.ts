/**
 * Page templates that actually have a working public experience.
 *
 * Pure data (no React) so the public API, the sitemap, the SEO middleware
 * and the browser can all share ONE list. A program whose `page_template`
 * is not in this list is treated as not publicly available: it is left out
 * of /api/programs, the sitemap and search metadata, and its URL returns a
 * real 404 instead of presenting a page that doesn't work.
 *
 * To add a custom program experience:
 *   1. build the lazy page component and register it in
 *      src/pages/programs/specialProgramTemplates.ts,
 *   2. add its key here.
 * tests/programTemplates.test.ts fails if the two lists drift apart.
 */
export const STANDARD_TEMPLATE = 'standard';

export const SUPPORTED_PAGE_TEMPLATES: readonly string[] = [STANDARD_TEMPLATE];

export function isSupportedTemplate(template: unknown): boolean {
  return typeof template === 'string' && SUPPORTED_PAGE_TEMPLATES.includes(template);
}
