import { expect, test, type Page } from "@playwright/test";

/**
 * Fair blind comparison (BRD section 8, requirement M-F05).
 *
 * Identical treatment before the choice, identities hidden until the reveal, and
 * an assignment that a reload cannot reorder.
 */

const SAMPLE_TITLE = "Storage vendor renewal with no volunteer";

async function openSample(page: Page) {
  await page.goto("/lab/meeting-assistants");
  await page.getByRole("button", { name: new RegExp(SAMPLE_TITLE) }).click();
  await expect(page.getByRole("heading", { name: "Output A" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Output B" })).toBeVisible();
}

test("both panels render through the same component with the same treatment", async ({
  page,
}) => {
  await openSample(page);

  const panels = page.locator(".comparisonPanel");
  await expect(panels).toHaveCount(2);

  // Same classes, same section structure, same headings in the same order.
  const classNames = await panels.evaluateAll((nodes) =>
    nodes.map((node) => node.className),
  );
  expect(classNames[0]).toBe(classNames[1]);

  const headings = await panels.evaluateAll((nodes) =>
    nodes.map((node) =>
      [...node.querySelectorAll(".outputHeading")].map((heading) =>
        (heading.textContent ?? "").replace(/\d+/g, "").trim(),
      ),
    ),
  );
  expect(headings[0]).toEqual(headings[1]);
  expect(headings[0]).toContain("Summary");

  // Identical rendered width is what "identical type and width" means on screen.
  const boxes = await panels.evaluateAll((nodes) =>
    nodes.map((node) => Math.round(node.getBoundingClientRect().width)),
  );
  expect(boxes[0]).toBe(boxes[1]);

  const fonts = await panels.evaluateAll((nodes) =>
    nodes.map((node) => {
      const style = getComputedStyle(node);
      return `${style.fontFamily}|${style.fontSize}`;
    }),
  );
  expect(fonts[0]).toBe(fonts[1]);
});

test("identities are hidden before a choice is made", async ({ page }) => {
  await openSample(page);

  await expect(page.getByText("Source hidden until you choose")).toHaveCount(2);
  await expect(page.getByTestId("reveal-A")).toHaveCount(0);
  await expect(page.getByTestId("reveal-B")).toHaveCount(0);

  const panels = page.locator(".comparisonPanel");
  await expect(panels.nth(0)).toHaveAttribute("data-revealed", "false");
  await expect(panels.nth(1)).toHaveAttribute("data-revealed", "false");

  // No provenance badge sits inside a panel before the reveal: a badge would give
  // the answer away.
  await expect(panels.locator("[data-data-mode]")).toHaveCount(0);

  // The panel headers say nothing but the letter.
  await expect(page.locator(".comparisonPanelHeader")).toHaveCount(2);
  const headerText = await page
    .locator(".comparisonPanelHeader")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""));
  for (const text of headerText) {
    expect(text).not.toMatch(/Illustrative structured extraction/);
  }

  await expect(page.getByTestId("reveal-button")).toBeDisabled();
  await expect(
    page.getByText(/Choose one of the four options first/),
  ).toBeVisible();
});

/**
 * Regression guard. The baseline's summary used to begin with the method's own
 * name, which identified its panel to anyone who read it. Nothing rendered inside
 * a panel before the reveal — visible or screen-reader-only — may name a method.
 */
const METHOD_LABELS = [
  "Tagged transcript baseline",
  "Illustrative structured extraction",
  "AI structured extraction",
  "Hand-authored",
  "hand-authored",
  // The provenance badge marks, which the reveal adds and nothing else may.
  "Illustrative",
  "Measured",
  "Live trial",
];

test("no panel names its own method before the reveal", async ({ page }) => {
  await openSample(page);

  // textContent rather than innerText: visually hidden text is still read aloud,
  // and a screen reader user has to stay just as blind as a sighted one.
  const beforeReveal = await page
    .locator(".comparisonPanel")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""));
  expect(beforeReveal).toHaveLength(2);

  const leaks: string[] = [];
  beforeReveal.forEach((text, index) => {
    for (const label of METHOD_LABELS) {
      if (text.includes(label)) {
        leaks.push(`panel ${index === 0 ? "A" : "B"} contains "${label}"`);
      }
    }
  });
  expect(leaks).toEqual([]);

  // The check is only worth anything if those labels do appear once revealed.
  await page.getByRole("radio", { name: "They are equally useful" }).check();
  await page.getByTestId("reveal-button").click();
  await expect(page.getByTestId("reveal-A")).toBeVisible();

  const afterReveal = (
    await page
      .locator(".comparisonPanel")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""))
  ).join(" | ");
  expect(afterReveal).toContain("Tagged transcript baseline");
  expect(afterReveal).toContain("Illustrative structured extraction");
});

test("the baseline still states its scope in the output, without naming itself", async ({
  page,
}) => {
  await openSample(page);

  const panels = await page
    .locator(".comparisonPanel .outputSummary")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""));
  const scoped = panels.filter((text) =>
    /^Extracted \d+ tagged lines? from \d+ transcript lines?:/.test(text),
  );
  expect(scoped).toHaveLength(1);
  expect(scoped[0]).toContain("This output covers tagged lines only.");
  expect(scoped[0]).toContain(
    "owners, dates and decision status are not inferred",
  );
});

test("a choice can be made, and the reveal then names the method and the data mode", async ({
  page,
}) => {
  await openSample(page);

  for (const label of [
    "Output A is more useful",
    "Output B is more useful",
    "They are equally useful",
    "Not enough information to choose",
  ]) {
    await expect(page.getByRole("radio", { name: label })).toBeVisible();
  }

  await page.getByRole("radio", { name: "They are equally useful" }).check();
  await expect(page.getByRole("radio", { name: "They are equally useful" })).toBeChecked();
  await expect(page.getByText("Your choice is recorded.")).toBeVisible();

  const revealButton = page.getByTestId("reveal-button");
  await expect(revealButton).toBeEnabled();
  await revealButton.click();

  await expect(page.getByTestId("reveal-A")).toBeVisible();
  await expect(page.getByTestId("reveal-B")).toBeVisible();

  const revealedNames = (
    await page
      .locator(".comparisonRevealName")
      .evaluateAll((nodes) => nodes.map((node) => node.textContent ?? ""))
  ).join(" | ");
  expect(revealedNames).toContain("Tagged transcript baseline");
  expect(revealedNames).toContain("Illustrative structured extraction");

  const modes = await page
    .locator(".comparisonPanel [data-data-mode]")
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-data-mode")),
    );
  expect(modes.sort()).toEqual(["illustrative-demo", "recorded-experiment"]);

  await expect(page.getByText("Source hidden until you choose")).toHaveCount(0);
  await expect(revealButton).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sources revealed" })).toBeVisible();
});

test("reloading does not reorder the panels", async ({ page }) => {
  await openSample(page);
  await page.getByRole("radio", { name: "Output A is more useful" }).check();
  await page.getByTestId("reveal-button").click();

  const before = {
    a: await page.getByTestId("reveal-A").locator(".comparisonRevealName").innerText(),
    b: await page.getByTestId("reveal-B").locator(".comparisonRevealName").innerText(),
  };
  expect(before.a).not.toBe(before.b);

  for (let reload = 0; reload < 3; reload += 1) {
    await page.reload();
    await page.getByRole("button", { name: new RegExp(SAMPLE_TITLE) }).click();
    await expect(page.getByTestId("reveal-A")).toBeVisible();
    expect(
      await page.getByTestId("reveal-A").locator(".comparisonRevealName").innerText(),
    ).toBe(before.a);
    expect(
      await page.getByTestId("reveal-B").locator(".comparisonRevealName").innerText(),
    ).toBe(before.b);
    await expect(
      page.getByRole("radio", { name: "Output A is more useful" }),
    ).toBeChecked();
  }
});

test("the comparison surface says it is not a measurement", async ({ page }) => {
  await openSample(page);
  const scope = page.getByTestId("comparison-scope");
  await expect(scope).toContainText("This is a reading exercise, not a measurement.");
  await expect(scope).toContainText("No audience preference data has been collected");
});
