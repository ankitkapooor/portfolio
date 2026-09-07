import { expect, test } from "@playwright/test";
import { openDetails, playFullGame, playQuarter, startGame } from "./helpers";

test("a visitor reaches the role choice in one click and plays a full session", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Can you protect this business from AI disruption?",
    }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Start with a briefing" }).click();
  await expect(page.getByRole("heading", { name: "Choose a side" })).toBeVisible();

  await page.getByRole("radio", { name: /RelayWorks/ }).check();
  await page.getByRole("radio", { name: /^Foundation/ }).check();
  await page.getByRole("button", { name: "Start quarter one" }).click();

  await expect(page.getByText("Quarter 1 of 4 — you run RelayWorks")).toBeVisible();

  // The opponent's move must not be visible before the player locks.
  await expect(page.getByText(/TaskPilot.s committed move for this quarter is hidden/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Opponent reveal and resolution" }),
  ).toHaveCount(0);

  await playQuarter(page, 1, "Improve reliability", "Buy retention with reliability.");
  await expect(page.getByText("Quarter 2 of 4 — you run RelayWorks")).toBeVisible();

  await playQuarter(page, 2, "Build enterprise integrations");
  await playQuarter(page, 3, "Hold and preserve cash");
  await playQuarter(page, 4, "Hold and preserve cash");

  await expect(page).toHaveURL(/\/results$/);
  await expect(
    page.getByRole("heading", { name: /RelayWorks after 4 of 4 quarters/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Three observations from the rules" }),
  ).toBeVisible();
  await expect(page.getByRole("table").first()).toBeVisible();
});

test("the challenger side plays a full session too", async ({ page }) => {
  await startGame(page, "TaskPilot", "Commodity models");
  await expect(page.getByText("Quarter 1 of 4 — you run TaskPilot")).toBeVisible();

  await playQuarter(page, 1, "Develop autonomous delivery", "Bet on the automation curve.");
  await playQuarter(page, 2, "Hold and preserve cash");
  await playQuarter(page, 3, "Expand distribution");
  await playQuarter(page, 4, "Hold and preserve cash");

  await expect(page).toHaveURL(/\/results$/);
  await expect(
    page.getByRole("heading", { name: /TaskPilot after 4 of 4 quarters/ }),
  ).toBeVisible();
});

test("the decision preview shows cost, capacity, timing and uncertainty", async ({
  page,
}) => {
  await startGame(page, "TaskPilot", "Foundation");
  await expect(page.getByText("Select a commitment to preview")).toBeVisible();

  await page.getByRole("button", { name: /Develop autonomous delivery/ }).click();
  const preview = page.getByRole("region", { name: "Decision preview" });
  await expect(preview.getByText("$300,000")).toBeVisible();
  await expect(preview.getByText(/2 of 2 effort units/)).toBeVisible();
  await expect(preview.getByText(/Activates at the start of Q3/)).toBeVisible();
  await expect(preview.getByText(/Two quarters of capacity are locked/)).toBeVisible();
});

test("blocked commitments stay visible and explain why", async ({ page }) => {
  await startGame(page, "TaskPilot", "Foundation");
  // TaskPilot already sells outcome bundles, so the conversion is unavailable.
  const bundles = page.getByRole("button", { name: /Change to outcome bundles/ });
  await expect(bundles).toBeDisabled();
  await expect(bundles).toContainText("already sells outcome bundles");

  // Spending both effort units on a two-quarter build blocks Q2 entirely.
  await playQuarter(page, 1, "Develop autonomous delivery");
  const reliability = page.getByRole("button", { name: /Improve reliability/ });
  await expect(reliability).toBeDisabled();
  await expect(reliability).toContainText("Capacity does not carry over");
});

test("a refresh resumes the exact unlocked state", async ({ page }) => {
  await startGame(page, "RelayWorks", "Commodity models");
  await playQuarter(page, 1, "Expand distribution", "Widen the funnel.");
  await expect(page.getByText("Quarter 2 of 4 — you run RelayWorks")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Quarter 2 of 4 — you run RelayWorks")).toBeVisible();
  await expect(page.getByText("Q1", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Loaded from local storage")).toBeVisible();
});

test("every ledger line links to a documented rule", async ({ page }) => {
  await playFullGame(page, "RelayWorks", "Reliability shock");
  const firstDecision = page.getByTestId("decision-q1");
  await openDetails(firstDecision);
  const formulaLink = firstDecision.getByRole("link", { name: "F-CASH" }).first();
  await expect(formulaLink).toBeVisible();
  await formulaLink.click();
  await expect(page).toHaveURL(/\/methodology#F-CASH$/);
  await expect(page.getByRole("heading", { name: /F-CASH Ending cash/ })).toBeVisible();
});
