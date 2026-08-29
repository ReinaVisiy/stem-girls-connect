import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';

const FAPSHI_DONATE_URL = 'https://donate.fapshi.com/13722678';

const Donate: React.FC = () => {
  return (
    <div className="pb-24">
      <Seo
        title="Donate | STEM Girls Connect"
        description="Support STEM Girls Connect's mission to empower girls and young women in STEM with a donation."
        path="/donate"
      />
      <PageHeader 
        title="Support Us" 
        subtitle="Fund STEM training, mentorship, and outreach for girls." 
      />

      <section className="container mx-auto px-6 py-12 text-center">
        <ScrollReveal>
          <div className="inline-flex p-5 bg-brandPink/10 rounded-full mb-10">
            <Heart color="#82246d" size={32} fill="#82246d" className="animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-brandGreen mb-10 uppercase tracking-tighter italic">Support STEM Girls Connect</h2>
          <p className="text-brandSlate max-w-3xl mx-auto text-lg leading-relaxed font-medium text-justify">
            Support STEM Girls Connect in empowering girls and young women in STEM. Your donation directly funds our training workshops, mentorship programs, and outreach to schools. We're committed to transparency in how these funds are used: see our <Link to="/impact" className="text-brandPink font-extrabold underline underline-offset-2">Reports & Records</Link> for details.
          </p>
        </ScrollReveal>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <ScrollReveal className="max-w-xl mx-auto bg-white p-12 rounded-[50px] shadow-2xl border-2 border-brandPink/10 flex flex-col items-center text-center hover:border-brandPink transition-all duration-300">
          <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">Donate via Mobile Money or Orange Money</h3>
          <p className="text-brandSlate text-sm font-bold mb-10 leading-relaxed">
            Your donation is processed securely through Fapshi. Pay by MTN Mobile Money or Orange Money.
          </p>

          <a
            href={FAPSHI_DONATE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-brandPink text-white py-5 rounded-2xl font-extrabold shadow-xl shadow-brandPink/30 hover:scale-[1.03] transition-all text-center uppercase tracking-widest text-sm mb-10"
          >
            Donate Now
          </a>

          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
            <QRCodeSVG value={FAPSHI_DONATE_URL} size={180} fgColor="#82246d" />
          </div>
          <p className="text-brandSlate text-xs font-bold mt-4 uppercase tracking-widest">Or scan to donate from your phone.</p>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Donate;