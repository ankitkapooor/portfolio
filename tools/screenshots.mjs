// Captures each app's primary surface at the three review breakpoints.
// Start all four servers first, then from the repo root: node tools/screenshots.mjs
// Playwright is resolved from the app that owns it; no root package.json exists.
import { chromium } from "../apps/disrupt-this-business/node_modules/@playwright/test/index.mjs";
import { mkdirSync } from "node:fs";

const OUT = "docs/screenshots";
const WIDTHS = [360, 768, 1440];

const PAGES = [
  ["portfolio-home", "http://localhost:3000/"],
  ["portfolio-case", "http://localhost:3000/work/the-moat-test"],
  ["disrupt-briefing", "http://localhost:3001/"],
  ["disrupt-play", "http://localhost:3001/play"],
  ["moat-investigation", "http://localhost:3002/investigations/meeting-assistants"],
  ["moat-lab", "http://localhost:3002/lab/meeting-assistants"],
  ["priced-in-home", "http://localhost:3003/"],
  ["priced-in-expectations", "http://localhost:3003/workspace/expectations"],
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
for (const [name, url] of PAGES) {
  for (const width of WIDTHS) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}-${width}.png`, fullPage: true });
    await page.close();
    console.log(`${name} @ ${width}`);
  }
}
await browser.close();
