import { useGirlhoodBasePath } from '../GirlhoodPaths';
import { useEffect, type ReactNode } from "react";
import { Link, NavLink } from "../GirlhoodRuntime";
import { useGirlhoodLanguage } from "../hooks/useGirlhoodLanguage";
import { ui } from "../config/ui";
import GirlhoodLanguageToggle from "./GirlhoodLanguageToggle";
export default function GirlhoodLayout({ children }: { children: ReactNode }) {
  const basePath = useGirlhoodBasePath();
  const { language, setLanguage } = useGirlhoodLanguage();
  const t = ui[language];
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);
  return (
    <div
      lang={language}
      className="girlhood-shell min-h-screen"
    >
      <a
        className="sr-only focus:not-sr-only focus:block focus:p-4"
        href="#campaign-content"
      >
        {t.skip}
      </a>
      <div className="girlhood-nav flex flex-wrap items-center justify-center gap-4 border-b px-5 py-4">
        <nav
          aria-label={t.home}
          className="flex flex-wrap items-center gap-4 text-sm font-bold"
        >
          <NavLink end to={basePath + ''}>
            {t.home}
          </NavLink>
          <NavLink to={basePath + '/wall'}>{t.voices}</NavLink>
          <GirlhoodLanguageToggle language={language} onChange={setLanguage} />
        </nav>
      </div>
      <section id="campaign-content">{children}</section>
      <nav aria-label={language === "fr" ? "Vos droits" : "Your privacy choices"} className="mx-auto flex max-w-6xl flex-wrap justify-center gap-5 border-t px-5 py-8 text-sm font-bold">
        <Link to={basePath + '/privacy'}>{t.privacy}</Link>
        <Link to={basePath + '/withdraw'}>{t.withdraw}</Link>
      </nav>
    </div>
  );
}
