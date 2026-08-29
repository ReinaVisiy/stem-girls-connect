import React from 'react';
import { useApiData } from '../hooks/useApiData';

interface PartnerItem {
  id: number;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
}

/**
 * Partner logo row. Logos only — no names or captions rendered, per spec.
 * `name` is still used for the img alt text (accessibility) and as the
 * dictionary key, just never shown visually. Renders just the logo row
 * (no section/container wrapper) — the parent page supplies the section
 * framing and heading.
 */
const Partners: React.FC = () => {
  const { data } = useApiData<PartnerItem[]>('/api/partners');

  const partners = (data ?? []).filter((p) => p.logo_url);
  if (partners.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8">
      {partners.map((partner) => {
        const logo = (
          <img
            src={partner.logo_url!}
            alt={partner.name}
            className="h-20 md:h-24 w-auto object-contain"
          />
        );
        return partner.website_url ? (
          <a
            key={partner.id}
            href={partner.website_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={partner.name}
          >
            {logo}
          </a>
        ) : (
          <div key={partner.id}>{logo}</div>
        );
      })}
    </div>
  );
};

export default Partners;
