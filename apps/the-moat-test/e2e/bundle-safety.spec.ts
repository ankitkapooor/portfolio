import { expect, test } from "@playwright/test";

/**
 * No secret in the client bundles (BRD section 10, requirements M-F07 and the
 * credential rules in section 12).
 *
 * This inspects what the browser actually downloads for the lab — the page HTML
 * and every same-origin script — rather than what the source appears to import.
 */

const CREDENTIAL_PATTERNS: [string, RegExp][] = [
  ["OpenAI-style key", /\bsk-[A-Za-z0-9_-]{16,}/],
  ["Anthropic-style key", /\bsk-ant-[A-Za-z0-9_-]{16,}/],
  ["AWS access key id", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{20,}/],
  ["bearer token", /Bearer\s+[A-Za-z0-9._-]{20,}/],
  ["OPENAI_API_KEY", /OPENAI_API_KEY/],
  ["ANTHROPIC_API_KEY", /ANTHROPIC_API_KEY/],
];

/** Strings that only exist inside the gold annotations. */
const GOLD_MARKERS = [
  "annotationRationale",
  "acceptableAlternatives",
  "goldActions",
  "goldDecisions",
  "case-001-a1",
  "case-005-d1",
  "Required behavioural example",
];

test("nothing the lab downloads carries a credential or a gold annotation", async ({
  page,
}) => {
  const scripts: { url: string; body: string }[] = [];

  page.on("response", (response) => {
    const url = response.url();
    if (!url.startsWith("http://127.0.0.1")) return;
    if (!/\.js(\?|$)/.test(url)) return;
    void response
      .text()
      .then((body) => scripts.push({ url, body }))
      .catch(() => undefined);
  });

  const response = await page.goto("/lab/meeting-assistants");
  const html = (await response?.text()) ?? "";

  // Exercise the whole client surface so its chunks are fetched.
  await page.getByRole("button", { name: /Storage vendor renewal/ }).click();
  await page.getByRole("radio", { name: "Output A is more useful" }).check();
  await page.getByTestId("reveal-button").click();
  await expect(page.getByTestId("reveal-A")).toBeVisible();
  await page.waitForLoadState("networkidle");

  expect(scripts.length).toBeGreaterThan(0);

  const payloads = [{ url: "document", body: html }, ...scripts];
  const offenders: string[] = [];
  for (const payload of payloads) {
    for (const [label, pattern] of CREDENTIAL_PATTERNS) {
      if (pattern.test(payload.body)) offenders.push(`${payload.url}: ${label}`);
    }
    for (const marker of GOLD_MARKERS) {
      if (payload.body.includes(marker)) {
        offenders.push(`${payload.url}: gold marker ${marker}`);
      }
    }
  }
  expect(offenders).toEqual([]);
});

test("the served lab page states that no model provider is configured", async ({
  page,
}) => {
  await page.goto("/lab/meeting-assistants");
  await expect(page.getByTestId("provider-status")).toContainText(
    "No model provider is configured",
  );
});
