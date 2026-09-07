// Checks every reviewed surface for whole-page horizontal overflow at 360px,
// and names the widest offending elements so the cause is actionable.
// Start all four servers first, then from the repo root: node tools/overflow-check.mjs
import { chromium } from "../apps/disrupt-this-business/node_modules/@playwright/test/index.mjs";

const URLS = [
  ["portfolio-home", "http://localhost:3000/"],
  ["portfolio-case", "http://localhost:3000/work/the-moat-test"],
  ["disrupt-briefing", "http://localhost:3001/"],
  ["disrupt-play", "http://localhost:3001/play"],
  ["moat-investigation", "http://localhost:3002/investigations/meeting-assistants"],
  ["moat-lab", "http://localhost:3002/lab/meeting-assistants"],
  ["priced-in-home", "http://localhost:3003/"],
  ["priced-in-expectations", "http://localhost:3003/workspace/expectations"],
];

const browser = await chromium.launch();
for (const [name, url] of URLS) {
  const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
  await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const de = document.documentElement;
    const offenders = [...document.querySelectorAll("*")]
      .map((el) => ({
        sel:
          el.tagName.toLowerCase() +
          (el.className && typeof el.className === "string"
            ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
            : ""),
        right: Math.round(el.getBoundingClientRect().right),
      }))
      .filter((x) => x.right > de.clientWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 4);
    return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, offenders };
  });
  const overflow = r.scrollWidth > r.clientWidth + 1;
  console.log(
    `${overflow ? "OVERFLOW" : "ok      "} ${name.padEnd(24)} scrollWidth=${r.scrollWidth} clientWidth=${r.clientWidth}`,
  );
  if (overflow) {
    for (const o of r.offenders) console.log(`             ${o.sel} right=${o.right}`);
  }
  await page.close();
}
await browser.close();
