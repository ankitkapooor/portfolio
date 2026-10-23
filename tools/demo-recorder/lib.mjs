import { chromium } from '/Users/ankitkapoor/Python/Portfolio/apps/disrupt-this-business/node_modules/@playwright/test/index.mjs';
import { mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';

export const W = 1280, H = 800;
// Playwright ships a minimal ffmpeg (VP8 + image2pipe); no system install needed.
const FFMPEG = process.env.FFMPEG ?? `${homedir()}/Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac`;

// A visible cursor with a click ripple, so the clip reads as a product demo.
const CURSOR = `
(() => {
  if (window.__demoCursor) return; window.__demoCursor = true;
  const add = () => {
    const c = document.createElement('div');
    c.id = '__cursor';
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l16 9.5-7 1.6L9.6 20z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(c.style, {position:'fixed',left:'0',top:'0',zIndex:2147483647,pointerEvents:'none',transform:'translate(-200px,-200px)',filter:'drop-shadow(0 2px 4px rgba(0,0,0,.35))'});
    document.documentElement.appendChild(c);
    addEventListener('mousemove', e => { c.style.transform = 'translate(' + (e.clientX-3) + 'px,' + (e.clientY-2) + 'px)'; }, true);
    addEventListener('mousedown', e => {
      const r = document.createElement('div');
      Object.assign(r.style, {position:'fixed',left:(e.clientX-18)+'px',top:(e.clientY-18)+'px',width:'36px',height:'36px',borderRadius:'50%',border:'2px solid rgba(255,140,60,.9)',zIndex:2147483646,pointerEvents:'none',transition:'transform .5s ease-out, opacity .5s ease-out'});
      document.documentElement.appendChild(r);
      requestAnimationFrame(() => { r.style.transform = 'scale(1.8)'; r.style.opacity = '0'; });
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.documentElement) add(); else addEventListener('DOMContentLoaded', add);
})();`;

export async function open(url, { theme } = {}) {
  const browser = await chromium.launch({ channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: theme ?? 'light' });
  await context.addInitScript(CURSOR);
  const page = await context.newPage();
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }); } catch {}
  await page.waitForTimeout(800);
  await page.mouse.move(W * 0.6, H * 0.55);
  return { browser, page };
}

let pos = { x: W * 0.6, y: H * 0.55 };
const cuts = [];
/** Drop everything recorded while `fn` runs (e.g. waiting on a network call). */
export async function cut(page, fn) {
  const a = Date.now() / 1000; await fn(); await page.waitForTimeout(200); cuts.push([a, Date.now() / 1000]);
}
export async function moveTo(page, x, y, ms = 600) {
  const steps = Math.max(8, Math.round(ms / 16));
  const from = { ...pos };
  for (let i = 1; i <= steps; i++) {
    const t = i / steps, e = t < .5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await page.waitForTimeout(ms / steps);
  }
  pos = { x, y };
}

export async function click(page, locator, { wait = 600 } = {}) {
  const all = typeof locator === 'string' ? page.locator(locator) : locator;
  await all.first().waitFor({ state: 'attached', timeout: 30000 });
  let el = all.first();
  for (const candidate of await all.all()) { if (await candidate.isVisible()) { el = candidate; break; } }
  await el.scrollIntoViewIfNeeded({ timeout: 15000 });
  const box = await el.boundingBox();
  await moveTo(page, box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(150);
  await page.mouse.down(); await page.waitForTimeout(60); await page.mouse.up();
  await page.waitForTimeout(wait);
}

export async function scroll(page, dy, ms = 1400) {
  const steps = Math.round(ms / 16);
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, dy / steps); await page.waitForTimeout(16); }
}

export async function type(page, text, delay = 70) { await page.keyboard.type(text, { delay }); }

/** Record `script(page)` via CDP screencast, then encode a constant-fps VP8 WebM + poster. */
export async function record(page, script, out, { fps = 24, scale = 960 } = {}) {
  const dir = `${out}.frames`; rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    frames.push({ t: metadata.timestamp, data });
    try { await cdp.send('Page.screencastFrameAck', { sessionId }); } catch {}
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  await page.waitForTimeout(300);
  await script(page);
  await page.waitForTimeout(400);
  await cdp.send('Page.stopScreencast');
  const t1 = Date.now() / 1000;
  if (!frames.length) throw new Error('no frames');
  // Resample to constant fps, holding the latest frame, then pipe to ffmpeg.
  const total = Math.ceil((t1 - t0) * fps);
  const picked = [];
  let fi = 0;
  for (let i = 0; i < total; i++) {
    const t = t0 + i / fps;
    if (cuts.some(([a, b]) => t > a && t < b)) continue;
    while (fi + 1 < frames.length && frames[fi + 1].t <= t) fi++;
    picked.push(Buffer.from(frames[fi].data, 'base64'));
  }
  const n = picked.length;
  execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', 'pipe:0',
    '-vf', `scale=${scale}:-2`, '-c:v', 'libvpx', '-b:v', '1400k', '-crf', '10', '-qmin', '4', '-qmax', '40',
    '-auto-alt-ref', '0', '-deadline', 'good', '-cpu-used', '1', '-an', `${out}.webm`], { input: Buffer.concat(picked), maxBuffer: 1 << 30 });
  writeFileSync(`${out}.first.jpg`, picked[0]);
  writeFileSync(`${out}.poster.jpg`, picked[Math.floor(n * 0.7)]);
  rmSync(dir, { recursive: true, force: true });
  cuts.length = 0;
  return { seconds: (n / fps).toFixed(1), frames: frames.length };
}

/** Explore helper: list visible controls and save a screenshot. */
export async function dump(page, path) {
  await page.screenshot({ path });
  return page.evaluate(() => [...document.querySelectorAll('button, a, input, select, textarea, [role=button], [role=radio], label')]
    .filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight * 3; })
    .slice(0, 60)
    .map(e => `${e.tagName.toLowerCase()}${e.type ? '['+e.type+']' : ''}${e.getAttribute('role') ? '{'+e.getAttribute('role')+'}' : ''} "${(e.innerText || e.value || e.placeholder || e.getAttribute('aria-label') || '').trim().replace(/\s+/g,' ').slice(0,50)}"`).join('\n'));
}
