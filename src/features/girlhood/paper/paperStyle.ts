/**
 * Deterministic, subtle per-note variation for taped paper notes.
 * Derived only from the opaque public reference so a note looks the same on
 * every reload and every device. Variation is deliberately small: one paper
 * look, with tiny changes in tilt, tape position and paper shade.
 */

/** FNV-1a 32-bit hash. */
export function hashReference(reference: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < reference.length; i++) {
    h ^= reference.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export interface NoteVariant {
  /** Paper rotation in degrees, within +/-2. */
  rotate: number;
  /** Tape horizontal offset from centre, in percent of paper width (+/-8). */
  tapeShift: number;
  /** Tape rotation in degrees, within +/-3. */
  tapeTilt: number;
  /** Paper shade step: 0 (lightest) to 2. */
  tone: 0 | 1 | 2;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function noteVariant(reference: string): NoteVariant {
  // Mix the hash once more so short, similar references still diverge.
  let h = hashReference(reference);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b) >>> 0;
  const unit = (shift: number) => ((h >>> shift) & 0xff) / 255;
  return {
    rotate: round1(unit(0) * 4 - 2),
    tapeShift: round1(unit(8) * 16 - 8),
    tapeTilt: round1(unit(16) * 6 - 3),
    tone: Math.min(2, Math.floor(unit(24) * 3)) as 0 | 1 | 2,
  };
}

/** Fixed neutral variant for full-size notes, previews and exports. */
export const NEUTRAL_VARIANT: NoteVariant = {
  rotate: 0,
  tapeShift: 0,
  tapeTilt: -1.2,
  tone: 1,
};
