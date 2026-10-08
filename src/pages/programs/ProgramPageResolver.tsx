import React, { Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useApiData } from '../../hooks/useApiData';
import NotFound from '../NotFound';
import Seo from '../../components/Seo';
import StandardProgramPage from './StandardProgramPage';
import { specialProgramTemplates } from './specialProgramTemplates';
import type { ProgramDetail } from '../../lib/programs';

const Loading: React.FC = () => (
  <div className="container mx-auto px-6 py-24" aria-busy="true">
    <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-[40px] animate-pulse" />
  </div>
);

/** Shown when a program points at a page_template this build doesn't know about. */
const TemplateUnavailable: React.FC<{ title: string; slug: string }> = ({ title, slug }) => (
  <div className="container mx-auto px-6 py-24 text-center max-w-2xl">
    <Seo title={`${title} | STEM Girls Connect`} description="This program page is not available right now." path={`/programs/${slug}`} />
    <h1 className="text-3xl font-extrabold text-brandGreen uppercase mb-4">{title}</h1>
    <p className="text-brandSlate font-medium mb-8">This program page isn't available right now. Please check back soon.</p>
    <Link to="/programs" className="inline-flex items-center gap-2 text-brandPink font-extrabold uppercase tracking-widest text-sm hover:underline">
      <ArrowLeft size={16} aria-hidden="true" /> Back to Programs
    </Link>
  </div>
);

/**
 * /programs/:slug/*  ->  fetch the program, then pick a renderer from its
 * page_template. Unpublished or missing programs get the normal Not Found.
 */
const ProgramPageResolver: React.FC = () => {
  const params = useParams();
  const slug = params.slug ?? '';
  const subPath = params['*'] ?? '';

  const { data: program, loading, error } = useApiData<ProgramDetail>(`/api/programs?slug=${encodeURIComponent(slug)}`);

  if (loading) return <Loading />;
  if (error || !program) return <NotFound />;

  if (program.page_template === 'standard') {
    // Standard programs have a single page; any extra path is not a real URL.
    if (subPath) return <NotFound />;
    return <StandardProgramPage program={program} />;
  }

  const Special = specialProgramTemplates[program.page_template];
  if (!Special) return <TemplateUnavailable title={program.title} slug={program.slug} />;

  return (
    <Suspense fallback={<Loading />}>
      <Special program={program} subPath={subPath} />
    </Suspense>
  );
};

export default ProgramPageResolver;
