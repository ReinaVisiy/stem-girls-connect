import { useEffect } from 'react';

interface SeoProps {
  title: string;
  description: string;
  path: string; // e.g. '/about'
}

const SITE_URL = 'https://stemgirlsconnect.org';

/**
 * Lightweight, dependency-free helper to keep <title>, meta description,
 * and the canonical link in sync with the current route on this
 * client-rendered SPA. index.html already ships sensible defaults for
 * the homepage, so this only needs to update the DOM after mount/route change.
 */
const Seo: React.FC<SeoProps> = ({ title, description, path }) => {
  useEffect(() => {
    document.title = title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }
    descriptionTag.setAttribute('content', description);

    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', `${SITE_URL}${path}`);
  }, [title, description, path]);

  return null;
};

export default Seo;
