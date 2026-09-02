import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';

interface PartnerItem {
  id: number;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  display_order: number;
}

/**
 * Partner card grid. Each partner gets a consistent card with a neutral
 * light logo panel (so logos designed for white backgrounds stay legible
 * in dark mode without any filter/invert tricks) plus the partner's name.
 * Partners with a `website_url` are wrapped in a link that opens in a new
 * tab and get a small external-link glyph next to their name; partners
 * without one render as a plain, non-interactive card. Renders just the
 * grid (no section/container wrapper) -- the parent page supplies the
 * section framing and heading.
 */
const Partners: React.FC = () => {
  const { data } = useApiData<PartnerItem[]>('/api/partners');

  const partners = (data ?? []).filter((p) => p.logo_url);
  if (partners.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {partners.map((partner) => {
        const card = (
          <div className="h-full flex flex-col items-center bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-3xl shadow-sm hover:shadow-lg transition-shadow p-6">
            {/* Neutral light logo panel: stays light in both themes so
                logos designed for white backgrounds remain legible. */}
            <div className="w-full h-24 bg-white rounded-2xl border border-gray-100 flex items-center justify-center p-4 mb-4">
              <img
                src={partner.logo_url!}
                alt=""
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-center">
              <span className="text-brandSlate dark:text-white font-bold text-sm">{partner.name}</span>
              {partner.website_url && (
                <ExternalLink size={14} className="text-brandPink flex-shrink-0" aria-hidden="true" />
              )}
            </div>
          </div>
        );

        return partner.website_url ? (
          <a
            key={partner.id}
            href={partner.website_url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${partner.name} (opens in a new tab)`}
            className="rounded-3xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandPink"
          >
            {card}
          </a>
        ) : (
          <div key={partner.id}>{card}</div>
        );
      })}
    </div>
  );
};

export default Partners;
