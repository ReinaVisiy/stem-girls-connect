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

export type LayoutLine = { text: string; y: number; heading: boolean };
export function paginate(sections: { prompt: string; answer: string }[], width: number, height: number, measure: Measurer, measureHeading: Measurer) {
  const pages: LayoutLine[][] = [[]];
  let y = 285;
  const add = (text: string, heading: boolean) => {
    const step = heading ? 48 : 43;
    if (y + step > height - 260) { pages.push([]); y = 285; }
    pages[pages.length - 1].push({ text, y, heading }); y += step;
  };
  for (const section of sections) {
    if (!section.answer) continue;
    const headings = wrapText(section.prompt, width, measureHeading);
    if (y + headings.length * 48 + 43 > height - 260) { pages.push([]); y = 285; }
    headings.forEach(line => add(line.text, true));
    wrapText(section.answer, width, measure).forEach(line => add(line.text, false));
    y += 35;
  }
  return pages;
}
