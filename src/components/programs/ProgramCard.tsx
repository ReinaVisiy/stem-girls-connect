import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays } from 'lucide-react';
import ProgramStatusBadge from './ProgramStatusBadge';
import { categoryLabel, formatTimeframe, type ProgramSummary } from '../../lib/programs';

const ProgramCard: React.FC<{ program: ProgramSummary }> = ({ program }) => {
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
        <div className="w-full h-48 bg-gradient-to-br from-brandPink to-brandSlate" aria-hidden="true" />
      )}
      <div className="flex flex-col flex-grow p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-brandPink/10 dark:bg-pink-300/10 text-brandPink dark:text-pink-300">
            {categoryLabel(program.category)}
          </span>
          <ProgramStatusBadge status={program.status} />
        </div>
        <h3 className="text-xl font-extrabold text-[#1d7448] dark:text-emerald-400 mb-3 uppercase tracking-tight">{program.title}</h3>
        {program.short_description && (
          <p className="text-sm font-semibold text-brandSlate dark:text-slate-300 leading-relaxed mb-4">{program.short_description}</p>
        )}
        {timeframe && (
          <p className="flex items-center gap-2 text-xs font-bold text-brandSlate dark:text-slate-300 uppercase tracking-widest mb-4">
            <CalendarDays size={14} aria-hidden="true" /> {timeframe}
          </p>
        )}
        <span className="mt-auto inline-flex items-center gap-2 text-brandPink dark:text-pink-300 font-extrabold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
          Explore Program <ArrowRight size={16} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
};

export default ProgramCard;
