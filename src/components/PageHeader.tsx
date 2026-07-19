
import React from 'react';
import ScrollReveal from './ScrollReveal';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle }) => {
  return (
    <section className="bg-brandPink py-20 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 text-center relative z-10">
        <ScrollReveal>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 uppercase tracking-tighter drop-shadow-lg">
            {title}
          </h1>
          {subtitle && (
            <p className="text-white/90 max-w-2xl mx-auto text-lg font-medium">
              {subtitle}
            </p>
          )}
        </ScrollReveal>
      </div>
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
    </section>
  );
};

export default PageHeader;
