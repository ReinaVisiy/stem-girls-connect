import React from 'react';
import ScrollReveal from '../ScrollReveal';
import ProgramCard from './ProgramCard';
import { useApiData } from '../../hooks/useApiData';
import { CURRENT_STATUSES, type ProgramSummary } from '../../lib/programs';

const Group: React.FC<{ heading: string; programs: ProgramSummary[] }> = ({ heading, programs }) => (
  <div className="mb-20 last:mb-0">
    <ScrollReveal className="text-center mb-12">
      <h2 className="text-3xl font-extrabold text-brandGreen uppercase tracking-tighter">{heading}</h2>
    </ScrollReveal>
    <div className="grid md:[grid-template-columns:repeat(auto-fit,minmax(300px,380px))] md:justify-center gap-8">
      {programs.map((program, i) => (
        <ScrollReveal key={program.id} delay={i * 100}>
          <ProgramCard program={program} />
        </ScrollReveal>
      ))}
    </div>
  </div>
);

/**
 * Renders nothing at all while loading, on error, or when there are no
 * published programs: no headings, no "coming soon" text. A group
 * heading only appears when that group has at least one program.
 */
const ProgramsList: React.FC = () => {
  const { data } = useApiData<ProgramSummary[]>('/api/programs');
  if (!data || data.length === 0) return null;

  const current = data.filter((p) => CURRENT_STATUSES.includes(p.status));
  const past = data.filter((p) => p.status === 'completed');
  if (current.length === 0 && past.length === 0) return null;

  return (
    <section className="container mx-auto px-6 pb-12">
      {current.length > 0 && <Group heading="Current & Upcoming Programs" programs={current} />}
      {past.length > 0 && <Group heading="Past Programs" programs={past} />}
    </section>
  );
};

export default ProgramsList;
