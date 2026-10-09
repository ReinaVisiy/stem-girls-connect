#!/usr/bin/env node
/**
 * Design-time generator for the "Girlhood Should Be Hers" paper system.
 *
 * Produces ORIGINAL, procedurally generated, text-free assets (no logo, no
 * words, no third-party imagery), so there is nothing to license:
 *   paper-{top,mid,bottom}.webp      deckled ivory paper, 3 slices (1000px wide)
 *   paper-{top,mid,bottom}-sm.webp   same slices at 400px wide (wall thumbnails)
 *   tape.png                         small translucent masking-tape strip
 *   wall-1350.webp / wall-1920.webp  warm wall, soft light, blurred flowers
 *   foreground-1350.webp / foreground-1920.webp  transparent soft corner blooms
 *
 * Run (sharp is a design-time tool and is intentionally NOT a dependency):
 *   npm install --no-save sharp && node scripts/generate-girlhood-assets.mjs
 * Output is deterministic (seeded) and written to
 * src/features/girlhood/assets/.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const out = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../src/features/girlhood/assets",
);
await mkdir(out, { recursive: true });

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => n.toFixed(1);

/* ------------------------------------------------------------------ paper */
// Master sheet: 160px top slice + 1520px repeatable middle + 160px bottom.
const PW = 1000,
  TOP = 160,
  MID = 1520,
  BOT = 160,
  PH = TOP + MID + BOT,
  M = 22;

function paperPath() {
  const r = rng(11);
  // Side deckle is periodic along y (period MID) so the middle slice can repeat.
  const fine = Array.from({ length: MID / 4 }, () => r());
  const coarse = Array.from({ length: MID / 20 }, () => r());
  const periodic = (arr, t, step) => {
    const i = t / step,
      i0 = Math.floor(i) % arr.length,
      i1 = (i0 + 1) % arr.length,
      u = i - Math.floor(i);
    return arr[i0] * (1 - u) + arr[i1] * u;
  };
  const side = (y, flip) => {
    const t = (((y - TOP + (flip ? 377 : 0)) % MID) + MID) % MID;
    return (
      2.2 +
      4.2 * periodic(coarse, t, 20) +
      3.6 * periodic(fine, t, 4) ** 1.6 +
      (periodic(fine, t + 40, 4) > 0.93 ? 4 : 0)
    );
  };
  const fx = Array.from({ length: PW / 4 + 2 }, () => r());
  const cx = Array.from({ length: PW / 20 + 2 }, () => r());
  const fy = Array.from({ length: PW / 4 + 2 }, () => r());
  const cy = Array.from({ length: PW / 20 + 2 }, () => r());
  const lin = (arr, x, step) => {
    const i = x / step,
      i0 = Math.floor(i),
      u = i - i0;
    return arr[i0] * (1 - u) + arr[i0 + 1] * u;
  };
  const top = (x) => 2.2 + 4.2 * lin(cx, x, 20) + 3.6 * lin(fx, x, 4) ** 1.6 + (lin(fx, x + 40, 4) > 0.93 ? 4 : 0);
  const bottom = (x) => 2.2 + 4.2 * lin(cy, x, 20) + 3.6 * lin(fy, x, 4) ** 1.6 + (lin(fy, x + 40, 4) > 0.93 ? 4 : 0);
  const pts = [];
  for (let x = M; x <= PW - M; x += 3) pts.push([x, M + top(x)]);
  for (let y = M; y <= PH - M; y += 3) pts.push([PW - M - side(y, true), y]);
  for (let x = PW - M; x >= M; x -= 3) pts.push([x, PH - M - bottom(x)]);
  for (let y = PH - M; y >= M; y -= 3) pts.push([M + side(y, false), y]);
  return "M" + pts.map((p) => f(p[0]) + " " + f(p[1])).join("L") + "Z";
}

function paperSvg() {
  const d = paperPath();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">
<defs>
<clipPath id="p"><path d="${d}"/></clipPath>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
 <stop offset="0" stop-color="#fbf5e6"/><stop offset=".6" stop-color="#f6ecd8"/><stop offset="1" stop-color="#eee2c9"/>
</linearGradient>
<filter id="fib" x="0" y="0" width="100%" height="100%">
 <feTurbulence type="fractalNoise" baseFrequency="1.1 .9" numOctaves="3" seed="4"/>
 <feColorMatrix values="0 0 0 0 .42  0 0 0 0 .33  0 0 0 0 .2  0 0 0 -1.6 .95"/>
</filter>
<filter id="mot" x="0" y="0" width="100%" height="100%">
 <feTurbulence type="fractalNoise" baseFrequency=".005 0" numOctaves="2" seed="9"/>
 <feColorMatrix values="0 0 0 0 .62  0 0 0 0 .5  0 0 0 0 .3  0 0 0 -.9 .52"/>
</filter>
<filter id="b1"><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="wisp" x="-5%" y="-5%" width="110%" height="110%">
 <feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="6" result="t"/>
 <feDisplacementMap in="SourceGraphic" in2="t" scale="9" xChannelSelector="R" yChannelSelector="G"/>
 <feGaussianBlur stdDeviation="1.1"/>
</filter>
<filter id="b2"><feGaussianBlur stdDeviation="11"/></filter>
</defs>
<g clip-path="url(#p)">
 <path d="${d}" fill="url(#g)"/>
 <rect width="${PW}" height="${PH}" filter="url(#mot)" opacity=".2"/>
 <rect width="${PW}" height="${PH}" filter="url(#fib)" opacity=".34"/>
 <path d="${d}" fill="none" stroke="#bda57a" stroke-width="26" filter="url(#b2)" opacity=".22"/>
 <path d="${d}" fill="none" stroke="#fffdf4" stroke-width="15" filter="url(#wisp)" opacity=".9"/>
 <path d="${d}" fill="none" stroke="#fffdf4" stroke-width="4" filter="url(#b1)" opacity=".8"/>
</g>
</svg>`;
}

/* ------------------------------------------------------------------- tape */
function tapeSvg() {
  const r = rng(5);
  const W = 300,
    H = 86;
  const zig = (x, dir) => {
    const pts = [];
    for (let y = 6; y <= H - 6; y += 6) pts.push([x + dir * (r() * 4 - 2), y]);
    return pts;
  };
  const left = zig(8, 1),
    right = zig(W - 8, -1);
  const d =
    "M" +
    [[8, 6], [W - 8, 6], ...right, [W - 8, H - 6], [8, H - 6], ...left.reverse()]
      .map((p) => f(p[0]) + " " + f(p[1]))
      .join("L") +
    "Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<clipPath id="t"><path d="${d}"/></clipPath>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".6 .12" numOctaves="3" seed="2"/>
 <feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .3  0 0 0 -1.4 .85"/></filter>
</defs>
<g clip-path="url(#t)">
 <path d="${d}" fill="#e6d6b4" fill-opacity=".82"/>
 <rect width="${W}" height="${H}" filter="url(#n)" opacity=".35"/>
 <rect width="${W}" height="${H}" fill="#fff" opacity=".12"/>
 <path d="M8 6H${W - 8}" stroke="#fffaf0" stroke-width="3" opacity=".5"/>
</g>
</svg>`;
}

/* ------------------------------------------------------------- wall/flora */
function blob(x, y, rx, ry, fill, op, rot = 0, blur = 4) {
  return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" opacity="${op}" transform="rotate(${f(rot)} ${f(x)} ${f(y)})" filter="url(#bl${blur})"/>`;
}
function cluster(r, cx, cy, spread, n, colors, rr, op, blur, squash = 1) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283,
      d = Math.sqrt(r()) * spread;
    const rad = rr[0] + r() * (rr[1] - rr[0]);
    s += blob(
      cx + Math.cos(a) * d,
      cy + Math.sin(a) * d * squash,
      rad,
      rad * (0.7 + r() * 0.5),
      colors[Math.floor(r() * colors.length)],
      op,
      r() * 180,
      blur,
    );
  }
  return s;
}
const blurDefs = `<filter id="bl3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
<filter id="bl6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="bl12" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="12"/></filter>
<filter id="bl24" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="24"/></filter>`;
const PURPLE = ["#a579b4", "#b88fc6", "#8f5fa3", "#c9a6d3"],
  WHITE = ["#fff8ec", "#fbefdc", "#fffdf6"],
  GREEN = ["#7f8f6d", "#93a07f", "#6e7f5d"],
  PINK = ["#c9a0cf", "#d8b7de", "#b787c2"];

function flora(r, W, H, foreground) {
  const k = foreground ? 1.5 : 1;
  let s = "";
  // top-left: airy white blossoms and soft stems
  s += cluster(r, W * 0.07, H * 0.045, W * 0.17, 38, WHITE, [6 * k, 14 * k], 0.8, 6);
  s += cluster(r, W * 0.1, H * 0.06, W * 0.2, 6, ["#d9c8a1"], [30, 55], 0.35, 24);
  // left-middle: lavender spray
  s += cluster(r, W * 0.015, H * 0.37, W * 0.09, 34, PURPLE, [8 * k, 17 * k], 0.7, 6, 2.6);
  s += cluster(r, W * 0.0, H * 0.4, W * 0.1, 5, PINK, [28, 50], 0.35, 24, 2);
  // bottom-left: eucalyptus leaves
  s += cluster(r, W * 0.04, H * 0.96, W * 0.12, 10, GREEN, [30 * k, 52 * k], 0.7, 6);
  s += cluster(r, W * 0.1, H * 0.995, W * 0.12, 5, ["#d8c5a2"], [40, 70], 0.5, 24);
  // right-middle: little white blossoms
  s += cluster(r, W * 0.995, H * 0.52, W * 0.07, 18, WHITE, [6 * k, 12 * k], 0.75, 6, 2.4);
  // top-right: eucalyptus + linen
  s += cluster(r, W * 0.97, H * 0.012, W * 0.1, 7, GREEN, [26 * k, 46 * k], 0.65, 6);
  // bottom-right: large soft lilac blooms
  s += cluster(r, W * 0.9, H * 0.99, W * 0.15, 12, PINK, [22 * k, 46 * k], 0.62, 12);
  s += cluster(r, W * 0.96, H * 0.87, W * 0.06, 12, WHITE, [6 * k, 12 * k], 0.75, 6, 2);
  return s;
}

function leaves(r, x, y, ang, n, len, fill, op, blur) {
  let g = "";
  for (let i = 0; i < n; i++) {
    const t = i / n,
      px = x + Math.cos(ang) * len * t * 4,
      py = y + Math.sin(ang) * len * t * 4,
      side = i % 2 ? 1 : -1,
      la = (ang * 180) / Math.PI + side * (38 + r() * 18),
      sz = 1 - t * 0.45;
    g += blob(px, py, 44 * sz * (0.8 + r() * 0.4), 15 * sz, fill, op, la, blur);
  }
  return g;
}

function overlayLeaves(r, W, H) {
  const sh = "#6b5638";
  return `<g>${leaves(r, W * 0.1, H * 0.2, 1.05, 9, 46, sh, 0.1, 6)}${leaves(r, W * 0.04, H * 0.62, 0.5, 8, 44, sh, 0.09, 6)}${leaves(r, W * 0.2, H * 0.84, -0.7, 8, 42, sh, 0.09, 6)}</g>
<g>${leaves(r, W * 0.97, H * 0.12, 2.5, 8, 38, "#b48bc2", 0.2, 3)}${leaves(r, W * 0.98, H * 0.3, 2.1, 6, 34, "#b48bc2", 0.16, 3)}</g>`;
}

function wallSvg(W, H, seed, foreground) {
  const r = rng(seed);
  const shadows = foreground
    ? ""
    : `<g filter="url(#bl12)">${Array.from({ length: 11 }, (_, i) =>
        blob(
          W * (0.04 + r() * 0.34),
          H * (0.02 + i * 0.075 + r() * 0.04),
          46 + r() * 52,
          16 + r() * 18,
          "#8a6d4b",
          0.11,
          -35 + r() * 20,
          3,
        ),
      ).join("")}</g>`;
  const base = foreground
    ? ""
    : `<rect width="${W}" height="${H}" fill="url(#wg)"/>
<rect width="${W}" height="${H}" fill="url(#sun)"/>
<rect width="${W}" height="${H}" filter="url(#pl)" opacity=".12"/>
<path d="M${W} 0 L${W * 0.68} 0 Q${W * 0.9} ${H * 0.05} ${W} ${H * 0.115}Z" fill="#efe3cf" opacity=".9" filter="url(#bl6)"/>
<path d="M${W} 0 L${W * 0.68} 0 Q${W * 0.9} ${H * 0.05} ${W} ${H * 0.115}Z" fill="none" stroke="#cdb892" stroke-width="2" opacity=".4" filter="url(#bl3)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>${blurDefs}
<linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e6cf"/><stop offset="1" stop-color="#e3cfb0"/></linearGradient>
<radialGradient id="sun" cx=".12" cy=".06" r=".95"><stop offset="0" stop-color="#fffaf0" stop-opacity=".7"/><stop offset=".6" stop-color="#fffaf0" stop-opacity=".12"/><stop offset="1" stop-color="#fffaf0" stop-opacity="0"/></radialGradient>
<filter id="pl" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="${seed}"/>
 <feColorMatrix values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .24  0 0 0 -1.3 .8"/></filter>
</defs>
${base}${shadows}${foreground ? overlayLeaves(r, W, H) : ""}${flora(r, W, H, foreground)}
</svg>`;
}

/* ------------------------------------------------------------------ build */
const sizes = {};
async function emit(name, svg, opts) {
  let img = sharp(Buffer.from(svg));
  const file = resolve(out, name);
  if (opts.png) await img.png({ compressionLevel: 9 }).toFile(file);
  else
    await img
      .webp({ quality: opts.q ?? 82, alphaQuality: 90, effort: 6 })
      .toFile(file);
  sizes[name] = (await sharp(file).metadata()).size;
}

const paperPng = await sharp(Buffer.from(paperSvg())).png().toBuffer();
const slices = {
  top: { left: 0, top: 0, width: PW, height: TOP },
  mid: { left: 0, top: TOP, width: PW, height: MID },
  bottom: { left: 0, top: TOP + MID, width: PW, height: BOT },
};
for (const [n, region] of Object.entries(slices)) {
  const piece = sharp(paperPng).extract(region);
  await piece.clone().webp({ quality: 84, alphaQuality: 92, effort: 6 }).toFile(resolve(out, `paper-${n}.webp`));
  await piece
    .clone()
    .resize({ width: 400 })
    .webp({ quality: 80, alphaQuality: 90, effort: 6 })
    .toFile(resolve(out, `paper-${n}-sm.webp`));
}
await emit("tape.png", tapeSvg(), { png: true });
for (const H of [1350, 1920]) {
  await emit(`wall-${H}.webp`, wallSvg(1080, H, 21, false), { q: 80 });
  await emit(`foreground-${H}.webp`, wallSvg(1080, H, 33, true), { q: 80 });
}
await writeFile(
  resolve(out, "PROCEDURAL-ASSETS.md"),
  `# Girlhood paper assets

Generated by \`scripts/generate-girlhood-assets.mjs\` (deterministic, seeded).
All images are original procedural artwork created for STEM Girls Connect:
no third-party images, no text, no logo, nothing to license.

Participant words are always drawn as real text at runtime. The authentic logo
is \`public/logo.png\` and is drawn only into a participant's own PNG export.
`,
);
console.log(sizes);
