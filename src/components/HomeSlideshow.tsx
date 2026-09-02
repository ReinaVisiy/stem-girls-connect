import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApiData } from '../hooks/useApiData';

interface SlideshowItem {
  id: number;
  image_url: string;
  caption: string;
  display_order: number;
}

const ROTATE_MS = 5000;

/**
 * Auto-rotating slideshow backed by the home_slideshow table via
 * /api/slideshow. Renders full-bleed, breaking out of its parent's
 * container to fill the width of the page (currently used on the
 * Programs/Activities page). Includes manual prev/next arrows in
 * addition to autoplay. Falls back to a single static image if the
 * fetch fails or hasn't resolved yet, so the slot is never empty.
 */
const HomeSlideshow: React.FC = () => {
  const { data, loading, error } = useApiData<SlideshowItem[]>('/api/slideshow');
  const [index, setIndex] = useState(0);

  const slides = data && data.length > 0 ? data : null;

  useEffect(() => {
    if (!slides || slides.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [slides]);

  const goPrev = () => {
    if (!slides) return;
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };
  const goNext = () => {
    if (!slides) return;
    setIndex((i) => (i + 1) % slides.length);
  };

  // Full-bleed panel: breaks out of the parent container so the photo
  // fills the entire width of the page, edge to edge, with no rounded
  // corners or border.
  const containerClass =
    'relative w-screen left-1/2 right-1/2 -mx-[50vw] mb-24 overflow-hidden h-[45vh] md:h-[60vh] bg-brandSlate/10';

  if ((loading && !slides) || (error && !slides)) {
    return (
      <div className={containerClass}>
        <img
          src="/Group SGC pic Bamenda.jpg"
          alt="STEM Girls Connect in Action"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (!slides) return null;

  return (
    <div className={containerClass}>
      {slides.map((slide, i) => (
        <img
          key={slide.id}
          src={slide.image_url}
          alt={slide.caption || 'STEM Girls Connect'}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
          >
            <ChevronRight size={28} />
          </button>

          <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => setIndex(i)}
                aria-label={`Show slide ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-2.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default HomeSlideshow;
