import { expect, test } from "@playwright/test";
import { openDetails, playQuarter, startGame } from "./helpers";

test("rewinding a quarter creates a branch and leaves the original run intact", async ({
  page,
}) => {
  await startGame(page, "RelayWorks", "Reliability shock");
  await playQuarter(page, 1, "Improve reliability", "Original Q1 choice.");
  await playQuarter(page, 2, "Hold and preserve cash", "Original Q2 choice.");

  await page.goto("/results");
  const originalId = (await page.getByTestId("run-id").textContent())!.trim();

  const q2 = page.getByTestId("decision-q2");
  await openDetails(q2);
  await expect(q2.getByText("Original Q2 choice.")).toBeVisible();
  await q2.getByRole("button", { name: "Replay Q2 in a new branch" }).click();

  await expect(page).toHaveURL(/\/play$/);
  await expect(page.getByTestId("run-mode-notice")).toContainText(
    `Branch of run ${originalId}`,
  );
  await expect(page.getByText("Quarter 2 of 4 — you run RelayWorks")).toBeVisible();

  // The branch keeps Q1 and re-opens Q2 for a different decision.
  await playQuarter(page, 2, "Build enterprise integrations", "Branch Q2 choice.");
  await page.goto("/results");
  const q2Branch = page.getByTestId("decision-q2");
  await openDetails(q2Branch);
  await expect(q2Branch.getByText("Branch Q2 choice.")).toBeVisible();

  // The original run is still saved, unchanged, alongside the branch.
  await expect(
    page.getByRole("heading", { name: "Saved runs in this browser" }),
  ).toBeVisible();
  await page
    .getByRole("listitem")
    .filter({ hasText: originalId })
    .filter({ hasText: "standard" })
    .getByRole("button", { name: "Open" })
    .click();
  const originalQ2 = page.getByTestId("decision-q2");
  await openDetails(originalQ2);
  await expect(originalQ2.getByText("Original Q2 choice.")).toBeVisible();
});

test("the branch records its parent in the export", async ({ page }) => {
  await startGame(page, "TaskPilot", "Foundation");
  await playQuarter(page, 1, "Expand distribution");
  await page.goto("/results");

  const q1 = page.getByTestId("decision-q1");
  await openDetails(q1);
  await q1.getByRole("button", { name: "Replay Q1 in a new branch" }).click();
  await expect(page).toHaveURL(/\/play$/);

  await playQuarter(page, 1, "Improve reliability");
  await page.goto("/results");
  await openDetails(page.getByTestId("export-details"));
  const preview = await page.getByTestId("export-preview").innerText();
  const parsed = JSON.parse(preview);
  expect(parsed.run.mode).toBe("branch");
  expect(parsed.run.parentId).not.toBeNull();
});
