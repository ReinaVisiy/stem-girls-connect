import { useEffect } from 'react';
import { organization } from '../config/organization';

interface SeoProps {
  title: string;
  description: string;
  path: string; // e.g. '/about'
}

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
    canonicalTag.setAttribute('href', `${organization.website}${path}`);
  }, [title, description, path]);

  return null;
};

export default Seo;
