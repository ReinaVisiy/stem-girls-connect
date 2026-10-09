import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrapText, paginate } from '../../src/features/girlhood/paper/textLayout';

test('wrapping preserves spaces, blank lines, accents, emoji and long tokens', () => {
  for (const input of ['Free', '  rêve  libre\n\n👩🏽‍🔬 ensemble\n', 'x'.repeat(2000), 'école '.repeat(330)]) {
    const lines = wrapText(input, 17, s => Array.from(s).length);
    assert.equal(lines.map(l => l.text + (l.paragraphEnd ? '\n' : '')).join(''), input);
    assert.ok(lines.every(l => Array.from(l.text).length <= 17));
  }
});
test('three maximum-length answers continue across sheets without dropped characters', () => {
  const sections = ['a', 'b', 'c'].map((c,i) => ({prompt: `Prompt ${i}`, answer: c.repeat(2000)}));
  for (const height of [1350, 1920]) {
    const pages = paginate(sections, 760, height, s => s.length * 20, s => s.length * 22);
    assert.ok(pages.length > 1);
    assert.equal(pages.flat().filter(l => !l.heading).map(l => l.text).join(''), sections.map(s => s.answer).join(''));
    assert.ok(pages.flat().every(l => l.y >= 285 && l.y + (l.heading ? 48 : 43) <= height - 260));
  }
});

test('short notes use a large size on one centred sheet; long notes shrink then continue', async () => {
  const { fitLayout } = await import('../../src/features/girlhood/paper/textLayout');
  const measureAt = (s: string, size: number) => s.length * size * 0.5;
  const short = [{prompt: 'Girlhood should be...', answer: 'Freedom'}, {prompt: 'Free to become...', answer: 'Anything she dreams'}, {prompt: 'What would help?', answer: 'Mentorship'}];
  for (const height of [1350, 1920]) {
    const one = fitLayout(short, 760, height, measureAt);
    assert.equal(one.length, 1);
    assert.ok(Math.max(...one[0].map(l => l.size)) > 40, 'short answers should be large');
    assert.ok(one[0][0].y > 285, 'content block is centred, not pinned to the top');
    assert.ok(one[0].every(l => l.y >= 285 && l.y < height - 260));
    const long = ['a', 'b', 'c'].map((c, i) => ({prompt: `Prompt ${i}`, answer: c.repeat(2000)}));
    const many = fitLayout(long, 760, height, measureAt);
    assert.ok(many.length > 1);
    assert.equal(many.flat().filter(l => !l.heading).map(l => l.text).join(''), long.map(s => s.answer).join(''));
    assert.ok(many.flat().every(l => l.size >= 22));
  }
});
