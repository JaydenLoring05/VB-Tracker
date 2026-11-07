import { expect, test } from "@playwright/test";

import { WORKOUT_CTA_LABELS } from "../src/lib/dashboardCta";

// Matches whichever call to action the athlete dashboard shows today. On a rest
// day (every Sunday) there is no "Start Today's Workout" button, only the quiet
// "Want to train anyway?" link, and both open the demo's Workout Mode.
const WORKOUT_CTA = new RegExp(
  WORKOUT_CTA_LABELS.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i"
);

// The demo version of Workout Mode: real components on
// in-memory sample data. No account, no Supabase, nothing saved.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("nextrep-demo-tour-dismissed", "1"));
  page.on("dialog", (dialog) => dialog.accept());
});

test("Workout Mode logs a set, flags a PR and finishes on /demo", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Athlete view" }).click();
  // The athlete's workout link opens the demo Workout Mode instead of a sign-up prompt.
  await page.locator("#dashboard").getByRole("link", { name: WORKOUT_CTA }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Workout Mode" })).toBeVisible();

  await page.getByPlaceholder("Weight").fill("160");
  await page.getByPlaceholder("Reps").fill("5");
  await page.getByRole("button", { name: /Log Set/ }).click();
  await expect(page.getByText("NEW PR")).toBeVisible();

  await page.getByRole("button", { name: "Finish Workout" }).click();
  await expect(page.getByText(/Workout complete/i)).toBeVisible();
  await page.getByRole("button", { name: "Back to Dashboard" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Athlete view" })).toBeVisible();
  await expect(page).toHaveURL(/\/demo$/);
});
