import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import ProgramStatusBadge from './ProgramStatusBadge';
import { categoryLabel, formatTimeframe, type ProgramSummary } from '../../lib/programs';

const GIRLHOOD_CARD = {
  en: {
    description:
      'Every girl deserves a childhood she can call her own. This International Day of the Girl, share what girlhood should be, who girls should be free to become, and what would help them get there.',
    button: 'Explore the campaign',
  },
  fr: {
    description:
      'Chaque fille mérite une enfance qui lui appartient. En cette Journée internationale de la fille, dis-nous ce que l’enfance des filles devrait être, qui elles devraient être libres de devenir, et ce qui les aiderait à y arriver.',
    button: 'Découvrir la campagne',
  },
};
function savedLanguage(): 'en' | 'fr' {
  try {
    const saved = localStorage.getItem('sgc-girlhood-language');
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {
    /* Storage may be disabled. */
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

const ProgramCard: React.FC<{ program: ProgramSummary }> = ({ program }) => {
  const girlhood = program.page_template === 'girlhood' ? GIRLHOOD_CARD[savedLanguage()] : null;
  const timeframe = formatTimeframe(program.start_date, program.end_date);

  return (
    <Link
      to={`/programs/${program.slug}`}
      className="group flex flex-col h-full bg-white dark:bg-slate-800 rounded-[40px] border border-gray-100 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brandPink"
    >
      {program.cover_image_url ? (
        <img
          src={program.cover_image_url}
          alt={`Cover image for ${program.title}`}
          loading="lazy"
          className="w-full h-48 object-cover"
        />
      ) : (
        girlhood ? (
          <div
            className="w-full h-48 flex items-center justify-center text-center px-6"
            style={{ background: 'radial-gradient(60% 70% at 15% 0%, rgb(150 52 120 / 0.5), transparent 70%), #35122e' }}
            aria-hidden="true"
          >
            <span style={{ fontFamily: 'Georgia, serif', color: '#fbeff6', fontSize: '1.6rem', lineHeight: 1.15 }}>Girlhood Should Be Hers</span>
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-brandPink to-brandSlate" aria-hidden="true" />
        )
      )}
      <div className="flex flex-col flex-grow p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-brandPink/10 dark:bg-pink-300/10 text-brandPink dark:text-pink-300">
            {categoryLabel(program.category)}
          </span>
          <ProgramStatusBadge status={program.status} />
        </div>
        <h3 className="text-xl font-extrabold text-[#1d7448] dark:text-emerald-400 mb-3 uppercase tracking-tight">{program.title}</h3>
        {(girlhood?.description ?? program.short_description) && (
          <p className="text-sm font-semibold text-brandSlate dark:text-slate-300 leading-relaxed mb-4">{girlhood?.description ?? program.short_description}</p>
        )}
        {timeframe && (
          <p className="flex items-center gap-2 text-xs font-bold text-brandSlate dark:text-slate-300 uppercase tracking-widest mb-4">
            <CalendarDays size={14} aria-hidden="true" /> {timeframe}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-2 text-brandPink dark:text-pink-300 font-extrabold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
          {girlhood ? girlhood.button : 'Explore Program'} <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
};

export default ProgramCard;
