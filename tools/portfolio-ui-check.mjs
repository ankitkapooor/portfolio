// Run against the production export: node tools/serve-static.mjs apps/portfolio/out 3100
// Then: node tools/portfolio-ui-check.mjs
// Uses the repository's existing Playwright dependency; no project apps are changed.
import { chromium, expect } from '../apps/disrupt-this-business/node_modules/@playwright/test/index.mjs';
import { mkdirSync } from 'node:fs';

const base = process.env.PORTFOLIO_URL || 'http://127.0.0.1:3100';
const output = process.env.PORTFOLIO_SCREENSHOTS || '/tmp/portfolio-ui-review';
const demos = {
  'market-entry-war-room': 'https://warroom.ankitkapoor.me/ui/',
  'disrupt-this-business': 'https://disrupt.ankitkapoor.me',
  'the-moat-test': 'https://moat.ankitkapoor.me',
  'narrative-vs-numbers': 'https://narrative.ankitkapoor.me',
  'priced-in': 'https://priced.ankitkapoor.me',
};
const routes = ['/', '/about', '/method', ...Object.keys(demos).map(slug => `/work/${slug}`)];
const errors = [];
mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
try {
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => {
    if (response.url().startsWith(base) && response.status() >= 400 && !response.url().endsWith('/not-a-project')) errors.push(`${response.status()} ${response.url()}`);
  });
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(base + route, { waitUntil: 'networkidle' });
      expect(response.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      const size = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      expect(size.scroll, `${route} horizontal overflow at ${width}px`).toBeLessThanOrEqual(size.client + 1);
      // Local links and in-page citations must resolve, including the contents rail.
      const brokenAnchors = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href').slice(1)).filter(id => id && !document.getElementById(decodeURIComponent(id))));
      expect(brokenAnchors, `${route} anchor targets`).toEqual([]);
      if (route.startsWith('/work/')) {
        const demo = demos[route.split('/').at(-1)];
        const launches = page.locator(`a[href="${demo}"]`);
        expect(await launches.count()).toBeGreaterThan(0);
        for (const link of await launches.all()) {
          await expect(link).toHaveAttribute('target', '_blank');
          await expect(link).toHaveAttribute('rel', /noopener/);
        }
        const alternative = page.getByText('What this figure shows, in words', { exact: true }).first();
        await alternative.click();
        await expect(alternative.locator('..')).toHaveAttribute('open', '');
      }
      if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/${route === '/' ? 'home' : route.replaceAll('/', '-')}-${width}.png`, fullPage: true });
    }
    console.log(`PASS all eight routes, anchors, previews, and demo destinations @ ${width}px`);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: 'networkidle' });
  const menu = page.getByRole('button', { name: /^(Menu|Close menu)$/ });
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL(base + '/about');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await menu.click();
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Work', exact: false }).click();
  await expect(page).toHaveURL(base + '/#work');
  const headingTop = await page.locator('#work').evaluate(el => el.getBoundingClientRect().top);
  expect(headingTop).toBeGreaterThanOrEqual(64);
  console.log('PASS mobile navigation, Escape focus restoration, cross-page work anchor');

  await page.goto(base, { waitUntil: 'networkidle' });
  const selectors = page.getByRole('button', { name: /^Explore / });
  await expect(selectors).toHaveCount(5);
  for (let i = 0; i < 5; i++) {
    await selectors.nth(i).focus();
    await page.keyboard.press('Enter');
    await expect(selectors.nth(i)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[aria-live="polite"] a')).toHaveAttribute('href', `/work/${Object.keys(demos)[i]}`);
  }
  await page.locator('[aria-live="polite"] a').click();
  await expect(page).toHaveURL(base + '/work/priced-in');
  console.log('PASS all five atlas selections by keyboard and navigation to the selected case');

  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto(base, { waitUntil: 'networkidle' });
  expect(await reduced.locator('main').evaluate(el => getComputedStyle(el).animationName)).toBe('none');
  expect(await reduced.locator('svg ellipse').first().evaluate(el => getComputedStyle(el.parentElement).animationName)).toBe('none');
  await reduced.close();

  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 320, height: 800 } });
  await noJs.goto(base);
  for (const name of ['Work', 'Method', 'About', 'Contact']) await expect(noJs.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name, exact: false })).toBeVisible();
  await noJs.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'About', exact: false }).click();
  await expect(noJs.locator('h1')).toHaveText('Ankit Kapoor');
  await noJs.close();
  console.log('PASS reduced motion and navigation without JavaScript');

  const missing = await page.goto(base + '/work/not-a-project');
  expect(missing.status()).toBe(404);
  await expect(page.locator('main')).toBeVisible();
  expect(errors, 'Browser errors and failed local resources').toEqual([]);
  console.log(`PASS 404 handling; no browser errors. Screenshots: ${output}`);
} finally {
  await browser.close();
}
