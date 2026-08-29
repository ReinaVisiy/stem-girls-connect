import React from 'react';
import { Target, Eye, Users, CheckCircle2, Flag, Sparkles } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { useApiData } from '../hooks/useApiData';
import { useSiteImage } from '../hooks/useSiteImage';
import PhotoGallery from '../components/PhotoGallery';

interface BureauMember {
  id: number;
  name: string;
  position: string;
  photo_url: string | null;
  linkedin_url: string | null;
  display_order: number;
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const About: React.FC = () => {
  const { data: bureau, loading: bureauLoading } = useApiData<BureauMember[]>('/api/bureau');
  const teamPhoto = useSiteImage('about_team', '/Group SGC pic Bamenda.jpg', 'STEM Girls Connect team');

  const objectives = [
    "Share ideas and gain inspiration for STEM careers.",
    "Access resources and information on excelling in STEM.",
    "Talent discovery through professional mentorship.",
    "Empowerment through basic STEM and leadership skills.",
    "Networking for personal, social, and professional development.",
    "Securing scholarships and funding for girls in STEM fields."
  ];

  return (
    <div className="pb-24">
      <Seo
        title="About Us | STEM Girls Connect"
        description="Learn about STEM Girls Connect's mission, vision, and the bureau leading efforts to empower girls and young women in STEM."
        path="/about"
      />
      <PageHeader 
        title="Who We Are" 
        subtitle="Nurturing Women in STEM" 
      />

      <section className="container mx-auto px-6 py-10">
        <div className="grid md:grid-cols-2 gap-12 mb-24">
          <ScrollReveal className="bg-[#486e7c]/5 p-10 rounded-[50px] border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-all">
            <Target color="#82246d" size={48} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Mission</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              To bring together and empower girls and young women in STEM related fields.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={200} className="bg-[#486e7c]/5 p-10 rounded-[50px] border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-all">
            <Eye color="#82246d" size={48} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Vision</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              To close the gender gap in STEM fields by empowering and supporting girls and young women to explore, learn and succeed in STEM.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300} className="bg-[#486e7c]/5 p-10 rounded-[50px] border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-all">
            <Flag color="#82246d" size={48} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Motto</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              Exploring the Future of STEM for the Benefit of All.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} className="bg-[#486e7c]/5 p-10 rounded-[50px] border border-gray-100 flex flex-col h-full hover:shadow-2xl transition-all">
            <Sparkles color="#82246d" size={48} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Slogan</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              Nurturing Women in STEM.
            </p>
          </ScrollReveal>
        </div>

        <PhotoGallery images={[{ src: teamPhoto.src, alt: teamPhoto.alt }]}>
          {(open) => (
            <ScrollReveal className="max-w-4xl mx-auto mb-24">
              <img
                src={teamPhoto.src}
                alt={teamPhoto.alt}
                onClick={() => open(0)}
                className="w-full cursor-zoom-in"
              />
            </ScrollReveal>
          )}
        </PhotoGallery>

        <ScrollReveal className="bg-white p-5 rounded-[60px] border-2 border-brandPink/10 shadow-xl max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-brandGreen mb-10 uppercase tracking-tighter text-center">Our Objectives</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start space-x-4 bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <CheckCircle2 color="#82246d" size={24} className="mt-1 flex-shrink-0" />
                <p className="text-brandSlate font-semibold text-sm leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="bg-white py-12">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-20">
            <Users color="#82246d" size={48} className="mx-auto mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen uppercase tracking-tighter">Bureau</h2>
            <p className="text-brandSlate font-bold mt-2 uppercase tracking-widest text-xs italic">Executive Committee</p>
          </ScrollReveal>
          
          <PhotoGallery
            images={(bureau ?? [])
              .filter((leader) => leader.photo_url)
              .map((leader) => ({ src: leader.photo_url as string, alt: leader.name }))}
          >
            {(open) => {
              let photoIndex = -1;
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
                  {bureauLoading && [0, 1, 2].map((i) => (
                    <div key={i} className="text-center">
                      <div className="w-32 h-32 md:w-44 md:h-44 bg-gray-100 rounded-full mx-auto mb-6 animate-pulse" />
                    </div>
                  ))}
                  {!bureauLoading && bureau?.map((leader, i) => {
                    if (leader.photo_url) photoIndex += 1;
                    const thisPhotoIndex = photoIndex;
                    return (
                      <ScrollReveal key={leader.id} delay={i * 100} className="text-center group">
                        <div className="w-32 h-32 md:w-44 md:h-44 bg-brandPink/5 border-2 border-brandPink/10 rounded-full mx-auto mb-6 flex items-center justify-center text-brandPink font-extrabold text-2xl md:text-4xl shadow-lg relative overflow-hidden group-hover:bg-brandPink group-hover:text-white transition-all duration-500">
                          {leader.photo_url ? (
                            <img
                              src={leader.photo_url}
                              alt={leader.name}
                              onClick={() => open(thisPhotoIndex)}
                              className="w-full h-full object-cover cursor-zoom-in"
                            />):( 
                              <span className="relative z-10">{initials(leader.name)}</span>)
                          }
                        </div>
                        {leader.linkedin_url ? (
                          <a 
                            href={leader.linkedin_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-block group"
                          >
                            <h3 className="text-lg font-extrabold text-gray-900 leading-tight group-hover:text-brandPink group-hover:underline decoration-brandPink decoration-2 underline-offset-8 transition-all">
                              {leader.name}
                            </h3>
                          </a>
                        ) : (
                          <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{leader.name}</h3>
                        )}
                        <div className="h-0.5 w-12 bg-brandPink mx-auto my-4 opacity-30 group-hover:w-24 transition-all"></div>
                        <p className="text-brandPink font-bold text-[10px] uppercase tracking-[0.2em] px-4 leading-tight">{leader.position}</p>
                      </ScrollReveal>
                    );
                  })}
                </div>
              );
            }}
          </PhotoGallery>
        </div>
      </section>
    </div>
  );
};

export default About;