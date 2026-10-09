export type Measurer = (text: string) => number;
export type TextLine = { text: string; paragraphEnd: boolean };

/** No trimming: concatenating text and paragraph boundaries recovers the input. */
export function wrapText(text: string, width: number, measure: Measurer): TextLine[] {
  const segmenter = typeof Intl.Segmenter === 'function'
    ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  return text.replace(/\r\n?/g, '\n').split('\n').flatMap((paragraph, index, paragraphs) => {
    const glyphs = segmenter ? Array.from(segmenter.segment(paragraph), s => s.segment) : Array.from(paragraph);
    const lines: TextLine[] = [];
    let current = '';
    for (const glyph of glyphs) {
      if (current && measure(current + glyph) > width) {
        // Prefer word boundaries but retain every space and grapheme.
        const space = current.lastIndexOf(' ');
        if (space > 0) {
          lines.push({ text: current.slice(0, space + 1), paragraphEnd: false });
          current = current.slice(space + 1);
        } else { lines.push({ text: current, paragraphEnd: false }); current = ''; }
      }
      current += glyph;
    }
    lines.push({ text: current, paragraphEnd: index < paragraphs.length - 1 });
    return lines;
  });
}

export type LayoutLine = { text: string; y: number; heading: boolean; size: number };
export type PageMetrics = { body: number; head: number; bodyStep: number; headStep: number; gap: number };
export const defaultMetrics: PageMetrics = { body: 34, head: 38, bodyStep: 43, headStep: 48, gap: 35 };
const TOP = 285, BOTTOM = 260;

/** Line metrics for a given answer font size; prompts are a little smaller than answers. */
export function metricsFor(body: number): PageMetrics {
  const head = Math.round(body * 0.74);
  return { body, head, bodyStep: Math.round(body * 1.3), headStep: Math.round(head * 1.45), gap: Math.round(body * 0.9) };
}

export function paginate(sections: { prompt: string; answer: string }[], width: number, height: number, measure: Measurer, measureHeading: Measurer, m: PageMetrics = defaultMetrics) {
  const pages: LayoutLine[][] = [[]];
  let y = TOP;
  const add = (text: string, heading: boolean) => {
    const step = heading ? m.headStep : m.bodyStep;
    if (y + step > height - BOTTOM) { pages.push([]); y = TOP; }
    pages[pages.length - 1].push({ text, y, heading, size: heading ? m.head : m.body }); y += step;
  };
  for (const section of sections) {
    if (!section.answer) continue;
    const headings = wrapText(section.prompt, width, measureHeading);
    if (y + headings.length * m.headStep + m.bodyStep > height - BOTTOM) { pages.push([]); y = TOP; }
    headings.forEach(line => add(line.text, true));
    wrapText(section.answer, width, measure).forEach(line => add(line.text, false));
    y += m.gap;
  }
  return pages;
}

/**
 * Picks the largest answer size that keeps everything on one sheet, so short notes fill the paper
 * and the block is centred. Longer notes use the smallest legible size and continue on more sheets.
 * Text is never trimmed.
 */
export function fitLayout(sections: { prompt: string; answer: string }[], width: number, height: number, measureAt: (text: string, size: number, heading: boolean) => number, maxBody = 62, minBody = 30) {
  const run = (body: number) => {
    const m = metricsFor(body);
    return paginate(sections, width, height, s => measureAt(s, m.body, false), s => measureAt(s, m.head, true), m);
  };
  let pages = run(minBody);
  if (pages.length === 1) {
    for (let body = maxBody; body > minBody; body -= 2) {
      const attempt = run(body);
      if (attempt.length === 1) { pages = attempt; break; }
    }
  }
  if (pages.length === 1 && pages[0].length) {
    const lines = pages[0];
    const last = lines[lines.length - 1];
    const extent = last.y + (last.heading ? metricsFor(last.size / 0.74).headStep : Math.round(last.size * 1.3)) - lines[0].y;
    const shift = Math.max(0, Math.floor((height - BOTTOM - TOP - extent) / 2));
    pages = [lines.map(l => ({ ...l, y: l.y + shift }))];
  }
  return pages;
}
