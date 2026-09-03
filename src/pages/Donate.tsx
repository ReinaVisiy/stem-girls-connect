import React from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import ScrollReveal from '../components/ScrollReveal';
import Seo from '../components/Seo';
import { useSiteImage } from '../hooks/useSiteImage';

const FAPSHI_DONATE_URL = 'https://donate.fapshi.com/13722678';

const Donate: React.FC = () => {
  const heroPhoto = useSiteImage(
    'donate_hero',
    '/Little STEM Girls.jpg',
    'STEM Girls Connect students in class holding STEM signs'
  );

  return (
    <div className="pb-24">
      <Seo
        title="Donate | STEM Girls Connect"
        description="Support STEM Girls Connect's mission to empower girls and young women in STEM with a donation."
        path="/donate"
      />
      <section className="relative overflow-hidden min-h-[520px] flex items-center">
        {/* Background photograph, cropped to keep the focus on the girls rather than the chalkboard above them */}
        <img
          src={heroPhoto.src}
          alt={heroPhoto.alt}
          className="absolute inset-0 w-full h-full object-cover object-[50%_80%]"
        />
        {/* Brand-colored overlay: deep purple wash + dark gradient for text contrast, in both light and dark mode */}
        <div className="absolute inset-0 bg-gradient-to-b from-brandPink/85 via-brandPink/75 to-slate-900/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        <div className="relative z-10 container mx-auto px-6 py-20">
          <ScrollReveal>
            <div className="max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-brandGreen mb-4 uppercase tracking-tighter drop-shadow-lg">
                Support Us
              </h1>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-6 uppercase tracking-tight italic drop-shadow-lg">
                Help a Girl Go Further in STEM
              </h2>
              <p className="text-white/90 text-lg leading-relaxed font-semibold max-w-xl">
                Your support helps STEM Girls Connect provide training, mentorship, outreach, and access to opportunities for girls and young women building their futures in STEM. Your donation helps fund our training workshops, mentorship programs, and outreach to schools. We're committed to transparency in how these funds are used: see our <Link to="/impact" className="text-white font-extrabold underline underline-offset-2">Reports &amp; Records</Link> for details.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="container mx-auto px-6 pt-24 pb-24">
        <ScrollReveal className="max-w-xl mx-auto bg-white dark:bg-slate-800 p-12 rounded-[50px] shadow-2xl border-2 border-brandPink/10 flex flex-col items-center text-center hover:border-brandPink transition-all duration-300">
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

          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl border border-gray-100 dark:border-slate-700">
            <QRCodeSVG value={FAPSHI_DONATE_URL} size={180} fgColor="#82246d" />
          </div>
          <p className="text-brandSlate text-xs font-bold mt-4 uppercase tracking-widest">Or scan to donate from your phone.</p>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Donate;