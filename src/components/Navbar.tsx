import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Sun, Moon } from 'lucide-react';
import { navigation, isNavGroup, NavGroupItem } from '../config/navigation';
import { useTheme } from '../context/ThemeContext';

/** Desktop dropdown for a nav group. Click to toggle, closes on outside click or route change. */
const NavDropdown: React.FC<{ item: NavGroupItem; isActive: (path: string) => boolean }> = ({ item, isActive }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const groupActive = item.children.some((c) => isActive(c.path));

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 text-sm font-semibold transition-colors duration-200 hover:text-brandPink ${
          groupActive ? 'text-brandPink' : 'text-brandSlate'
        }`}
      >
        {item.label}
        <ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-3 w-52 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden py-2 z-50">
          {item.children.map((child) => (
            <Link
              key={child.path}
              to={child.path}
              onClick={() => setOpen(false)}
              className={`block px-5 py-3 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                isActive(child.path) ? 'text-brandPink' : 'text-brandSlate'
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mobileOpenGroups, setMobileOpenGroups] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  return (
    <nav className="fixed top-0 w-full bg-neutralWhite/95 dark:bg-slate-900/95 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-700 h-20 flex items-center shadow-sm">
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center group">
          <div className="h-16 w-18 border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
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
          {navigation.map((item) =>
            isNavGroup(item) ? (
              <NavDropdown key={item.label} item={item} isActive={isActive} />
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-semibold transition-colors duration-200 hover:text-brandPink ${
                  isActive(item.path) ? 'text-brandPink border-b-2 border-brandPink pb-1' : 'text-brandSlate'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2.5 rounded-full text-brandSlate hover:text-brandPink hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <Link
            to="/donate"
            className="bg-brandPink text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-brandPink/20 hover:scale-105 transition-transform"
          >
            Donate
          </Link>
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-brandSlate"
          >
            {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
          </button>
          <button
            className="p-2 text-brandGreen"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu Card */}
        {isOpen && (
          <div className="absolute top-14 right-0 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-700 lg:hidden transform fade-in-up z-[100] overflow-hidden transition-all duration-1000">
            <div className="flex flex-col p-4">
              {navigation.map((item) =>
                isNavGroup(item) ? (
                  <div key={item.label}>
                    <button
                      onClick={() =>
                        setMobileOpenGroups((g) => ({ ...g, [item.label]: !g[item.label] }))
                      }
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-xl text-lg font-medium ${
                        item.children.some((c) => isActive(c.path)) ? 'text-brandPink' : 'text-brandSlate'
                      }`}
                    >
                      {item.label}
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${
                          mobileOpenGroups[item.label] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {mobileOpenGroups[item.label] && (
                      <div className="pl-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`block py-3 px-4 rounded-xl text-base font-medium ${
                              isActive(child.path) ? 'bg-brandPink/5 text-brandPink' : 'text-brandSlate'
                            }`}
                            onClick={() => setIsOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`py-3 px-4 rounded-xl text-lg font-medium ${
                      isActive(item.path) ? 'bg-brandPink/5 text-brandPink' : 'text-brandSlate'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              )}
              <Link
                to="/donate"
                className="mt-4 bg-brandPink text-white py-4 rounded-xl text-center font-bold"
                onClick={() => setIsOpen(false)}
              >
                Donate
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
