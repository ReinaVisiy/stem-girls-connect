import React from 'react';
import { Target, Eye, Users, CheckCircle2, Flag, Sparkles } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { useApiData } from '../hooks/useApiData';
import { useSiteImage } from '../hooks/useSiteImage';
import { useSiteContent } from '../hooks/useSiteContent';
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
  const ceoPhoto = useSiteImage(
    'about_ceo',
    '/Visiy Edna CEO Graduation.jpg',
    'Dr. Visiy Edna Buhnyuy, CEO of STEM Girls Connect'
  );
  const ceoBio = useSiteContent(
    'about_ceo_bio',
    'Dr. Visiy Edna Buhnyuy is the CEO and Chairperson of STEM Girls Connect. She is an environmentalist, agricultural engineer, and educator who has led projects improving water, sanitation, and environmental solutions across communities, designing sustainable systems, training young engineers, and applying STEM to solve real-world challenges.\n\nShe holds a PhD in Environmental Management from the Pan African University Life and Earth Sciences Institute (PAULESI) in Ibadan, Nigeria, and currently serves as an Assistant Lecturer at the National Advanced School of Public Works (ENSTP) in Cameroon, where she mentors and trains the next generation of engineers. Through STEM Girls Connect, she is intentional about mentoring girls in science and creating opportunities that support their growth and participation in STEM.'
  );
  const ceoBioParagraphs = ceoBio.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

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
        <ScrollReveal className="max-w-3xl mx-auto mb-24">
          <h2 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-widest text-center">Our Story</h2>
          <p className="text-brandSlate text-lg leading-relaxed font-semibold text-justify mb-6">
            STEM Girls Connect began with a simple but uncomfortable observation. Walk into most engineering lecture halls, tech offices, or science labs across Cameroon, and women are still rare. Look closer, and the reason isn't ability. It's awareness.
          </p>
          <p className="text-brandSlate text-lg leading-relaxed font-semibold text-justify mb-6">
            Most girls simply aren't exposed to these fields early enough to ever consider them. Even when they are, they rarely see mentors or role models who look like them already working there, thriving there, leading there. Many grow up believing that the one STEM path realistically open to them as women is something in health. Not because that's true, but because it's the only version of "women in STEM" they've ever been shown. Nobody sat them down and said: you could design bridges, you could build software, you could run a laboratory, you could lead a tech company. So they never let themselves imagine it.
          </p>
          <p className="text-brandSlate text-lg leading-relaxed font-semibold text-justify mb-6">
            We believe that has to change, and that change starts with belief itself, long before it starts with a skill.
          </p>
          <p className="text-brandSlate text-lg leading-relaxed font-semibold text-justify mb-6">
            Founded in 2024, STEM Girls Connect exists to close that gap. Not just by teaching STEM skills, though we do that too, but by helping girls and young women genuinely picture themselves in these fields. We connect them with mentors who have walked the path ahead of them and can say, with proof, that it's possible. We build a community where curiosity is welcomed instead of quietly discouraged, where asking "could I do that?" is met with "yes, and here's how," not silence.
          </p>
          <p className="text-brandSlate text-lg leading-relaxed font-semibold text-justify">
            Every girl we work with reminds us why this matters. Because when one girl sees a woman leading a tech team, designing a solar system, or running her own lab, something shifts. She stops asking whether she belongs in STEM and starts asking what she wants to build in it. That shift, multiplied across hundreds of girls and young women, is how the gap actually closes. Not all at once, but one changed mind at a time.
          </p>
        </ScrollReveal>

        <ScrollReveal className="max-w-5xl mx-auto mb-24 bg-[#486e7c]/5 dark:bg-white/5 rounded-[50px] border border-gray-100 dark:border-slate-700 p-8 md:p-12">
          <h2 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-widest">About the CEO</h2>
          <div className="clear-both">
            <PhotoGallery images={[{ src: ceoPhoto.src, alt: ceoPhoto.alt }]}>
              {(open) => (
                <img
                  src={ceoPhoto.src}
                  alt={ceoPhoto.alt}
                  onClick={() => open(0)}
                  className="float-right w-40 sm:w-56 md:w-64 aspect-[3/4] object-cover rounded-[40px] shadow-xl cursor-zoom-in ml-6 mb-4 sm:ml-8 sm:mb-6"
                />
              )}
            </PhotoGallery>
            {ceoBioParagraphs.map((para, i) => (
              <p
                key={i}
                className={`text-brandSlate text-lg leading-relaxed font-semibold text-justify ${
                  i < ceoBioParagraphs.length - 1 ? 'mb-4' : ''
                }`}
              >
                {para}
              </p>
            ))}
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <ScrollReveal className="bg-[#486e7c]/5 dark:bg-white/5 p-10 rounded-[50px] border border-gray-100 dark:border-slate-700 flex flex-col h-full hover:shadow-2xl transition-all">
            <Target color="#82246d" size={24} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Mission</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              To bring together and empower girls and young women in STEM related fields.
            </p>
          </ScrollReveal>
          
          <ScrollReveal delay={200} className="bg-[#486e7c]/5 dark:bg-white/5 p-10 rounded-[50px] border border-gray-100 dark:border-slate-700 flex flex-col h-full hover:shadow-2xl transition-all">
            <Eye color="#82246d" size={24} className="mb-6" />
            <h2 className="text-3xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Vision</h2>
            <p className="text-brandSlate text-lg leading-relaxed text-justify font-bold">
              To close the gender gap in STEM fields by empowering and supporting girls and young women to explore, learn and succeed in STEM.
            </p>
          </ScrollReveal>
        </div>

        <div className="max-w-3xl mx-auto mb-24 space-y-6">
          <ScrollReveal delay={300} className="flex items-start gap-3">
            <Flag color="#82246d" size={22} className="mt-1 shrink-0" />
            <p className="text-brandSlate text-sm font-semibold italic text-justify">
              <span className="font-extrabold uppercase tracking-widest text-xs text-brandGreen not-italic mr-2">Motto</span>
              Exploring the Future of STEM for the Benefit of All.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={400} className="flex items-start gap-3">
            <Sparkles color="#82246d" size={22} className="mt-1 shrink-0" />
            <p className="text-brandSlate text-sm font-semibold italic text-justify">
              <span className="font-extrabold uppercase tracking-widest text-xs text-brandGreen not-italic mr-2">Slogan</span>
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

        <ScrollReveal className="bg-white dark:bg-slate-800 p-5 rounded-[60px] border-2 border-brandPink/10 shadow-xl max-w-5xl mx-auto">
          <h2 className="text-3xl font-extrabold text-brandGreen mb-10 uppercase tracking-tighter text-center">Our Objectives</h2>
          <div className="grid md:[grid-template-columns:repeat(auto-fit,minmax(360px,500px))] md:justify-center gap-6">
            {objectives.map((obj, i) => (
              <div key={i} className="flex items-start space-x-4 bg-gray-50 dark:bg-slate-700 p-6 rounded-3xl border border-gray-100 dark:border-slate-700">
                <CheckCircle2 color="#82246d" size={24} className="mt-1 flex-shrink-0" />
                <p className="text-brandSlate font-semibold text-sm leading-relaxed">{obj}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      <section className="bg-white dark:bg-slate-800 py-12">
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
                <div className="grid grid-cols-2 md:[grid-template-columns:repeat(auto-fit,minmax(280px,360px))] md:justify-center gap-12 max-w-6xl mx-auto">
                  {bureauLoading && [0, 1, 2].map((i) => (
                    <div key={i} className="text-center">
                      <div className="w-32 h-32 md:w-44 md:h-44 bg-gray-100 dark:bg-slate-700 rounded-full mx-auto mb-6 animate-pulse" />
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
                            <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 leading-tight group-hover:text-brandPink group-hover:underline decoration-brandPink decoration-2 underline-offset-8 transition-all">
                              {leader.name}
                            </h3>
                          </a>
                        ) : (
                          <h3 className="text-lg font-extrabold text-gray-900 dark:text-slate-100 leading-tight">{leader.name}</h3>
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