import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Activities', path: '/activities' },
    { name: 'Join Us', path: '/join' },
    { name: 'Contact', path: '/contact' },
    { name: 'Donate', path: '/donate' },
  ];

  const whatsappLink = "https://chat.whatsapp.com/BlVCmJA4c6Q5qYIbgNkrJC";

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full bg-neutralWhite/95 backdrop-blur-md z-50 border-b border-gray-100 h-20 flex items-center shadow-sm">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center group">
          <div className="h-16 w-18 border-gray-100 bg-white p-1">
            <img 
              src="/logo.png" 
              alt="STEM Girls Connect Logo" 
              className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="text-brandGreen font-extrabold text-xl tracking-tight ml-2">
            STEM GIRLS CONNECT
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-sm font-semibold transition-colors duration-200 hover:text-brandPink ${
                isActive(link.path) ? 'text-brandPink border-b-2 border-brandPink pb-1' : 'text-brandSlate'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-brandPink text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brandPink/20 hover:scale-105 transition-transform"
          >
            Join Community
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2 text-brandGreen"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        {/* Mobile Menu Card*/}
        {isOpen && (
          <div className="absolute top-14 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 lg:hidden transform fade-in-up z-[100] overflow-hidden transition-all duration-1000">
            <div className="flex flex-col p-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`py-3 px-4 rounded-xl text-lg font-medium ${
                    isActive(link.path) ? 'bg-brandPink/5 text-brandPink' : 'text-brandSlate'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 bg-brandPink text-white py-4 rounded-xl text-center font-bold"
                onClick={() => setIsOpen(false)}
              >
                Join Community
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;