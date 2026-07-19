import React from 'react';
import { Layers, Presentation, Users2, ExternalLink, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';

const Activities: React.FC = () => {
  return (
    <div className="pb-24">
      <PageHeader 
        title="Impact & Evidence" 
        subtitle="Transforming passion into profession through curated STEM excellence." 
      />

      <section className="container mx-auto px-6 py-20">
        {/* Core explanation */}
        <ScrollReveal className="max-w-4xl mx-auto text-center mb-16">
          <p className="text-xl md:text-2xl text-brandSlate font-bold leading-relaxed text-justify">
            Our primary activity focuses on orientating, training, and mentoring girls and young women on learning opportunities and scholarships in STEM related fields.
          </p>
          <div className="h-1.5 w-24 bg-brandPink mx-auto mt-10 rounded-full"></div>
        </ScrollReveal>

        {/* Strategic Impact Image */}
        <ScrollReveal delay={100} className="max-w-5xl mx-auto mb-24 rounded-[60px] overflow-hidden shadow-2xl border-8 border-white">
          <img 
            src="/Little STEM Girls.jpg" 
            alt="Nurturing the next generation of STEM girls" 
            className="w-full h-[400px] object-cover hover:scale-105 transition-transform duration-700"
          />
        </ScrollReveal>

        {/* Outreach Gallery */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-24">
          <ScrollReveal className="rounded-[40px] overflow-hidden shadow-xl border-4 border-white aspect-[4/3]">
            <img
              src="/SGC outreach Foumban.jpg"
              alt="STEM Girls Connect outreach in Foumban"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </ScrollReveal>
          <ScrollReveal delay={100} className="rounded-[40px] overflow-hidden shadow-xl border-4 border-white aspect-[4/3]">
            <img
              src="/SGC Outreach class.jpg"
              alt="STEM Girls Connect outreach classroom session"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
            />
          </ScrollReveal>
        </div>

        {/* The Three Pillars */}
        <div className="grid md:grid-cols-3 gap-12 mb-24">
          {/* Advocacy */}
          <ScrollReveal className="flex flex-col bg-white p-10 rounded-[50px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <Presentation color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Advocacy</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                <span className="text-sm font-semibold text-brandSlate">Promoting STEM inclusion and policy changes to create a safer, more equitable environment for women.</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                <span className="text-sm font-semibold text-brandSlate">Raising awareness on vital women’s issues, including gender-based violence (GBV) and menstrual health.</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Workshops */}
          <ScrollReveal delay={100} className="flex flex-col bg-white p-10 rounded-[50px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <Layers color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Workshops</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                <span className="text-sm font-semibold text-brandSlate">Specialized training on scholarship searches, grant applications, and professional opportunity navigation.</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                <span className="text-sm font-semibold text-brandSlate">Hands-on leadership development and technical skill-building sessions for career readiness.</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Mentorship */}
          <ScrollReveal delay={200} className="flex flex-col bg-white p-10 rounded-[50px] border border-gray-100 shadow-xl hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <Users2 color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Mentorship</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                <span className="text-sm font-semibold text-brandSlate">Direct interactions with STEM leaders.</span>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle2 color="#82246d" size={18} className="mt-1 flex-shrink-0" />
                <span className="text-sm font-semibold text-brandSlate">Experience sharing for career growth.</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Impact Archive Section */}
        <ScrollReveal className="bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden max-w-5xl mx-auto">
          <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 bg-gray-50/50">
            <div>
              <h2 className="text-2xl font-extrabold text-brandGreen uppercase">Reports & Records</h2>
              <p className="text-brandSlate text-sm font-bold mt-1">Impact Archive of Completed Activities.</p>
            </div>
            <a 
              href="https://drive.google.com/drive/folders/1Njv9u95nx5YeROOD1OT-kKRasUe4cODY" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 bg-brandPink text-white px-8 py-3 rounded-xl font-extrabold hover:scale-105 transition-all shadow-lg text-sm uppercase tracking-widest"
            >
              <span>Full Archive</span>
              <ExternalLink size={18} />
            </a>
          </div>
          <div className="w-full h-[300px] bg-white">
            <iframe 
              src="https://drive.google.com/embeddedfolderview?id=1Njv9u95nx5YeROOD1OT-kKRasUe4cODY#grid" 
              className="w-full h-full border-none"
              frameBorder="0"
              title="STEM Girls Connect Reports Archive"
              loading="lazy"
            ></iframe>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Activities;