import React, { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** e.g. "300+", "1,200", "40+" — leading numeric part is animated, the rest (like "+") is kept as a static suffix */
  value: string;
  duration?: number;
}

/**
 * Animates a number from 0 up to the numeric value parsed out of `value`
 * once it scrolls into view, then holds. Non-numeric values are shown as-is.
 */
const CountUp: React.FC<CountUpProps> = ({ value, duration = 1600 }) => {
  const match = value.match(/^([\d,]+)(.*)$/);
  const target = match ? parseInt(match[1].replace(/,/g, ''), 10) : null;
  const suffix = match ? match[2] : '';

  const [display, setDisplay] = useState(target === null ? value : '0');
  const ref = useRef<HTMLSpanElement>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (target === null) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasRun.current) {
          hasRun.current = true;
          const start = performance.now();

          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplay(Math.round(eased * target).toLocaleString());
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {target === null ? value : display}
      {suffix}
    </span>
  );
};

export default CountUp;
