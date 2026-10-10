import type { CSSProperties } from 'react';

/**
 * Very small dots that drift slowly behind the hero text, like particles in still water.
 * Pure CSS (transform and opacity only), no animation library. They are positioned from a fixed
 * seed so the pattern looks scattered but never changes between renders. Under reduced motion
 * the dots stay visible and still.
 */
const seeded = (seed: number) => {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
};
const dots = (() => {
  const next = seeded(11);
  return Array.from({ length: 30 }, (_, i) => ({
    left: next() * 100,
    top: next() * 100,
    size: 1.5 + next() * 2.5,
    opacity: 0.16 + next() * 0.5,
    duration: 24 + next() * 28,
    delay: -next() * 40,
    dx: (next() - 0.5) * 44,
    dy: (next() - 0.65) * 56,
    fade: i % 5 === 0,
  }));
})();

export default function HeroParticles() {
  return (
    <div className="girlhood-particles" aria-hidden="true">
      {dots.map((d, i) => (
        <i
          key={i}
          className={d.fade ? 'is-fade' : undefined}
          style={
            {
              left: d.left + '%',
              top: d.top + '%',
              width: d.size + 'px',
              height: d.size + 'px',
              '--o': d.opacity,
              '--t': d.duration + 's',
              '--d': d.delay + 's',
              '--dx': d.dx + 'px',
              '--dy': d.dy + 'px',
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
