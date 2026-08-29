import React from 'react';
import { Layers, Presentation, Users2, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import PhotoGallery from '../components/PhotoGallery';
import { useSiteImage } from '../hooks/useSiteImage';

const pillars = [
  {
    title: 'Advocacy',
    icon: Presentation,
    points: [
      'Promoting STEM inclusion and policy changes to create a safer, more equitable environment for women.',
      'Raising awareness on vital women’s issues, including gender-based violence (GBV) and menstrual health.',
    ],
  },
  {
    title: 'Workshops',
    icon: Layers,
    points: [
      'Specialized training on scholarship searches, grant applications, and professional opportunity navigation.',
      'Hands-on leadership development and technical skill-building sessions for career readiness.',
    ],
  },
  {
    title: 'Mentorship',
    icon: Users2,
    points: [
      'One-on-one pairing with women STEM professionals for ongoing guidance.',
      'Regular experience-sharing sessions to support career growth.',
    ],
  },
];

const Activities: React.FC = () => {
  const heroPhoto = useSiteImage('activities_hero', '/Little STEM Girls.jpg', 'Nurturing the next generation of STEM girls');
  const galleryPhoto1 = useSiteImage('activities_gallery_1', '/SGC outreach Foumban.jpg', 'STEM Girls Connect outreach event');
  const galleryPhoto2 = useSiteImage('activities_gallery_2', '/SGC Outreach class.jpg', 'STEM Girls Connect outreach classroom session');

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
            Our primary activity focuses on orientating, training, and mentoring girls and young women on learning opportunities and scholarships in STEM related fields.
          </p>
          <div className="h-1.5 w-24 bg-brandPink mx-auto mt-10 rounded-full"></div>
        </ScrollReveal>

        <PhotoGallery
          images={[
            { src: heroPhoto.src, alt: heroPhoto.alt },
            { src: galleryPhoto1.src, alt: galleryPhoto1.alt },
            { src: galleryPhoto2.src, alt: galleryPhoto2.alt },
          ]}
        >
          {(open) => (
            <>
              <ScrollReveal delay={100} className="max-w-5xl mx-auto mb-24 rounded-[60px] overflow-hidden shadow-2xl border-8 border-white">
                <img 
                  src={heroPhoto.src} 
                  alt={heroPhoto.alt} 
                  onClick={() => open(0)}
                  className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                />
              </ScrollReveal>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
                <ScrollReveal className="rounded-[40px] overflow-hidden shadow-xl border-4 border-white aspect-[4/3]">
                  <img
                    src={galleryPhoto1.src}
                    alt={galleryPhoto1.alt}
                    onClick={() => open(1)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                  />
                </ScrollReveal>
                <ScrollReveal delay={100} className="rounded-[40px] overflow-hidden shadow-xl border-4 border-white aspect-[4/3]">
                  <img
                    src={galleryPhoto2.src}
                    alt={galleryPhoto2.alt}
                    onClick={() => open(2)}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                  />
                </ScrollReveal>
              </div>
            </>
          )}
        </PhotoGallery>

        <div className="grid md:grid-cols-3 gap-12 mb-24">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <ScrollReveal key={pillar.title} delay={i * 100} className="flex flex-col bg-white p-10 rounded-[50px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all">
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