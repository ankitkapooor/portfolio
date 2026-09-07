import { expect, type Locator, type Page } from "@playwright/test";

/**
 * Open a <details> if it is closed. React reuses the DOM node across renders,
 * so a blind summary click can just as easily close one that is already open.
 */
export async function openDetails(details: Locator) {
  const isOpen = await details.evaluate((el) => (el as HTMLDetailsElement).open);
  if (!isOpen) await details.locator("summary").first().click();
}

export type Side = "RelayWorks" | "TaskPilot";
export type Preset = "Foundation" | "Reliability shock" | "Commodity models";

/** Start a fresh game from the briefing screen. */
export async function startGame(
  page: Page,
  side: Side = "RelayWorks",
  preset: Preset = "Reliability shock",
) {
  await page.goto("/play");
  await expect(page.getByRole("heading", { name: "Choose a side" })).toBeVisible();
  await page.getByRole("radio", { name: new RegExp(side) }).check();
  await page.getByRole("radio", { name: new RegExp(`^${preset}`) }).check();
  await page.getByRole("button", { name: "Start quarter one" }).click();
  await expect(
    page.getByRole("heading", { name: "What do you commit this quarter?" }),
  ).toBeVisible();
}

/** Select a commitment, lock the quarter, and advance past the reveal. */
export async function playQuarter(
  page: Page,
  quarter: number,
  actionLabel: string,
  rationale?: string,
) {
  await page.getByRole("button", { name: new RegExp(actionLabel) }).click();
  if (rationale) {
    await page.getByLabel(/What are you trying to achieve/).fill(rationale);
  }
  await page.getByRole("button", { name: new RegExp(`^Lock Q${quarter}`) }).click();
  await expect(
    page.getByRole("heading", { name: "Opponent reveal and resolution" }),
  ).toBeVisible();
  const next = quarter + 1;
  const continueButton = page.getByRole("button", {
    name: next > 4 ? "See the results" : `Continue to Q${next}`,
  });
  await continueButton.click();
}

export async function playFullGame(
  page: Page,
  side: Side = "RelayWorks",
  preset: Preset = "Reliability shock",
) {
  await startGame(page, side, preset);
  await playQuarter(page, 1, "Improve reliability", "Protect the enterprise base.");
  await playQuarter(page, 2, "Hold and preserve cash");
  await playQuarter(page, 3, "Reduce price", "Answer the challenger on price.");
  await playQuarter(page, 4, "Hold and preserve cash");
  await expect(page).toHaveURL(/\/results$/);
}
