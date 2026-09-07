import { expect, test } from "@playwright/test";

/**
 * The full browser path required by BRD section 10: investigation, sample,
 * comparison, export.
 */

const SAMPLE_TITLE = "Pricing page launch pulled back for legal sign-off";

test("a reader can go from the index to the investigation to the lab", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "What is still worth building when the feature is easy to copy?",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Read the investigation" }).click();
  await expect(page).toHaveURL("/investigations/meeting-assistants");
  await expect(
    page.getByRole("heading", { level: 1, name: "The Moat Test" }),
  ).toBeVisible();
  await expect(
    page.getByText("What remains valuable when AI features are easy to reproduce?"),
  ).toBeVisible();

  await page
    .getByRole("link", { name: "Run the baseline on a sample or your own transcript" })
    .click();
  await expect(page).toHaveURL("/lab/meeting-assistants");
  await expect(
    page.getByRole("heading", { level: 1, name: "Lab: meeting extraction" }),
  ).toBeVisible();
});

test("selecting a supplied sample runs the deterministic baseline over it", async ({
  page,
}) => {
  await page.goto("/lab/meeting-assistants");

  const sample = page.getByRole("button", { name: new RegExp(SAMPLE_TITLE) });
  await sample.click();
  await expect(sample).toHaveAttribute("aria-pressed", "true");

  await expect(page.getByRole("heading", { name: SAMPLE_TITLE })).toBeVisible();
  await expect(
    page.getByText(/\d+ of \d+ lines carry an ACTION: or DECISION: tag/),
  ).toBeVisible();

  // The scope line the baseline always emits. It states what was covered without
  // naming the method, so reading it does not break the blind.
  await expect(
    page.getByText(/Extracted \d+ tagged lines? from \d+ transcript lines?:/),
  ).toBeVisible();

  // Identify the baseline panel the way the interface intends: choose, then reveal.
  // Locating it by something in the output text would depend on the output
  // identifying itself, which is exactly what must not happen.
  await page.getByRole("radio", { name: "Not enough information to choose" }).check();
  await page.getByTestId("reveal-button").click();

  const baselinePanel = page.locator(".comparisonPanel").filter({
    has: page.locator(".comparisonRevealName", {
      hasText: "Tagged transcript baseline",
    }),
  });
  await expect(baselinePanel).toHaveCount(1);

  // Case 005 reverses a Friday launch. The baseline recovers the tagged decision
  // but reports it as unresolved, never as a decision that stands.
  const fridayItem = baselinePanel
    // Scoped to the decisions section: the uncertainty note quotes the same line
    // in its screen-reader citation text.
    .locator('section[aria-labelledby$="-decisions"] .outputItem')
    .filter({ hasText: "we ship the pricing page on Friday" });
  await expect(fridayItem).toHaveCount(1);
  await expect(fridayItem).toContainText("Unresolved");
  await expect(fridayItem).not.toContainText("Stands");
  await expect(fridayItem).toContainText("L005");
});

test("the reader can export a downloadable artifact that carries its limitations", async ({
  page,
}) => {
  await page.goto("/lab/meeting-assistants");
  await page.getByRole("button", { name: new RegExp(SAMPLE_TITLE) }).click();

  await page.getByRole("radio", { name: "Output A is more useful" }).check();

  const markdownDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download Markdown" }).click();
  const markdown = await markdownDownload;
  expect(markdown.suggestedFilename()).toBe("moat-test-case-005.md");

  const preview = page.getByTestId("export-preview");
  await expect(preview).toContainText("# The Moat Test — extraction output");
  await expect(preview).toContainText("## Limitations");
  await expect(preview).toContainText("The transcript is synthetic.");
  await expect(preview).toContainText(
    "No model provider is configured in this deployment",
  );
  await expect(preview).toContainText(
    "The comparison was exported before the identities were revealed",
  );

  const jsonDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download JSON" }).click();
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toBe("moat-test-case-005.json");

  const stream = await json.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const payload = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
    scope: string;
    versions: { app: string; corpus: string | null };
    transcript: { id: string; synthetic: boolean };
    outputs: { panel: string | null; label: string }[];
    comparison: { choice: string | null; revealed: boolean } | null;
    limitations: string[];
  };

  expect(payload.transcript.id).toBe("case-005");
  expect(payload.transcript.synthetic).toBe(true);
  expect(payload.versions.corpus).toBeTruthy();
  expect(payload.outputs).toHaveLength(2);
  expect(payload.comparison?.choice).toBe("A");
  expect(payload.comparison?.revealed).toBe(false);
  expect(payload.scope).toMatch(/single case/);
  expect(payload.limitations.length).toBeGreaterThan(3);
});
