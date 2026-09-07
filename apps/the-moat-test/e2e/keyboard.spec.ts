import { expect, test, type Page } from "@playwright/test";

/**
 * Keyboard comparison and reveal (BRD section 13).
 *
 * Nothing here uses the mouse after the sample is chosen: the choice controls and
 * the reveal button are reached with Tab and operated with Space and Enter.
 */

const SAMPLE_TITLE = "Phishing sample read into the record";

/** Presses Tab until the described element has focus, or gives up loudly. */
async function tabTo(page: Page, describe: string, maxPresses = 150) {
  for (let press = 0; press < maxPresses; press += 1) {
    await page.keyboard.press("Tab");
    const matched = await page.evaluate((selector) => {
      const active = document.activeElement;
      return Boolean(active && active.matches(selector));
    }, describe);
    if (matched) return press + 1;
  }
  throw new Error(`never reached ${describe} within ${maxPresses} Tab presses`);
}

test("the comparison and the reveal can be operated with the keyboard alone", async ({
  page,
}) => {
  await page.goto("/lab/meeting-assistants");
  await page.getByRole("button", { name: new RegExp(SAMPLE_TITLE) }).click();
  await expect(page.getByRole("heading", { name: "Output A" })).toBeVisible();

  // Start from the top of the document so the tab order is the real one.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });

  await tabTo(page, 'input[type="radio"][value="A"]');
  await expect(page.locator('input[type="radio"][value="A"]')).toBeFocused();

  // Arrow keys move within a radio group and select as they go.
  await page.keyboard.press("ArrowDown");
  await expect(page.locator('input[type="radio"][value="B"]')).toBeFocused();
  await expect(page.getByRole("radio", { name: "Output B is more useful" })).toBeChecked();

  // Space selects the focused option, which is the other way round the same group.
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Space");
  await expect(page.getByRole("radio", { name: "Output A is more useful" })).toBeChecked();

  // The optional reason is the next stop, and it accepts typed input.
  await page.keyboard.press("Tab");
  await expect(page.locator("textarea.reasonTextarea")).toBeFocused();
  await page.keyboard.type("A cites lines I can check.");

  await tabTo(page, '[data-testid="reveal-button"]', 5);
  await expect(page.getByTestId("reveal-button")).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(page.getByTestId("reveal-A")).toBeVisible();
  await expect(page.getByTestId("reveal-B")).toBeVisible();
  await expect(page.getByTestId("reveal-button")).toBeDisabled();
});

test("every choice control has a visible label and a name a screen reader can use", async ({
  page,
}) => {
  await page.goto("/lab/meeting-assistants");
  await page.getByRole("button", { name: new RegExp(SAMPLE_TITLE) }).click();
  await expect(page.getByRole("heading", { name: "Output A" })).toBeVisible();

  await expect(page.getByRole("group", { name: "Your choice" })).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(
    page.getByLabel("Why? (optional, recorded before the reveal)"),
  ).toBeVisible();
  await expect(page.getByRole("region", { name: "Output A" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Output B" })).toBeVisible();
});
