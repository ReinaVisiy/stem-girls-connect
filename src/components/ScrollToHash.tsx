import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Height of the fixed navbar (h-20) plus a little breathing room.
const NAVBAR_OFFSET = 96;
const POLL_MS = 100;
const GIVE_UP_MS = 5000;

// Position of an element from the top of the document. Uses offsetTop so the
// ScrollReveal slide-in transform does not skew the result.
function documentTop(el: HTMLElement): number {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return top;
}

/**
 * Scrolls to the element named by the URL hash (e.g. /about#bureau).
 * Sections on this site often render after data loads, so it keeps looking
 * for a few seconds, and it backs off as soon as the visitor scrolls
 * themselves. Does nothing when the URL has no hash.
 */
const ScrollToHash: React.FC = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (!hash || hash.length < 2) return;

    let id = hash.slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* keep the raw value */
    }

    let cancelled = false;
    const stop = () => {
      cancelled = true;
    };
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true }));

    const scrollToTarget = (el: HTMLElement) => {
      window.scrollTo({ top: Math.max(0, documentTop(el) - NAVBAR_OFFSET), behavior: 'auto' });
    };

    const started = Date.now();
    let settleTimer: number | undefined;
    const poll = window.setInterval(() => {
      if (cancelled || Date.now() - started > GIVE_UP_MS) {
        window.clearInterval(poll);
        return;
      }
      const el = document.getElementById(id);
      if (!el) return;
      window.clearInterval(poll);
      scrollToTarget(el);
      // One more pass once images and lazy content above have settled.
      settleTimer = window.setTimeout(() => {
        if (!cancelled) scrollToTarget(el);
      }, 600);
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      if (settleTimer) window.clearTimeout(settleTimer);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [pathname, hash]);

  return null;
};

export default ScrollToHash;
