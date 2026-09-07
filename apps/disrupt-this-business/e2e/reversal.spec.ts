import { expect, test } from "@playwright/test";
import { playFullGame, playQuarter } from "./helpers";

test("switching sides replays the recorded strategy against you", async ({ page }) => {
  await playFullGame(page, "RelayWorks", "Foundation");

  await page
    .getByRole("button", { name: "Switch sides against your recorded strategy" })
    .click();
  await expect(page).toHaveURL(/\/play$/);

  await expect(page.getByText("Against your recorded strategy").first()).toBeVisible();
  await expect(page.getByTestId("run-mode-notice")).toContainText("Role reversal against run");
  await expect(page.getByText("Quarter 1 of 4 — you run TaskPilot")).toBeVisible();

  // The recorded RelayWorks opening was "Improve reliability"; it must reappear
  // as the opponent's move after the player locks, and not before.
  await expect(page.getByText(/RelayWorks.s committed move for this quarter is hidden/)).toBeVisible();
  await page.getByRole("button", { name: /Hold and preserve cash/ }).click();
  await page.getByRole("button", { name: /^Lock Q1/ }).click();

  const reveal = page.getByRole("region", { name: "Opponent reveal and resolution" });
  await expect(
    reveal.getByRole("heading", { name: "Improve reliability", exact: true }),
  ).toBeVisible();
  await expect(
    reveal.getByText(/replays the strategy you recorded rather than recomputing/),
  ).toBeVisible();

  await page.getByRole("button", { name: "Continue to Q2" }).click();
  await playQuarter(page, 2, "Reduce price");
  await page.goto("/results");
  await expect(
    page.getByText(/Comparison mode: against your recorded strategy/),
  ).toBeVisible();
});

test("a reversal cannot start before a strategy has been recorded", async ({ page }) => {
  await page.goto("/results");
  await expect(page.getByRole("heading", { name: "No run to report yet" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Switch sides against your recorded strategy" }),
  ).toHaveCount(0);
});
