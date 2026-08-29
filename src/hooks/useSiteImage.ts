import { useApiData } from './useApiData';

type SiteImagesMap = Record<string, { image_url: string; alt_text: string | null }>;

/**
 * Resolves a named placement slot (e.g. "about_team") to whatever photo
 * the admin panel has assigned it. Falls back to `fallbackSrc`/`fallbackAlt`
 * (the original bundled image) while loading, on fetch error, or if no
 * admin has assigned that slot yet — so a page never renders with a
 * missing image.
 */
export function useSiteImage(key: string, fallbackSrc: string, fallbackAlt: string) {
  const { data } = useApiData<SiteImagesMap>('/api/site-images');
  const entry = data?.[key];

  return {
    src: entry?.image_url ?? fallbackSrc,
    alt: entry?.alt_text ?? fallbackAlt,
  };
}
