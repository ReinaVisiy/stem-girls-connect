import type { GirlhoodLanguage } from '../types';

const text: Record<GirlhoodLanguage, string> = {
  en: 'Happy International Day of the Girl Child',
  fr: 'Joyeuse Journée internationale de la fille',
};

/** The greeting is shown during October, the month of 11 October (International Day of the Girl Child). */
export const isGreetingSeason = (now: Date = new Date()) => now.getMonth() === 9;

/**
 * Each word fades and rises softly into place, one after another. CSS only, so it works across
 * several lines with no layout shift. Under reduced motion the words simply show.
 * (The file keeps its old name; it no longer types letter by letter.)
 */
export default function TypewriterGreeting({ language }: { language: GirlhoodLanguage }) {
  const full = text[language];
  const words = full.split(' ');
  return (
    <p className="girlhood-greeting" lang={language}>
      <span className="sr-only">{full}</span>
      <span className="girlhood-greeting-live" aria-hidden="true">
        {words.map((word, i) => (
          <span key={i} className="girlhood-greeting-word" style={{ animationDelay: `${0.15 + i * 0.22}s` }}>
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </span>
    </p>
  );
}
