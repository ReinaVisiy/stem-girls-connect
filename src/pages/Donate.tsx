import React, { useState } from 'react';
import { Smartphone, Heart, Copy, CheckCircle2 } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import { paymentMethods } from '../config/payments';

const Donate: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="pb-24">
      <Seo
        title="Donate | STEM Girls Connect"
        description="Support STEM Girls Connect's mission to empower girls and young women in STEM across Cameroon with a donation."
        path="/donate"
      />
      <PageHeader 
        title="Support Us" 
        subtitle="Investing in the future of STEM leadership." 
      />

      <section className="container mx-auto px-6 py-12 text-center">
        <ScrollReveal>
          <div className="inline-flex p-5 bg-brandPink/10 rounded-full mb-10">
            <Heart color="#82246d" size={32} fill="#82246d" className="animate-pulse" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-brandGreen mb-10 uppercase tracking-tighter italic">Your Support Fuels Impact</h2>
          <p className="text-brandSlate max-w-3xl mx-auto text-lg leading-relaxed font-medium text-justify">
            Funding is the essential fuel for our STEM training workshops, advocacy campaigns, and resource procurement. We maintain a strict policy of financial accountability, ensuring that every donation is effectively utilized to dismantle scientific and educational barriers for females in STEM.
          </p>
        </ScrollReveal>
      </section>

      <section className="container mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-2 gap-10 max-w-5xl mx-auto">
          {paymentMethods.map((method) => (
            <ScrollReveal key={method.id} className={`bg-white p-12 rounded-[50px] shadow-2xl border-2 ${method.color} flex flex-col hover:border-brandPink transition-all duration-300`}>
              <div className="mb-10 flex justify-between items-center">
                <Smartphone color="#82246d" size={48} />
              </div>
              <h3 className="text-2xl font-extrabold text-brandGreen mb-6 uppercase tracking-tight">{method.name}</h3>
              
              <div className="space-y-6 mb-12 flex-grow text-left">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Account Details</label>
                  <div className="flex items-center justify-between bg-gray-50 p-5 rounded-2xl border border-gray-100 mt-2">
                    <span className="text-sm font-mono text-brandSlate font-extrabold break-all">{method.number}</span>
                    <button 
                      onClick={() => copyToClipboard(method.number, method.id)}
                      className="ml-4 text-brandPink hover:bg-white p-2 rounded-xl transition-all shadow-sm border border-transparent"
                    >
                      {copiedId === method.id ? <CheckCircle2 color="#269464" size={22} /> : <Copy color="#82246d" size={22} />}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => window.location.href = method.action}
                className="w-full bg-brandPink text-white py-5 rounded-2xl font-extrabold shadow-xl shadow-brandPink/30 hover:scale-[1.03] transition-all text-center uppercase tracking-widest text-sm"
              >
                {method.btnText}
              </button>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Donate;