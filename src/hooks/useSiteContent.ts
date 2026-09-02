import { useApiData } from './useApiData';

type SiteContentMap = Record<string, string>;

/**
 * Resolves a named text block (e.g. "about_ceo_bio") to whatever copy
 * the admin panel has set for it. Falls back to `fallback` (the original
 * bundled text) while loading, on fetch error, or if no admin has set
 * that block yet — so a page never renders with missing copy.
 */
export function useSiteContent(key: string, fallback: string): string {
  const { data } = useApiData<SiteContentMap>('/api/site-content');
  return data?.[key] ?? fallback;
}
