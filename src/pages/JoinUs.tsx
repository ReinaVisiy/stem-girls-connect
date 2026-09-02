import React from 'react';
import { Heart, Zap, Award, Share2, UserPlus, MessageSquare, GraduationCap, HandHeart, Handshake, ExternalLink } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import PhotoGallery from '../components/PhotoGallery';
import { useSiteImage } from '../hooks/useSiteImage';
import { organization } from '../config/organization';

const JoinUs: React.FC = () => {
  const heroPhoto = useSiteImage('joinus_hero', '/Group SGC pic.jpg', 'STEM Girls Connect celebrating International Day of Girls and Women in Science');

  const perks = [
    {
      title: "Mentorship",
      desc: "Direct connection with STEM professionals and peers for academic and career growth.",
      icon: <Heart color="#82246d" size={40} />
    },
    {
      title: "Skills",
      desc: "Practical STEM and leadership training to help you compete for scholarships, grants, and career opportunities.",
      icon: <Zap color="#82246d" size={40} />
    },
    {
      title: "Opportunities",
      desc: "Access to scholarship, grant, and funding opportunities in STEM fields.",
      icon: <Award color="#82246d" size={40} />
    },
    {
      title: "Networking",
      desc: "Connections with peers and professionals across engineering, medical sciences, ICT, agriculture, mathematics, and more.",
      icon: <Share2 color="#82246d" size={40} />
    }
  ];

  const paths = [
    {
      title: "Become a Member",
      desc: "Join STEM Girls Connect as an official member and become part of a community supporting girls and women in STEM.",
      icon: <UserPlus color="#82246d" size={48} />
    },
    {
      title: "Get Mentorship",
      desc: "Connect with mentors and professionals who can support your academic, personal, and career growth.",
      icon: <Heart color="#82246d" size={48} />
    },
    {
      title: "Become a Mentor",
      desc: "Share your knowledge and experience with girls and young women who are exploring or building careers in STEM.",
      icon: <GraduationCap color="#82246d" size={48} />
    },
    {
      title: "Volunteer",
      desc: "Contribute your time and skills to support programs, outreach, events, communications, or other SGC activities.",
      icon: <HandHeart color="#82246d" size={48} />
    },
    {
      title: "Partner With Us",
      desc: "Work with STEM Girls Connect to expand access to STEM education, mentorship, opportunities, and community impact.",
      icon: <Handshake color="#82246d" size={48} />
    }
  ];

  return (
    <div className="pb-24">
      <Seo
        title="Join Us | STEM Girls Connect"
        description="Join STEM Girls Connect and become part of a community empowering girls and young women pursuing STEM."
        path="/join"
      />
      <PageHeader 
        title="Join Our Community" 
        subtitle="Join a community of girls, young women, and mentors building futures in STEM." 
      />

      <section className="container mx-auto px-6 py-16">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brandGreen uppercase tracking-tighter">Choose Your Path</h2>
          <div className="h-1.5 w-24 bg-brandPink mx-auto mt-4 rounded-full"></div>
        </ScrollReveal>

        <div className="grid justify-items-center sm:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(300px,370px))] lg:justify-center gap-8 max-w-6xl mx-auto">
          {paths.map((path, i) => (
            <ScrollReveal key={path.title} delay={i * 100} className="w-full bg-[#486e7c]/5 dark:bg-white/5 p-8 rounded-[50px] border border-gray-100 dark:border-slate-700 flex flex-col h-full hover:bg-white dark:hover:bg-slate-800 hover:shadow-2xl transition-all group">
              <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-sm w-fit group-hover:scale-110 transition-transform duration-500">
                {path.icon}
              </div>
              <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">{path.title}</h3>
              <p className="text-brandSlate text-lg mb-8 text-justify leading-relaxed font-bold">
                {path.desc}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-6">
        <PhotoGallery images={[{ src: heroPhoto.src, alt: heroPhoto.alt }]}>
          {(open) => (
            <ScrollReveal className="max-w-4xl mx-auto mb-16 rounded-[50px] overflow-hidden shadow-2xl border-4 border-brandPink/10 aspect-[3/2]">
              <img
                src={heroPhoto.src}
                alt={heroPhoto.alt}
                onClick={() => open(0)}
                className="w-full h-full object-cover object-top cursor-zoom-in"
              />
            </ScrollReveal>
          )}
        </PhotoGallery>
      </section>

      <section className="bg-white dark:bg-slate-800 py-6">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandGreen uppercase tracking-tighter">What’s in it for you?</h2>
            <p className="text-brandSlate font-bold mt-2 uppercase tracking-widest text-xs italic">Benefits of Joining STEM Girls Connect</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:[grid-template-columns:repeat(auto-fit,minmax(260px,300px))] lg:justify-center gap-8 max-w-7xl mx-auto">
            {perks.map((perk, i) => (
              <ScrollReveal key={i} delay={i * 100} className="bg-[#486e7c]/5 dark:bg-white/5 p-10 rounded-[40px] border border-gray-100 dark:border-slate-700 hover:shadow-lg transition-all text-center flex flex-col items-center">
                <div className="mb-6">{perk.icon}</div>
                <h4 className="text-xl font-extrabold text-brandGreen mb-4 uppercase">{perk.title}</h4>
                <p className="text-brandSlate text-sm font-bold leading-relaxed text-justify">{perk.desc}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brandPink py-16 text-white mb-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <ScrollReveal>
            <MessageSquare color="#FFFFFF" size={48} className="mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-extrabold mb-4 uppercase tracking-tighter">Join Our Community</h2>
            <p className="mb-10 opacity-90 max-w-xl mx-auto font-medium">Join our WhatsApp community for STEM opportunities, updates, conversations, and events.</p>
            <a 
              href={organization.social.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 bg-white dark:bg-slate-800 text-brandPink px-10 py-4 rounded-2xl font-extrabold hover:scale-105 transition-all shadow-2xl uppercase tracking-widest text-sm"
            >
              <span>Join Community</span>
            </a>
          </ScrollReveal>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </section>

      <section className="container mx-auto px-6 py-8">
        <ScrollReveal className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-[50px] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700">
          <div className="p-10 flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8">
            <UserPlus color="#82246d" size={40} className="flex-shrink-0" />
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-extrabold text-brandGreen uppercase">Become an Official Member</h2>
              <p className="text-brandSlate text-sm font-bold mt-1">Complete the official membership form to become a registered member of STEM Girls Connect.</p>
            </div>
            <a
              href={organization.forms.membership}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 inline-flex items-center space-x-3 bg-brandPink text-white px-8 py-4 rounded-2xl font-extrabold hover:scale-105 transition-all shadow-lg shadow-brandPink/20 uppercase tracking-widest text-sm"
            >
              <span>Complete Registration</span>
              <ExternalLink size={18} />
            </a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default JoinUs;