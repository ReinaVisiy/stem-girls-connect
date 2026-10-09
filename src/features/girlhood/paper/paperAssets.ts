import paperTop from "../assets/paper-top.webp";
import paperMid from "../assets/paper-mid.webp";
import paperBottom from "../assets/paper-bottom.webp";
import paperTopSm from "../assets/paper-top-sm.webp";
import paperMidSm from "../assets/paper-mid-sm.webp";
import paperBottomSm from "../assets/paper-bottom-sm.webp";
import tape from "../assets/tape.png";
import wall1350 from "../assets/wall-1350.webp";
import wall1920 from "../assets/wall-1920.webp";
import foreground1350 from "../assets/foreground-1350.webp";
import foreground1920 from "../assets/foreground-1920.webp";

/**
 * The paper is three slices cut from one master sheet (see
 * scripts/generate-girlhood-assets.mjs): a deckled top, a repeatable middle
 * and a deckled bottom, so a note can be any height. The same files are used
 * by the on-site note and by the Canvas PNG export, so they always match.
 */
export const PAPER_GEOMETRY = {
  /** Width of every full-size slice in source pixels. */
  width: 1000,
  top: 160,
  mid: 1520,
  bottom: 160,
  /** Tape source size. */
  tapeWidth: 300,
  tapeHeight: 86,
} as const;

export const paperAssets = {
  full: { top: paperTop, mid: paperMid, bottom: paperBottom },
  /** 400px-wide slices for small wall thumbnails. */
  small: { top: paperTopSm, mid: paperMidSm, bottom: paperBottomSm },
  tape,
  wall: { portrait: wall1350, story: wall1920 },
  foreground: { portrait: foreground1350, story: foreground1920 },
} as const;
