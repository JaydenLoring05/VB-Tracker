import { expect, test } from "@playwright/test";

// /demo is public and runs on built-in sample data, so this needs no login.
test("the public demo renders the sample roster and the Attention Center", async ({ page }) => {
  // The guided tour must not block the dashboard; mark it already dismissed.
  await page.addInitScript(() => window.localStorage.setItem("nextrep-demo-tour-dismissed", "1"));

  await page.goto("/demo");

  await expect(page.getByRole("heading", { level: 1, name: "Coach dashboard" })).toBeVisible();

  const attention = page.locator(".attention-center");
  await expect(attention.getByRole("heading", { name: "Attention Center" })).toBeVisible();
  await expect(attention.locator(".attention-list > li").first()).toBeVisible();

  await expect(page.getByRole("heading", { name: "Roster" })).toBeVisible();
  await expect(page.getByText(/12 athletes on your roster/)).toBeVisible();
  for (const name of ["Ava Thompson", "Maya Chen", "Priya Patel"]) {
    await expect(page.getByText(name).first()).toBeVisible();
  }

  // Nothing tried to send the visitor to the login page.
  await expect(page).toHaveURL(/\/demo$/);
});
