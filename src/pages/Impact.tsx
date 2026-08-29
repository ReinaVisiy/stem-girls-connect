import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { useApiData } from '../hooks/useApiData';
import CountUp from '../components/CountUp';

interface Stat {
  id: number;
  stat_key: string;
  value: string;
  label: string;
  sub_stat: string | null;
  display_order: number;
}

interface Report {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  start_date: string | null;
  end_date: string | null;
  display_order: number;
}

function formatReportDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const Impact: React.FC = () => {
  const { data: stats, loading: statsLoading } = useApiData<Stat[]>('/api/stats');
  const { data: reports, loading: reportsLoading } = useApiData<Report[]>('/api/reports');

  return (
    <div className="pb-24">
      <Seo
        title="Impact & Evidence | STEM Girls Connect"
        description="See the numbers behind STEM Girls Connect's work, and read our published reports and records."
        path="/impact"
      />
      <PageHeader
        title="Impact & Evidence"
        subtitle="Our work in numbers, stories, and reports."
      />

      <section className="container mx-auto px-6 py-20">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-brandGreen uppercase tracking-tighter">By the Numbers</h2>
        </ScrollReveal>

        {statsLoading && (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 bg-gray-100 rounded-[40px] animate-pulse" />
            ))}
          </div>
        )}

        {!statsLoading && stats && stats.length > 0 && (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {stats.map((stat, i) => (
              <ScrollReveal
                key={stat.id}
                delay={i * 100}
                className="bg-[#486e7c]/5 p-10 rounded-[40px] border border-gray-100 text-center hover:shadow-2xl transition-all"
              >
                <p className="text-5xl font-extrabold text-brandPink mb-3 tabular-nums">
                  <CountUp value={stat.value} />
                </p>
                <p className="text-brandGreen font-extrabold uppercase tracking-widest text-sm mb-2">{stat.label}</p>
                {stat.sub_stat && (
                  <p className="text-brandSlate text-xs font-bold uppercase tracking-widest">{stat.sub_stat}</p>
                )}
              </ScrollReveal>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border-t border-gray-100 py-20">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-16">
            <FileText color="#82246d" size={40} className="mx-auto mb-4" />
            <h2 className="text-3xl font-extrabold text-brandGreen uppercase tracking-tighter">Reports & Records</h2>
            <p className="text-brandSlate font-bold mt-2 uppercase tracking-widest text-xs italic">Impact Archive of Completed Activities</p>
          </ScrollReveal>

          {reportsLoading && (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[0, 1].map((i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-[40px] animate-pulse" />
              ))}
            </div>
          )}

          {!reportsLoading && (!reports || reports.length === 0) && (
            <p className="text-center text-brandSlate font-medium">No reports published yet: check back soon.</p>
          )}

          {!reportsLoading && reports && reports.length > 0 && (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {reports.map((report, i) => (
                <ScrollReveal
                  key={report.id}
                  delay={i * 100}
                  className="bg-[#486e7c]/5 p-8 rounded-[40px] border border-gray-100 flex flex-col hover:shadow-xl transition-all"
                >
                  <h3 className="text-lg font-extrabold text-brandGreen mb-2 uppercase tracking-tight">{report.title}</h3>
                  {(report.start_date || report.end_date) && (
                    <p className="text-brandPink text-xs font-extrabold uppercase tracking-widest mb-3">
                      {formatReportDate(report.start_date)}
                      {report.end_date && ` – ${formatReportDate(report.end_date)}`}
                    </p>
                  )}
                  {report.description && (
                    <p className="text-brandSlate text-sm font-medium leading-relaxed mb-6 flex-grow">{report.description}</p>
                  )}
                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-brandPink text-white px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest hover:scale-[1.02] transition-all"
                  >
                    View Report <ExternalLink size={16} />
                  </a>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Impact;
