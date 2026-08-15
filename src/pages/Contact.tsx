import React from 'react';
import { Mail, Facebook, Linkedin, MessageSquare, MapPin } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';

const Contact: React.FC = () => {
  return (
    <div className="pb-24">
      <Seo
        title="Contact Us | STEM Girls Connect"
        description="Get in touch with STEM Girls Connect to learn more, collaborate, or support our mission to empower girls and young women in STEM in Cameroon."
        path="/contact"
      />
      <PageHeader 
        title="Contact Us" 
        subtitle="Connect with our global STEM movement." 
      />

      <section className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Card 1 - Headquarters */}
          <ScrollReveal className="bg-white p-12 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center text-center hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <MapPin color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-4 uppercase tracking-tight">Headquarters</h3>
            <p className="text-brandSlate text-lg font-bold leading-relaxed">
              Foumban<br />West<br />Cameroon
            </p>
          </ScrollReveal>

          {/* Card 2 - Email */}
          <ScrollReveal delay={100} className="bg-white p-12 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center text-center hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <Mail color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-4 uppercase tracking-tight">Direct Email</h3>
            <p className="text-brandSlate mb-8 font-extrabold">stemgirlsconnect@gmail.com</p>
            <a 
              href="mailto:stemgirlsconnect@gmail.com" 
              className="mt-auto bg-brandPink text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all shadow-lg shadow-brandPink/20 text-sm uppercase tracking-widest"
            >
              Send Message
            </a>
          </ScrollReveal>

          {/* Card 3 - Socials */}
          <ScrollReveal delay={200} className="bg-white p-12 rounded-[40px] shadow-xl border border-gray-100 flex flex-col items-center text-center hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <MessageSquare color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-4 uppercase tracking-tight">Socials</h3>
            <p className="text-brandSlate mb-8 text-sm font-bold">Join our online ecosystem for live updates and opportunities.</p>
            <div className="flex space-x-6 mt-auto">
              <a href="https://www.facebook.com/share/1ARdQejW2F/" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm">
                <Facebook size={24} />
              </a>
              <a href="https://www.linkedin.com/company/stem-girls-connect/" target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm">
                <Linkedin size={24} />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Text Block */}
      <section className="container mx-auto px-6 mb-20">
        <ScrollReveal className="bg-brandSlate text-white p-12 md:p-24 rounded-[60px] text-center shadow-2xl overflow-hidden relative">
          <h2 className="text-3xl font-extrabold mb-6 uppercase tracking-tighter relative z-10 italic">
            Reach out
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto font-medium relative z-10 text-justify md:text-center">
            We are always looking for mentors, volunteers, and organizational partners to expand our impact globally. Reach out to collaborate on our upcoming STEM initiatives.
          </p>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Contact;