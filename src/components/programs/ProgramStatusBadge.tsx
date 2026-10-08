import React from 'react';
import { statusLabel } from '../../lib/programs';

const STYLES: Record<string, string> = {
  applications_open: 'bg-brandGreen text-white',
  upcoming: 'bg-brandSlate text-white',
  applications_closed: 'bg-gray-700 text-white',
  ongoing: 'bg-brandPink text-white',
  completed: 'bg-gray-200 text-gray-800 dark:bg-slate-600 dark:text-gray-100',
};

/** Status is always conveyed as text, never by colour alone. */
const ProgramStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className = '' }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest ${
      STYLES[status] ?? STYLES.completed
    } ${className}`}
  >
    {statusLabel(status)}
  </span>
);

export default ProgramStatusBadge;
