import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, Target } from 'lucide-react';
import Seo from '../../components/Seo';
import ScrollReveal from '../../components/ScrollReveal';
import ReportActions from '../../components/ReportActions';
import ProgramStatusBadge from '../../components/programs/ProgramStatusBadge';
import { categoryLabel, formatProgramDate, safeUrl, type ProgramDetail } from '../../lib/programs';

const buttonClass =
  'inline-flex items-center justify-center gap-2 bg-brandPink text-white px-8 py-4 min-h-11 rounded-xl font-extrabold text-sm uppercase tracking-widest hover:scale-[1.02] transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const SectionHeading: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="text-3xl font-extrabold text-[#1d7448] dark:text-emerald-400 uppercase tracking-tighter mb-8">
    {children}
  </h2>
);

const ProgramCta: React.FC<{ program: ProgramDetail; onDark?: boolean }> = ({ program, onDark }) => {
  const applyUrl = safeUrl(program.application_url);
  const openDate = formatProgramDate(program.application_open_date);
  const noteClass = `inline-block px-6 py-3 rounded-xl font-extrabold text-sm uppercase tracking-widest ${
    onDark ? 'bg-white/15 text-white' : 'bg-brandSlate/10 text-brandSlate dark:text-slate-300'
  }`;

  switch (program.status) {
    case 'applications_open':
      // No URL means no button: never render a dead Apply link.
      return applyUrl ? (
        <a href={applyUrl} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          {program.application_button_text || 'Apply Now'}
        </a>
      ) : (
        <p className={noteClass}>Applications Open</p>
      );
    case 'upcoming':
      return <p className={noteClass}>{openDate ? `Applications open ${openDate}` : 'Applications open soon'}</p>;
    case 'applications_closed':
      return <p className={noteClass}>Applications Closed</p>;
    case 'ongoing':
      return <p className={noteClass}>Program Ongoing</p>;
    case 'completed':
      return program.reports.length > 0 ? (
        <a href="#previous-editions" className={buttonClass}>
          View Reports
        </a>
      ) : (
        <p className={noteClass}>This program has concluded</p>
      );
    default:
      return null;
  }
};

const StandardProgramPage: React.FC<{ program: ProgramDetail; preview?: boolean }> = ({ program, preview = false }) => {
  const c = program.content ?? {};

  const dateRange = [formatProgramDate(program.start_date), formatProgramDate(program.end_date)].filter(Boolean).join(' – ');
  const openDate = formatProgramDate(program.application_open_date);
  const closeDate = formatProgramDate(program.application_close_date);

  const quickFacts: { label: string; value: string }[] = [
    openDate && { label: 'Application Opens', value: openDate },
    closeDate && { label: 'Application Deadline', value: closeDate },
    dateRange && { label: 'Program Dates', value: dateRange },
    program.location && { label: 'Location', value: program.location },
    program.format && { label: 'Format', value: program.format },
    program.cost && { label: 'Cost', value: program.cost },
    ...(c.quickFacts ?? []).filter((f) => f.label?.trim() && f.value?.trim()),
  ].filter(Boolean) as { label: string; value: string }[];

  const overviewParagraphs = (c.overview ?? '').split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const phases = (c.phases ?? []).filter((p) => p.title?.trim());
  const objectives = (c.objectives ?? []).filter((t) => t?.trim());
  const howToApplyParagraphs = (c.howToApply ?? '').split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);
  const eligibility = (c.eligibility ?? []).filter((t) => t?.trim());
  const benefits = (c.benefits ?? []).filter((t) => t?.trim());
  const faq = (c.faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim());

  const importantDates = [
    openDate && { label: 'Applications open', value: openDate },
    closeDate && { label: 'Applications close', value: closeDate },
    formatProgramDate(program.start_date) && { label: 'Program starts', value: formatProgramDate(program.start_date)! },
    formatProgramDate(program.end_date) && { label: 'Program ends', value: formatProgramDate(program.end_date)! },
  ].filter(Boolean) as { label: string; value: string }[];

  const hasApplyCta = program.status === 'applications_open' && !!safeUrl(program.application_url);
  // Instructions are irrelevant once a program has concluded.
  const showHowToApply = howToApplyParagraphs.length > 0 && program.status !== 'completed';
  const applicationBased = !!program.application_url || ['upcoming', 'applications_open', 'applications_closed'].includes(program.status);
  // Avoid a second Apply button when the How to Apply section already carries one.
  const showFinalApply = hasApplyCta && !showHowToApply;
  const showFinalCta = showFinalApply || !!c.contactNote?.trim();

  return (
    <div className="pb-24">
      {!preview && (
      <Seo
        title={`${program.title} | STEM Girls Connect`}
        description={program.short_description || c.tagline || `Learn about ${program.title}, a STEM Girls Connect program.`}
        path={`/programs/${program.slug}`}
      />
      )}

      {/* 1. Hero */}
      <section className="relative bg-brandPink text-white overflow-hidden">
        {program.cover_image_url && (
          <img src={program.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-[#82246d]/90 to-[#486e7c]/85" aria-hidden="true" />
        <div className="relative container mx-auto px-6 py-20 md:py-28 max-w-4xl">
          <Link to="/programs" className="inline-flex items-center gap-2 min-h-11 mb-4 text-sm font-extrabold uppercase tracking-widest opacity-90 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
            <ArrowLeft size={16} aria-hidden="true" /> All Programs
          </Link>
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-widest bg-white/20">
              {categoryLabel(program.category)}
            </span>
            <ProgramStatusBadge status={program.status} className="!bg-white !text-brandPink" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold uppercase tracking-tighter mb-4">{program.title}</h1>
          {c.tagline && <p className="text-xl md:text-2xl font-bold mb-4">{c.tagline}</p>}
          {program.short_description && <p className="text-base md:text-lg font-semibold opacity-95 mb-8">{program.short_description}</p>}
          <ProgramCta program={program} onDark />
        </div>
      </section>

      {/* 2. Quick facts */}
      {quickFacts.length > 0 && (
        <section aria-label="Quick facts" className="container mx-auto px-6 -mt-10 relative z-10">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-xl p-6 md:p-8">
            {quickFacts.map((fact) => (
              <div key={fact.label}>
                <dt className="text-[11px] font-extrabold text-brandPink dark:text-pink-300 uppercase tracking-widest mb-1">{fact.label}</dt>
                <dd className="text-sm font-bold text-brandSlate dark:text-slate-300">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="container mx-auto px-6 max-w-4xl">
        {/* 3. About */}
        {(overviewParagraphs.length > 0 || objectives.length > 0) && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="about-heading">
              <SectionHeading id="about-heading">About the Program</SectionHeading>
              {overviewParagraphs.length > 0 && <div className="space-y-4">
                {overviewParagraphs.map((para, i) => (
                  <p key={i} className="text-lg font-semibold text-brandSlate dark:text-slate-300 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>}
              {objectives.length > 0 && (
                <div className={overviewParagraphs.length > 0 ? 'mt-8' : ''}>
                  <h3 className="text-lg font-extrabold text-brandPink dark:text-pink-300 uppercase tracking-tight mb-4">Program Objectives</h3>
                  <ul className="space-y-3">
                    {objectives.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Target size={20} className="mt-0.5 flex-shrink-0 text-[#1d7448] dark:text-emerald-400" aria-hidden="true" />
                        <span className="text-base font-semibold text-brandSlate dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </ScrollReveal>
        )}

        {/* 4. How it works */}
        {phases.length > 0 && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="phases-heading">
              <SectionHeading id="phases-heading">How the Program Works</SectionHeading>
              <ol className="space-y-4">
                {phases.map((phase, i) => (
                  <li key={i} className="flex gap-5 bg-white dark:bg-slate-800 rounded-[32px] border border-gray-100 dark:border-slate-700 shadow-sm p-6">
                    <span className="flex-shrink-0 w-10 h-10 rounded-full bg-brandPink text-white font-extrabold flex items-center justify-center" aria-hidden="true">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-extrabold text-[#1d7448] dark:text-emerald-400 uppercase tracking-tight mb-1">
                        <span className="sr-only">Step {i + 1}: </span>
                        {phase.title}
                      </h3>
                      {phase.description && <p className="text-sm font-semibold text-brandSlate dark:text-slate-300 leading-relaxed">{phase.description}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </ScrollReveal>
        )}

        {/* 5. Eligibility */}
        {eligibility.length > 0 && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="eligibility-heading">
              <SectionHeading id="eligibility-heading">Who Can Participate?</SectionHeading>
              <ul className="space-y-3">
                {eligibility.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-brandPink dark:text-pink-300" aria-hidden="true" />
                    <span className="text-base font-semibold text-brandSlate dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        )}

        {/* 6. Benefits */}
        {benefits.length > 0 && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="benefits-heading">
              <SectionHeading id="benefits-heading">What Participants Gain</SectionHeading>
              <ul className="space-y-3">
                {benefits.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0 text-[#1d7448] dark:text-emerald-400" aria-hidden="true" />
                    <span className="text-base font-semibold text-brandSlate dark:text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </ScrollReveal>
        )}

        {/* 7. Important dates */}
        {importantDates.length > 0 && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="dates-heading">
              <SectionHeading id="dates-heading">Important Dates</SectionHeading>
              <dl className="bg-[#486e7c]/5 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
                {importantDates.map((d) => (
                  <div key={d.label} className="flex flex-col sm:flex-row sm:justify-between gap-1 px-6 py-4">
                    <dt className="text-xs font-extrabold text-brandPink dark:text-pink-300 uppercase tracking-widest">{d.label}</dt>
                    <dd className="text-sm font-bold text-brandSlate dark:text-slate-300">{d.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </ScrollReveal>
        )}

        {/* 8. How to apply / participate */}
        {showHowToApply && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="apply-heading">
              <SectionHeading id="apply-heading">{applicationBased ? 'How to Apply' : 'How to Participate'}</SectionHeading>
              <div className="space-y-4 mb-8">
                {howToApplyParagraphs.map((para, i) => (
                  <p key={i} className="text-lg font-semibold text-brandSlate dark:text-slate-300 leading-relaxed">{para}</p>
                ))}
              </div>
              {hasApplyCta && <ProgramCta program={program} />}
            </section>
          </ScrollReveal>
        )}

        {/* 9. FAQ */}
        {faq.length > 0 && (
          <ScrollReveal className="pt-20">
            <section aria-labelledby="faq-heading">
              <SectionHeading id="faq-heading">Frequently Asked Questions</SectionHeading>
              <div className="space-y-3">
                {faq.map((item, i) => (
                  <details key={i} className="group bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-4 min-h-11 font-extrabold text-[#1d7448] dark:text-emerald-400 focus-visible:outline-2 focus-visible:outline-brandPink rounded-2xl">
                      {item.question}
                      <ChevronDown size={18} className="flex-shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                    </summary>
                    <p className="px-6 pb-5 text-sm font-semibold text-brandSlate dark:text-slate-300 leading-relaxed">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* 9. Previous editions */}
        {program.reports.length > 0 && (
          <ScrollReveal className="pt-20">
            <section id="previous-editions" aria-labelledby="editions-heading" className="scroll-mt-28">
              <SectionHeading id="editions-heading">Previous Editions</SectionHeading>
              <div className="space-y-4">
                {program.reports.map((report) => (
                  <article key={report.id} className="bg-[#486e7c]/5 dark:bg-white/5 rounded-[32px] border border-gray-100 dark:border-slate-700 p-6 md:p-8">
                    {report.edition_label && (
                      <p className="text-brandPink dark:text-pink-300 text-xs font-extrabold uppercase tracking-widest mb-2">{report.edition_label}</p>
                    )}
                    <h3 className="text-lg font-extrabold text-[#1d7448] dark:text-emerald-400 mb-4">{report.title}</h3>
                    <ReportActions viewUrl={report.view_url} downloadUrl={report.download_url} title={report.title} />
                  </article>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}
      </div>

      {/* 10. Final CTA */}
      {showFinalCta && (
        <section className="container mx-auto px-6 pt-20" aria-label="Get involved">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-[#82246d] to-[#486e7c] text-white rounded-[40px] p-10 md:p-14 text-center">
            {showFinalApply && (
              <>
                <h2 className="text-2xl md:text-3xl font-extrabold uppercase tracking-tighter mb-6">Ready to take part?</h2>
                <ProgramCta program={program} onDark />
              </>
            )}
            {c.contactNote?.trim() && (
              <p className={`text-base font-semibold ${showFinalApply ? 'mt-8' : ''}`}>
                {c.contactNote}{' '}
                <Link to="/contact" className="underline font-extrabold">
                  Contact us
                </Link>
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default StandardProgramPage;
