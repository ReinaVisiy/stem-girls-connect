import React from 'react';
import { Heart, Zap, Award, Share2, UserPlus, MessageSquare, Microscope, GraduationCap, ExternalLink } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { organization } from '../config/organization';

const JoinUs: React.FC = () => {
  const perks = [
    {
      title: "Mentorship",
      desc: "Direct connection with STEM professionals and peers for academic and career growth.",
      icon: <Heart color="#82246d" size={40} />
    },
    {
      title: "Skills",
      desc: "Hands-on STEM and Leadership training designed for global workforce readiness.",
      icon: <Zap color="#82246d" size={40} />
    },
    {
      title: "Opportunities",
      desc: "Access to Scholarship, Grant, and Funding alerts within scientific domains.",
      icon: <Award color="#82246d" size={40} />
    },
    {
      title: "Networking",
      desc: "Growth in Engineering, Medical Sciences, ICT, Agriculture, Mathematics, and more.",
      icon: <Share2 color="#82246d" size={40} />
    }
  ];

  return (
    <div className="pb-24">
      <Seo
        title="Join Us | STEM Girls Connect"
        description="Join STEM Girls Connect and become part of a community empowering girls and young women pursuing STEM in Cameroon."
        path="/join"
      />
      <PageHeader 
        title="Join Our Community" 
        subtitle="Be a part of a global movement redefining the scientific landscape." 
      />

      <section className="container mx-auto px-6 py-16">
        <ScrollReveal className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-brandGreen uppercase tracking-tighter">Choose Your Path</h2>
          <div className="h-1.5 w-24 bg-brandPink mx-auto mt-4 rounded-full"></div>
        </ScrollReveal>

        <div className="grid justify-items-center lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <ScrollReveal className="bg-[#486e7c]/5 p-8 rounded-[50px] border border-gray-100 flex flex-col h-full hover:bg-white hover:shadow-2xl transition-all group">
            <div className="mb-8 p-6 bg-white rounded-3xl shadow-sm w-fit group-hover:scale-110 transition-transform duration-500">
              <Microscope color="#82246d" size={48} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Professional Mentor</h3>
            <p className="text-brandSlate text-lg mb-8 text-justify leading-relaxed font-bold">
              An experienced woman in science ready to mentor and empower the younger generation.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={200} className="bg-brandGreen/5 p-8 rounded-[50px] border border-gray-100 flex flex-col h-full hover:bg-white hover:shadow-2xl transition-all group">
            <div className="mb-8 p-6 bg-white rounded-3xl shadow-sm w-fit group-hover:scale-110 transition-transform duration-500">
              <GraduationCap color="#82246d" size={48} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Peer Mentor</h3>
            <p className="text-brandSlate text-lg mb-8 text-justify leading-relaxed font-bold">
              A girl or young woman in science eager to inspire others while receiving guidance from professionals.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="container mx-auto px-6">
        <ScrollReveal className="max-w-4xl mx-auto mb-16 rounded-[50px] overflow-hidden shadow-2xl border-4 border-brandPink/10 aspect-[3/2]">
          <img
            src="/IDGWS.jpg"
            alt="STEM Girls Connect celebrating International Day of Girls and Women in Science"
            className="w-full h-full object-cover object-top"
          />
        </ScrollReveal>
      </section>

      <section className="bg-white py-6">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold text-brandGreen uppercase tracking-tighter">What’s in it for you?</h2>
            <p className="text-brandSlate font-bold mt-2 uppercase tracking-widest text-xs italic">Benefits of Joining STEM Girls Connect</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {perks.map((perk, i) => (
              <ScrollReveal key={i} delay={i * 100} className="bg-[#486e7c]/5 p-10 rounded-[40px] border border-gray-100 hover:shadow-lg transition-all text-center flex flex-col items-center">
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
            <p className="mb-10 opacity-90 max-w-xl mx-auto font-medium">Connect with our official WhatsApp community for real-time scientific collaboration and global STEM news.</p>
            <a 
              href={organization.social.whatsapp} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 bg-white text-brandPink px-10 py-4 rounded-2xl font-extrabold hover:scale-105 transition-all shadow-2xl uppercase tracking-widest text-sm"
            >
              <span>Join Community</span>
            </a>
          </ScrollReveal>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
      </section>

      <section className="container mx-auto px-6 py-8">
        <ScrollReveal className="max-w-4xl mx-auto bg-white rounded-[50px] shadow-2xl overflow-hidden border border-gray-100">
          <div className="p-10 flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-8">
            <UserPlus color="#82246d" size={40} className="flex-shrink-0" />
            <div className="flex-grow text-center md:text-left">
              <h2 className="text-2xl font-extrabold text-brandGreen uppercase">Official Membership</h2>
              <p className="text-brandSlate text-sm font-bold mt-1">Complete the official registration form to finalize your STEM onboarding.</p>
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