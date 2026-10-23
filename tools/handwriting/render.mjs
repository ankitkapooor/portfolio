// Renders each phrase in the font on a canvas (browser shaping, so kerning
// matches what visitors see) and saves a PNG plus layout metrics.
import { chromium } from '/Users/ankitkapoor/Python/Portfolio/apps/disrupt-this-business/node_modules/@playwright/test/index.mjs';
import { readFileSync, writeFileSync } from 'node:fs';
const [font, phrasesFile, out] = process.argv.slice(2);
const phrases = JSON.parse(readFileSync(phrasesFile, 'utf8'));
const F = 320, ASC = 0.85, DESC = 0.32, PAD = 40;
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage();
await p.setContent(`<style>@font-face{font-family:AH;src:url(data:font/ttf;base64,${readFileSync(font).toString('base64')})}</style><canvas id=c></canvas>`);
await p.evaluate(F => document.fonts.load(`${F}px AH`), F);
const meta = {};
for (const [i, text] of phrases.entries()) {
  const r = await p.evaluate(({ text, F, ASC, DESC, PAD }) => {
    const c = document.getElementById('c'), x = c.getContext('2d');
    x.font = `${F}px AH`;
    const w = x.measureText(text).width;
    c.width = Math.ceil(w + PAD * 2); c.height = Math.ceil((ASC + DESC) * F + PAD * 2);
    x.font = `${F}px AH`; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#000'; x.textBaseline = 'alphabetic'; x.fontKerning = 'normal';
    x.fillText(text, PAD, PAD + ASC * F);
    return { w, png: c.toDataURL('image/png') };
  }, { text, F, ASC, DESC, PAD });
  writeFileSync(`${out}/${i}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
  meta[text] = { file: `${i}.png`, advance: r.w, F, pad: PAD, baseline: PAD + ASC * F, top: PAD };
}
writeFileSync(`${out}/meta.json`, JSON.stringify(meta, null, 1));
console.log('rendered', phrases.length);
await b.close();
