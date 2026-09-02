import React from 'react';
import { Layers, Users2, Award, Briefcase, Network, Megaphone, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import HomeSlideshow from '../components/HomeSlideshow';

const pillars = [
  {
    title: 'Skills & Training',
    icon: Layers,
    points: [
      'Practical STEM, digital, leadership, and professional skills training designed to help girls and young women build confidence and prepare for future opportunities.',
    ],
  },
  {
    title: 'Mentorship',
    icon: Users2,
    points: [
      'Connecting girls and young women with STEM professionals and experienced peers who can provide guidance, encouragement, and career support.',
    ],
  },
  {
    title: 'Opportunities',
    icon: Award,
    points: [
      'Helping members discover scholarships, fellowships, training programs, grants, competitions, and other educational or professional opportunities in STEM.',
    ],
  },
  {
    title: 'Career Development',
    icon: Briefcase,
    points: [
      'Supporting girls and young women with school applications, scholarship applications, grant writing, career preparation, and professional development.',
    ],
  },
  {
    title: 'Leadership & Networking',
    icon: Network,
    points: [
      'Creating spaces for girls and young women to connect with peers and professionals, strengthen their leadership skills, and build valuable personal and professional networks.',
    ],
  },
  {
    title: 'Outreach & Advocacy',
    icon: Megaphone,
    points: [
      'Reaching schools and communities to encourage girls to explore STEM, while raising awareness around issues that affect the participation and advancement of girls and women in STEM.',
    ],
  },
];

const Activities: React.FC = () => {
  return (
    <div className="pb-24">
      <Seo
        title="Our Activities | STEM Girls Connect"
        description="Explore STEM Girls Connect's programs, mentorship, and outreach activities supporting girls and young women in STEM."
        path="/activities"
      />
      <PageHeader 
        title="Our Activities" 
        subtitle="Turning Passion Into Profession Through STEM Training and Mentorship" 
      />

      <section className="container mx-auto px-6 py-20">
        <ScrollReveal className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-xl md:text-2xl text-brandSlate font-bold leading-relaxed text-justify">
            We create opportunities for girls and young women to learn, grow, connect, and build their futures in STEM through training, mentorship, career support, outreach, and access to opportunities.
          </p>
          <div className="h-1.5 w-24 bg-brandPink mx-auto mt-10 rounded-full"></div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <HomeSlideshow />
        </ScrollReveal>

        <div className="grid md:[grid-template-columns:repeat(auto-fit,minmax(300px,380px))] md:justify-center gap-12 mb-24">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.title} delay={i * 100} className="flex flex-col bg-white dark:bg-slate-800 p-10 rounded-[50px] border border-gray-100 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all">
                <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
                  <Icon color="#82246d" size={32} />
                </div>
                <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">{pillar.title}</h3>
                <div className="space-y-4">
                  {pillar.points.map((point) => (
                    <div key={point} className="flex items-start space-x-3">
                      <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                      <span className="text-sm font-semibold text-brandSlate">{point}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Activities;