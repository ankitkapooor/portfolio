import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { openDetails, playFullGame } from "./helpers";

test("an exported run reimports and reproduces its ledger", async ({ page }) => {
  await playFullGame(page, "RelayWorks", "Commodity models");

  const cashCell = await page
    .getByRole("table")
    .filter({ hasText: "Full quarterly ledger" })
    .locator("tbody tr")
    .last()
    .locator("td")
    .last()
    .innerText();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  const exported = readFileSync(path, "utf8");
  expect(JSON.parse(exported).format).toBe("disrupt-this-business/run");

  // Clear everything, then rebuild the run from the file alone.
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/play");
  await page.getByRole("button", { name: "Reset all saved runs" }).click();
  await expect(page.getByRole("heading", { name: "Choose a side" })).toBeVisible();

  await page.goto("/results");
  await expect(page.getByRole("heading", { name: "No run to report yet" })).toBeVisible();

  await page.getByLabel("Or paste the exported JSON").fill(exported);
  await page.getByRole("button", { name: "Import pasted run" }).click();

  await expect(page.getByText("Import verified.")).toBeVisible();
  await expect(page.getByText(/reproduced exactly/)).toBeVisible();

  const reimportedCash = await page
    .getByRole("table")
    .filter({ hasText: "Full quarterly ledger" })
    .locator("tbody tr")
    .last()
    .locator("td")
    .last()
    .innerText();
  expect(reimportedCash).toBe(cashCell);
});

test("a Markdown export downloads with both ledgers", async ({ page }) => {
  await playFullGame(page, "TaskPilot", "Foundation");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export Markdown" }).click();
  const download = await downloadPromise;
  const markdown = readFileSync(await download.path(), "utf8");
  expect(markdown).toContain("Fictional design assumptions");
  expect(markdown).toContain("RelayWorks ledger");
  expect(markdown).toContain("TaskPilot ledger");
});

test("a corrupted import is rejected with a useful message", async ({ page }) => {
  await page.goto("/results");
  await page.getByLabel("Or paste the exported JSON").fill("{ not json");
  await page.getByRole("button", { name: "Import pasted run" }).click();
  await expect(page.getByTestId("import-error")).toContainText("not valid JSON");

  await page
    .getByLabel("Or paste the exported JSON")
    .fill(JSON.stringify({ format: "some-other-tool", data: 1 }));
  await page.getByRole("button", { name: "Import pasted run" }).click();
  await expect(page.getByTestId("import-error")).toContainText(
    "does not look like a Disrupt This Business run",
  );
});

test("a tampered ledger is rejected because the replay disagrees", async ({ page }) => {
  await playFullGame(page, "RelayWorks", "Foundation");
  await openDetails(page.getByTestId("export-details"));
  const exported = JSON.parse(await page.getByTestId("export-preview").innerText());
  exported.run.ledger[0].incumbent.endingCash = 99_000_000;

  await page.getByLabel("Or paste the exported JSON").fill(JSON.stringify(exported));
  await page.getByRole("button", { name: "Import pasted run" }).click();
  await expect(page.getByTestId("import-error")).toContainText(
    "does not match what the engine reproduces",
  );
});
