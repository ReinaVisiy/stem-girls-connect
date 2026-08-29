import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Linkedin, Instagram, Youtube, Mail, MapPin } from 'lucide-react';
import { organization } from '../config/organization';
import TikTokIcon from './icons/TikTokIcon';
import NewsletterForm from './NewsletterForm';

const Footer: React.FC = () => {
  return (
    <footer className="bg-footerGray pt-16 pb-8 border-t border-gray-200">
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center mb-12 space-y-2">
          <h3 className="text-brandGreen font-extrabold text-3xl tracking-tighter uppercase">{organization.name}</h3>
          <p className="text-brandPink font-bold text-sm tracking-[0.2em] uppercase">Nurturing Women in STEM</p>
        </div>

        <div className="mb-12">
          <NewsletterForm />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-t border-gray-300 pt-12">
          
          {/* Navigation Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-sm text-brandSlate font-bold">
              <li><Link to="/" className="hover:text-brandPink transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-brandPink transition-colors">About Us</Link></li>
              <li><Link to="/activities" className="hover:text-brandPink transition-colors">Activities</Link></li>
              <li><Link to="/impact" className="hover:text-brandPink transition-colors">Impact & Evidence</Link></li>
              <li><Link to="/blog" className="hover:text-brandPink transition-colors">Blog</Link></li>
              <li><Link to="/join" className="hover:text-brandPink transition-colors">Join Us</Link></li>
              <li><Link to="/donate" className="hover:text-brandPink transition-colors">Support Us</Link></li>
            </ul>
          </div>

          {/* About Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest">About</h4>
            <p className="text-brandSlate text-sm leading-relaxed text-justify font-medium">
              Empowering the next generation of females in STEM through focused advocacy, rigorous STEM training, and professional mentorship.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a href={organization.social.facebook} target="_blank" rel="noopener noreferrer" className="bg-brandPink text-white p-2.5 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-brandPink/20">
                <Facebook size={18} />
              </a>
              <a href={organization.social.linkedin} target="_blank" rel="noopener noreferrer" className="bg-brandPink text-white p-2.5 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-brandPink/20">
                <Linkedin size={18} />
              </a>
              <a href={organization.social.instagram} target="_blank" rel="noopener noreferrer" className="bg-brandPink text-white p-2.5 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-brandPink/20">
                <Instagram size={18} />
              </a>
              <a href={organization.social.youtube} target="_blank" rel="noopener noreferrer" className="bg-brandPink text-white p-2.5 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-brandPink/20">
                <Youtube size={18} />
              </a>
              {/* Custom SVG glyph: lucide-react has no TikTok brand icon */}
              <a href={organization.social.tiktok} target="_blank" rel="noopener noreferrer" className="bg-brandPink text-white p-2.5 rounded-xl hover:scale-110 transition-transform shadow-lg shadow-brandPink/20">
                <TikTokIcon size={18} color="white" />
              </a>
            </div>
          </div>

          {/* Connect Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Connect</h4>
            <ul className="space-y-4 text-sm text-brandSlate font-medium">
              <li className="flex items-center space-x-3">
                <Mail color="#82246d" size={18} className="flex-shrink-0" />
                <span>{organization.contact.email}</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin color="#82246d" size={18} className="flex-shrink-0 mt-1" />
                <span>Headquarters: {organization.contact.location}.</span>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div className="space-y-4">
            <h4 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Legal Status</h4>
            <p className="text-[11px] text-brandSlate text-justify leading-relaxed font-semibold">
              Registered Association (No. 023/RDA/F.32/SASC) since April 23, 2024. Established under Law No. 90/053 of Dec 19, 1990, dedicated to global scientific and educational advancement.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-300 pt-8 text-center text-[10px] text-brandSlate font-extrabold uppercase tracking-[0.3em]">
          <p>© {new Date().getFullYear()} {organization.name}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;