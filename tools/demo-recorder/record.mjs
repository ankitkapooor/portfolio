/**
 * Records the homepage demo clips: a scripted walkthrough of each live
 * product with a visible cursor, saved as <slug>.webm (VP8) plus a poster.
 *
 *   node tools/demo-recorder/record.mjs <out-dir> <slug> [<slug> ...]
 *
 * Run one slug per process (the recorder keeps per-run state). Copy the
 * resulting .webm files into apps/portfolio/public/work/. Needs Google Chrome
 * and the Playwright install under apps/disrupt-this-business.
 */
import { open, record, click, scroll, type, cut, dump, moveTo } from './lib.mjs';
const role = (p, r, name) => p.getByRole(r, { name });

/** Drags a range input's thumb from its current value to a fraction of its track. */
async function dragRange(p, locator, to, steps) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded();
  const from = await el.evaluate((i) => (i.value - (i.min || 0)) / ((i.max || 100) - (i.min || 0)));
  await drag(p, el, from, to, steps);
}

/** Drags a range input's thumb between two fractions of its width, visibly. */
async function drag(p, locator, from, to, steps) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  const y = box.y + box.height / 2;
  await moveTo(p, box.x + box.width * from, y, 500);
  await p.mouse.down();
  if (steps) {
    for (let i = 1; i <= steps; i++) {
      await p.mouse.move(box.x + box.width * (from + ((to - from) * i) / steps), y);
      await p.waitForTimeout(140);
    }
    await moveTo(p, box.x + box.width * to, y, 50);
  } else {
    await moveTo(p, box.x + box.width * to, y, 1100);
  }
  await p.mouse.up();
}
export const flows = {
  'market-entry-war-room': ['https://warroom.ankitkapoor.me/ui/', async p => {
    await p.waitForTimeout(700);
    await click(p, role(p, 'button', 'PREMIUM FITNESS'), { wait: 500 });
    await click(p, role(p, 'button', 'INTERPRET THE BUSINESS'));
    // The mission fields are prefilled, so wait out the parser call instead.
    await cut(p, () => p.waitForTimeout(3500));
    await click(p, role(p, 'button', 'RUN THE MODEL'));
    await cut(p, () => p.waitForFunction(() => /holds first/i.test(document.body.innerText), null, { timeout: 90000 }));
    await p.waitForTimeout(1800);
    // Move the Growth weight and watch the board re-rank.
    // Few input events: every one re-ranks 393 metros.
    await dragRange(p, p.getByLabel('Growth'), 0.62, 6);
    await p.waitForTimeout(900);
    await scroll(p, 520, 1200);
    await p.waitForTimeout(900);
    await click(p, p.getByRole('button', { name: /Stress test/ }), { wait: 700 });
    await click(p, role(p, 'button', 'RUN THE SIMULATION'));
    await cut(p, () => p.waitForTimeout(3500));
    await p.waitForTimeout(800);
    await scroll(p, 520, 1500);
    await p.waitForTimeout(1600);
  }],
  'disrupt-this-business': ['https://disrupt.ankitkapoor.me/play', async p => {
    await scroll(p, 350, 900);
    await click(p, p.locator('label', { hasText: 'INCUMBENT' }), { wait: 500 });
    await scroll(p, 500, 1000);
    await click(p, role(p, 'button', 'Start quarter one'), { wait: 1500 });
    await scroll(p, 400, 1200);
    await p.waitForTimeout(1500);
  }],
  'the-moat-test': ['https://moat.ankitkapoor.me/lab/meeting-assistants', async p => {
    await scroll(p, 450, 1000);
    await click(p, p.getByRole('button', { name: /Storage vendor renewal/ }), { wait: 600 });
    await click(p, role(p, 'button', 'Run the baseline on this text'), { wait: 1200 });
    await scroll(p, 700, 1600);
    await p.waitForTimeout(1500);
  }],
  'narrative-vs-numbers': ['https://narrative.ankitkapoor.me', async p => {
    await click(p, role(p, 'button', 'Reconcile'));
    await cut(p, () => p.waitForSelector('text=Claims on the docket', { timeout: 60000 }));
    await p.waitForTimeout(1500);
    await scroll(p, 600, 1600);
    await p.waitForTimeout(1500);
  }],
  'priced-in': ['https://priced.ankitkapoor.me', async p => {
    await click(p, role(p, 'link', 'Explore the sample company'));
    await cut(p, () => p.waitForLoadState('networkidle'));
    await p.waitForTimeout(800);
    await click(p, role(p, 'button', 'Solve for growth'), { wait: 1200 });
    await scroll(p, 600, 1600);
    await p.waitForTimeout(1500);
  }],
  'orthocode-ai': ['https://orthocode.ankitkapoor.me/app', async p => {
    await p.waitForTimeout(800);
    await click(p, p.getByRole('link', { name: 'Open ORTHO-SYN-004' }));
    await cut(p, () => p.waitForLoadState('networkidle'));
    await p.waitForTimeout(1500);
    await scroll(p, 600, 1600);
    await p.waitForTimeout(1500);
  }],
  'flycast': ['https://flycast.ankitkapoor.me/experiment?demo=lorenz', async p => {
    await scroll(p, 250, 800);
    await click(p, p.getByRole('button', { name: /Chaotic Lorenz System/ }), { wait: 800 });
    await p.waitForTimeout(1500);
    await scroll(p, 500, 1400);
    await p.waitForTimeout(2000);
  }],
  'catalog-underwriter': ['https://catalog.ankitkapoor.me', async p => {
    await click(p, role(p, 'button', 'Kendrick Lamar demo'));
    await cut(p, () => p.getByRole('button', { name: /^Bear/ }).first().waitFor({ timeout: 30000 }));
    await p.waitForTimeout(800);
    await click(p, p.getByRole('button', { name: /^Bear/ }), { wait: 900 });
    await click(p, p.getByRole('button', { name: /^Bull/ }), { wait: 900 });
    await click(p, p.getByRole('tab', { name: 'Stress test' }), { wait: 1200 });
    await scroll(p, 400, 1200);
    await p.waitForTimeout(1200);
  }],
  'valuelens': ['https://valuelens.ankitkapoor.me', async p => {
    await click(p, role(p, 'button', 'NVDA NVIDIA'));
    await cut(p, () => p.waitForFunction(() => /price implies/.test(document.body.innerText), null, { timeout: 60000 }).then(() => p.waitForTimeout(2500)));
    await p.waitForTimeout(1500);
    await scroll(p, 500, 1400);
    await click(p, role(p, 'button', 'Forecast'), { wait: 1500 });
    await p.waitForTimeout(1200);
  }],
  'bill-buster': ['https://billbuster.ankitkapoor.me', async p => {
    await p.getByRole('button', { name: /Try the sample bill/ }).first().waitFor({ timeout: 30000 });
    await p.waitForTimeout(600);
    await click(p, p.getByRole('button', { name: /Try the sample bill/ }));
    await cut(p, () => p.waitForTimeout(2500));
    await scroll(p, 700, 1600);
    await p.waitForTimeout(1200);
  }],
  'ideology-inventory': ['https://polskew.ankitkapoor.me', async p => {
    await p.waitForTimeout(600);
    await moveTo(p, 640, 420, 700);
    await scroll(p, 750, 1800);
    await p.waitForTimeout(900);
    await scroll(p, 800, 1800);
    await p.waitForTimeout(900);
    await scroll(p, 800, 1800);
    await p.waitForTimeout(1200);
  }],
  'exception-engine': ['https://exceptionengine.ankitkapoor.me', async p => {
    await p.waitForTimeout(900);
    await click(p, role(p, 'link', 'Board the laboratory'));
    await p.waitForTimeout(1400);
    await drag(p, p.locator('input[type=range]').first(), 0.4, 0.1);
    await p.waitForTimeout(900);
    await click(p, role(p, 'button', 'Change one fact'), { wait: 1400 });
    await click(p, p.getByRole('tab', { name: /Decision surface/ }), { wait: 1800 });
    await scroll(p, 300, 1000);
    await p.waitForTimeout(1200);
  }],
  'escalation-frontier': ['https://escalation.ankitkapoor.me', async p => {
    await p.waitForTimeout(1200);
    await click(p, role(p, 'link', 'Explore the frontier'));
    await p.waitForTimeout(1600);
    const slider = p.locator('#threshold');
    await drag(p, slider, 0.78, 0.45);
    await p.waitForTimeout(700);
    await drag(p, slider, 0.45, 0.96);
    await p.waitForTimeout(1500);
  }],
  'wordle-solver': ['https://wordle.ankitkapoor.me', async p => {
    await p.waitForTimeout(600);
    for (const letter of 'arose') await click(p, `button[data-key="${letter}"]`, { wait: 120 });
    await click(p, p.getByRole('button', { name: /Letter 2,/ }), { wait: 250 });
    await click(p, p.getByRole('button', { name: /Letter 5,/ }), { wait: 250 });
    await click(p, p.getByRole('button', { name: /Letter 5,/ }), { wait: 250 });
    await click(p, role(p, 'button', 'Submit guess'), { wait: 1600 });
    await p.waitForTimeout(1200);
  }],
};

const out = process.argv[2];
const which = process.argv.slice(3);
await Promise.all(which.map(async slug => {
  const [url, script] = flows[slug];
  const { browser, page } = await open(url);
  try {
    const r = await record(page, script, `${out}/${slug}`);
    const tail = await dump(page, `${out}/${slug}.end.png`);
    console.log(`== ${slug}: ${r.seconds}s (${r.frames} frames) ${page.url()}\n${tail.split('\n').slice(0, 30).join('\n')}`);
  } catch (e) { console.log(`== ${slug}: ERR ${e.message.split('\n')[0]}`); await dump(page, `${out}/${slug}.err.png`); }
  await browser.close();
}));
