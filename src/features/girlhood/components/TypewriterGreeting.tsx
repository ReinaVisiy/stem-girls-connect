import { useEffect, useState } from 'react';
import type { GirlhoodLanguage } from '../types';

const text: Record<GirlhoodLanguage, string> = {
  en: 'Happy International Day of the Girl Child',
  fr: 'Joyeuse Journée internationale de la fille',
};

/** The greeting is shown during October, the month of 11 October (International Day of the Girl Child). */
export const isGreetingSeason = (now: Date = new Date()) => now.getMonth() === 9;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function TypewriterGreeting({ language }: { language: GirlhoodLanguage }) {
  const full = text[language];
  const glyphs = Array.from(full);
  const [count, setCount] = useState(() => (prefersReducedMotion() ? glyphs.length : 0));

  useEffect(() => {
    if (prefersReducedMotion()) { setCount(glyphs.length); return; }
    setCount(0);
    let shown = 0;
    const timer = window.setInterval(() => {
      shown += 1;
      setCount(shown);
      if (shown >= glyphs.length) window.clearInterval(timer);
    }, 55);
    return () => window.clearInterval(timer);
  }, [full]); // eslint-disable-line react-hooks/exhaustive-deps

  const typing = count < glyphs.length;
  return (
    <p className="girlhood-greeting" lang={language}>
      <span className="sr-only">{full}</span>
      <span className="girlhood-greeting-stage" aria-hidden="true">
        {/* The invisible full text reserves the final height, so nothing shifts while typing. */}
        <span className="girlhood-greeting-ghost">{full}</span>
        <span className="girlhood-greeting-live">
          {glyphs.slice(0, count).join('')}
          <span className={'girlhood-cursor' + (typing ? '' : ' is-done')} />
        </span>
      </span>
    </p>
  );
}
