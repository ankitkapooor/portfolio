import { expect, test } from "@playwright/test";

/** Tab until `predicate` matches the focused element, or fail loudly. */
async function tabTo(
  page: import("@playwright/test").Page,
  describe: string,
  matches: (info: { role: string; text: string }) => boolean,
  limit = 80,
) {
  for (let i = 0; i < limit; i += 1) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element) return { role: "", text: "" };
      return {
        role: element.getAttribute("role") ?? element.tagName.toLowerCase(),
        text: (element.textContent ?? element.getAttribute("aria-label") ?? "").trim(),
      };
    });
    if (matches(info)) return;
  }
  throw new Error(`Never reached ${describe} with the keyboard after ${limit} tabs.`);
}

test("a quarter can be played with the keyboard alone", async ({ page }) => {
  await page.goto("/");

  // The skip link is the first stop and moves focus into the main region.
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toHaveText("Skip to main content");

  await tabTo(page, "the briefing link", (info) =>
    info.text.includes("Start with a briefing"),
  );
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Choose a side" })).toBeVisible();

  // Role and preset are native radios, so arrow keys and space work.
  await tabTo(page, "the role radio group", (info) => info.role === "input");
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: /RelayWorks/ })).toBeChecked();

  await tabTo(page, "the start button", (info) =>
    info.text.includes("Start quarter one"),
  );
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "What do you commit this quarter?" }),
  ).toBeVisible();

  await tabTo(page, "a decision control", (info) =>
    info.text.includes("Hold and preserve cash"),
  );
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: /Hold and preserve cash/ }),
  ).toHaveAttribute("aria-pressed", "true");

  await tabTo(page, "the lock button", (info) => info.text.startsWith("Lock Q1"));
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "Opponent reveal and resolution" }),
  ).toBeVisible();

  await tabTo(page, "the continue button", (info) =>
    info.text.includes("Continue to Q2"),
  );
  await page.keyboard.press("Enter");
  await expect(page.getByText("Quarter 2 of 4 — you run RelayWorks")).toBeVisible();
});

test("focus is always visible and headings are ordered", async ({ page }) => {
  await page.goto("/methodology");

  const levels = await page
    .locator("h1, h2, h3")
    .evaluateAll((nodes) => nodes.map((node) => Number(node.tagName.slice(1))));
  expect(levels[0]).toBe(1);
  for (let i = 1; i < levels.length; i += 1) {
    expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
  }

  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => {
    const element = document.activeElement as HTMLElement;
    return getComputedStyle(element).outlineStyle;
  });
  expect(outline).not.toBe("none");
});
