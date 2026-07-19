import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Presentation, Layers, Users2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';

const Home: React.FC = () => {
  return (
    <div className="overflow-hidden">
      <PageHeader 
        title="Exploring the Future of STEM for the Benefit of All"
      />

      {/* Core Identity Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-extrabold text-brandGreen mb-8 uppercase tracking-tighter">
              Empowering the Future of STEM
            </h2>
            <p className="text-brandSlate text-xl mb-12 text-justify leading-relaxed font-semibold max-w-4xl mx-auto">
              STEM Girls Connect is a powerhouse for the next generation of female scientists, engineers, and leaders. We provide the mentorship and resources needed to turn curiosity into global impact. The future of science is female; and it starts here.
            </p>
            
            {/* Added Picture */}
            <div className="max-w-4xl mx-auto mb-12 rounded-[50px] overflow-hidden shadow-2xl border-4 border-brandPink/10 aspect-video">
              <img 
                src="/Group SGC pic.jpg" 
                alt="STEM Girls Connect in Action" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 max-w-2xl mx-auto">
              <Link 
                to="/activities" 
                className="w-full sm:w-auto bg-brandPink text-white px-10 py-5 rounded-2xl font-extrabold shadow-xl shadow-brandPink/30 hover:scale-[1.02] transition-all text-center uppercase tracking-widest text-sm"
              >
                Explore Our Activities
              </Link>
              <Link 
                to="/join" 
                className="w-full sm:w-auto border-2 border-brandPink text-brandPink px-10 py-5 rounded-2xl font-extrabold hover:bg-brandPink hover:text-white transition-all text-center uppercase tracking-widest text-sm"
              >
                Join the Movement
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Streamlined Activities Preview */}
      <section className="py-24 bg-white border-y border-gray-100">
        <div className="container mx-auto px-6">
          <ScrollReveal className="text-center mb-16">
            <h2 className="text-2xl font-extrabold text-brandGreen uppercase tracking-widest">Core Activity Pillars</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-12 text-center">
            <ScrollReveal delay={100} className="bg-[#486e7c]/5 p-8 rounded-[40px] border border-gray-100">
              <Presentation color="#82246d" size={40} className="mb-6 mx-auto" />
              <h4 className="text-lg font-extrabold mb-2 text-brandGreen uppercase">Advocacy</h4>
              <p className="text-brandSlate text-sm font-medium">Policy influence, STEM research, and promoting vital women's health issues.</p>
            </ScrollReveal>
            
            <ScrollReveal delay={200} className="bg-[#486e7c]/5 p-8 rounded-[40px] border border-gray-100">
              <Layers color="#82246d" size={40} className="mb-6 mx-auto" />
              <h4 className="text-lg font-extrabold mb-2 text-brandGreen uppercase">Workshops</h4>
              <p className="text-brandSlate text-sm font-medium">Training on school applications, scholarships, and career-ready leadership.</p>
            </ScrollReveal>
            
            <ScrollReveal delay={300} className="bg-[#486e7c]/5 p-8 rounded-[40px] border border-gray-100">
              <Users2 color="#82246d" size={40} className="mb-6 mx-auto" />
              <h4 className="text-lg font-extrabold mb-2 text-brandGreen uppercase">Mentorship</h4>
              <p className="text-brandSlate text-sm font-medium">Professional interactions and experience sharing with scientific leads.</p>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Support Our Mission Section */}
      <section className="py-24 bg-brandSlate text-white relative">
        <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal>
            <h2 className="text-4xl font-extrabold mb-8 uppercase tracking-tighter italic">Support Our Mission</h2>
            <p className="text-white/80 text-lg text-justify leading-relaxed font-medium mb-10">
              We strive to touch lives across scientific domains, preparing individuals for international opportunities while solving complex challenges with STEM-based innovation. Your support fuels this change.
            </p>
            <Link to="/donate" className="inline-flex items-center space-x-3 bg-brandPink text-white px-12 py-5 rounded-2xl font-extrabold uppercase tracking-widest shadow-2xl shadow-black/20 hover:scale-105 transition-all text-sm">
              <Heart size={18} fill="currentColor" />
              <span>Donate Now</span>
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={200}>
            <div className="rounded-[50px] overflow-hidden shadow-2xl border-4 border-brandPink/30 aspect-[16/9]">
              <img 
                src="/STEMgirl.jpg" 
                alt="STEM Girls Connect Member" 
                className="w-full h-full object-cover"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
};

export default Home;