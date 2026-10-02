import { expect, test } from "@playwright/test";

// The demo versions of Workout Mode and the film room: real components on
// in-memory sample data. No account, no Supabase, nothing saved.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("nextrep-demo-tour-dismissed", "1"));
  page.on("dialog", (dialog) => dialog.accept());
});

test("Workout Mode logs a set, flags a PR and finishes on /demo", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Athlete view" }).click();
  // The athlete's "Start today's workout" opens the demo Workout Mode instead of a sign-up prompt.
  await page.getByText(/Start today/i).first().click();
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

test("the film room shows sample film and tags, and keyboard tagging adds one", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Film room" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Film room" })).toBeVisible();
  await expect(page.getByText(/CHN vs\. TUR/).first()).toBeVisible();
  await expect(page.locator('iframe[src*="youtube"]')).toBeVisible();

  await expect(page.getByRole("button", { name: /Kill \(\d+\)/ })).toBeVisible();
  const before = Number(/\((\d+)\)/.exec((await page.getByRole("button", { name: /Kill \(\d+\)/ }).innerText()) ?? "")?.[1]);

  await page.locator("h1").click();
  // The hotkey listener attaches once the player has mounted; retry K until the hint shows.
  await expect(async () => {
    await page.keyboard.press("Escape");
    await page.keyboard.press("k");
    await expect(page.getByText("Kill → direction?")).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  await page.keyboard.press("c");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: `Kill (${before + 1})` })).toBeVisible();
  await expect(page).toHaveURL(/\/demo$/);
});
