import React, { useState } from 'react';
import { Mail, Facebook, Linkedin, Instagram, Youtube, MessageSquare, MapPin, Send } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import PageHeader from '../components/PageHeader';
import Seo from '../components/Seo';
import TikTokIcon from '../components/icons/TikTokIcon';
import { organization } from '../config/organization';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/meaqjgaq';
type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<FormStatus>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="pb-24">
      <Seo
        title="Contact Us | STEM Girls Connect"
        description="Get in touch with STEM Girls Connect to learn more, collaborate, or support our mission to empower girls and young women in STEM."
        path="/contact"
      />
      <PageHeader 
        title="Contact Us" 
        subtitle="We'd love to hear from you." 
      />

      <section className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <ScrollReveal className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <MapPin color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-4 uppercase tracking-tight">Headquarters</h3>
            <p className="text-brandSlate text-lg font-bold leading-relaxed">
              Foumban, West Region, Cameroon
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100} className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <Mail color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-4 uppercase tracking-tight">Email Us</h3>
            <p className="text-brandSlate font-extrabold">{organization.contact.email}</p>
          </ScrollReveal>

          <ScrollReveal delay={200} className="bg-white dark:bg-slate-800 p-12 rounded-[40px] shadow-xl border border-gray-100 dark:border-slate-700 flex flex-col items-center text-center hover:shadow-2xl transition-all">
            <div className="bg-brandPink/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-8">
              <MessageSquare color="#82246d" size={32} />
            </div>
            <h3 className="text-2xl font-extrabold text-brandGreen mb-4 uppercase tracking-tight">Socials</h3>
            <p className="text-brandSlate mb-8 text-sm font-bold">Follow along for updates, photos, and opportunities.</p>
            <div className="flex flex-wrap justify-center gap-4 mt-auto">
              <a href={organization.social.facebook} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm">
                <Facebook size={24} />
              </a>
              <a href={organization.social.linkedin} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm">
                <Linkedin size={24} />
              </a>
              <a href={organization.social.instagram} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm">
                <Instagram size={24} />
              </a>
              <a href={organization.social.youtube} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm">
                <Youtube size={24} />
              </a>
              {/* Custom SVG glyph: lucide-react has no TikTok brand icon */}
              <a href={organization.social.tiktok} target="_blank" rel="noopener noreferrer" className="p-4 bg-gray-50 dark:bg-slate-700 rounded-2xl hover:bg-brandPink hover:text-white transition-all text-brandPink shadow-sm flex items-center">
                <TikTokIcon size={24} color="currentColor" />
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="container mx-auto px-6 mb-20">
        <ScrollReveal className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-10 md:p-14 rounded-[50px] shadow-2xl border border-gray-100 dark:border-slate-700">
          <h2 className="text-2xl font-extrabold text-brandGreen mb-8 uppercase tracking-tight text-center">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="sr-only">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                placeholder="Your name"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-brandSlate focus:outline-none focus:ring-2 focus:ring-brandPink/40"
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-brandSlate focus:outline-none focus:ring-2 focus:ring-brandPink/40"
              />
            </div>
            <div>
              <label htmlFor="message" className="sr-only">Message</label>
              <textarea
                id="message"
                name="message"
                required
                rows={5}
                value={form.message}
                onChange={handleChange}
                placeholder="How can we help?"
                className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-slate-700 text-sm font-medium text-brandSlate focus:outline-none focus:ring-2 focus:ring-brandPink/40 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full inline-flex items-center justify-center gap-3 bg-brandPink text-white py-5 rounded-2xl font-extrabold uppercase tracking-widest text-sm shadow-lg shadow-brandPink/20 hover:scale-[1.01] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              <Send size={18} />
              {status === 'submitting' ? 'Sending...' : 'Send Message'}
            </button>

            {status === 'success' && (
              <p className="text-center text-sm font-bold text-brandGreen">Message sent: we'll get back to you soon.</p>
            )}
            {status === 'error' && (
              <p className="text-center text-sm font-bold text-red-500">
                Something went wrong. Please try again, or email us directly at {organization.contact.email}.
              </p>
            )}
          </form>
        </ScrollReveal>
      </section>

      <section className="container mx-auto px-6 mb-20">
        <ScrollReveal className="bg-brandSlate text-white p-12 md:p-24 rounded-[60px] text-center shadow-2xl overflow-hidden relative">
          <h2 className="text-3xl font-extrabold mb-6 uppercase tracking-tighter relative z-10 italic">
            Reach out
          </h2>
          <p className="text-white/80 max-w-2xl mx-auto font-medium relative z-10 text-justify md:text-center">
            We're always looking for mentors, volunteers, and partner organizations to work with us on STEM training, mentorship, and outreach.
          </p>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default Contact;