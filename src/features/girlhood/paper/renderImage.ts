import { paperAssets } from './paperAssets';
import { fitLayout, wrapText } from './textLayout';
import { copy } from '../config/copy';
import type { GirlhoodLanguage } from '../types';

export type PersonalWords = { answers: [string, string, string]; younger: boolean; ageKnown: boolean; name?: string };
export type RenderedPage = { url: string; file: File };
const load = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url;
});
export async function renderImages(words: PersonalWords, included: boolean[], signature: string, format: 'portrait' | 'story', language: GirlhoodLanguage): Promise<RenderedPage[]> {
  await document.fonts.load('500 34px "EB Garamond"');
  await document.fonts.load('600 58px "EB Garamond"');
  const [wall, top, mid, bottom, tape, logo] = await Promise.all([
    load(paperAssets.wall[format]), load(paperAssets.full.top), load(paperAssets.full.mid),
    load(paperAssets.full.bottom), load(paperAssets.tape), load('/logo.png'),
  ]);
  const height = format === 'story' ? 1920 : 1350;
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = height;
  const ctx = canvas.getContext('2d'); if (!ctx) throw new Error('Canvas unavailable');
  const font = (heading: boolean, size: number) => { ctx.font = `${heading ? 600 : 500} ${size}px "EB Garamond", Georgia, serif`; };
  const t = copy[language];
  const pages = fitLayout([t.q1, t.q2, t.q3].map((prompt, i) => ({prompt, answer: included[i] ? words.answers[i] : ''})), 760, height,
    (text, size, heading) => {font(heading, size); return ctx.measureText(text).width;});
  const output: RenderedPage[] = [];
  try {
    for (let p = 0; p < pages.length; p++) {
      ctx.clearRect(0, 0, 1080, height); ctx.drawImage(wall, 0, 0, 1080, height);
      ctx.save(); ctx.shadowColor = '#59422733'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#f6ecd8'; ctx.fillRect(78, 95, 924, height - 180); ctx.restore();
      ctx.drawImage(top, 60, 70, 960, 154);
      ctx.drawImage(mid, 60, 224, 960, height - 448);
      ctx.drawImage(bottom, 60, height - 224, 960, 154);
      ctx.drawImage(tape, 405, 38, 270, 77);
      ctx.fillStyle = '#123f2d'; ctx.textBaseline = 'top';
      ctx.font = '600 58px "EB Garamond", Georgia, serif';
      ctx.fillText('Girlhood Should Be Hers', 540 - ctx.measureText('Girlhood Should Be Hers').width / 2, 150);
      for (const line of pages[p]) {font(line.heading, line.size); ctx.fillText(line.text, 160, line.y);}
      if (p === pages.length - 1 && signature) {
        ctx.font = '500 32px "EB Garamond", Georgia, serif';
        const lines = wrapText(signature, 530, text => ctx.measureText(text).width);
        lines.forEach((line, i) => ctx.fillText(line.text, 160, height - 120 - (lines.length - i) * 34));
      }
      const logoWidth = 140, logoHeight = logoWidth * logo.height / logo.width;
      ctx.drawImage(logo, 800, height - 105 - logoHeight, logoWidth, logoHeight);
      if (pages.length > 1) {ctx.font = '500 24px "EB Garamond", Georgia, serif'; ctx.fillText(`${p + 1} / ${pages.length}`, 510, height - 115);}
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG failed')), 'image/png'));
      output.push({url: URL.createObjectURL(blob), file: new File([blob], `girlhood-${format}-${p + 1}.png`, {type:'image/png'})});
    }
    return output;
  } catch (error) {output.forEach(p => URL.revokeObjectURL(p.url)); throw error;}
}
