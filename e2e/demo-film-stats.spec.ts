import { expect, test } from "@playwright/test";

// Film stats from tags (F-01) on the public demo: real components on
// in-memory sample tags. No account, no Supabase, nothing saved.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("nextrep-demo-tour-dismissed", "1"));
});

test("the film room's Stats view adds up the sample tags and a new three-tap tag", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: "Film room" }).click();
  await page.getByRole("button", { name: "Stats", exact: true }).click();

  // Passing: Chloe's 3 and 2 average 2.50.
  const passing = page.getByRole("table", { name: /Passing average by athlete/ });
  await expect(passing.getByRole("row", { name: /Chloe Johnson/ })).toContainText("2.50");

  // Set distribution: one of three zoned sets went to zone 4.
  await expect(page.getByRole("listitem").filter({ hasText: "Zone 4" })).toContainText("33%");

  // Blocking: Emma has a stuff and a touch.
  const blocking = page.getByRole("table", { name: /Block outcomes by athlete/ });
  await expect(blocking.getByRole("row", { name: /Emma Rodriguez/ }).getByRole("cell").first()).toHaveText("2");

  // Tag one more block in three taps, and the stats pick it up.
  await page.getByRole("button", { name: /^Tags \(\d+\)$/ }).click();
  const tagger = page.getByRole("group", { name: "Tag a play" });
  await tagger.getByRole("button", { name: "Emma Rodriguez" }).click();
  await tagger.getByRole("button", { name: "Block" }).click();
  await tagger.getByRole("button", { name: "Error" }).click();

  await page.getByRole("button", { name: "Stats", exact: true }).click();
  const emma = blocking.getByRole("row", { name: /Emma Rodriguez/ }).getByRole("cell");
  await expect(emma.first()).toHaveText("3");
  await expect(emma.last()).toHaveText("1");
  await expect(page).toHaveURL(/\/demo$/);
});

test("the coach's athlete drill-down has a Film tab with that athlete's numbers", async ({ page }) => {
  await page.goto("/demo");
  await page.getByRole("button", { name: /Chloe Johnson/ }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Film", exact: true }).click();
  await expect(dialog.getByText("Passing average on 2 passes")).toBeVisible();
  await expect(dialog.getByRole("table", { name: /passing average in each film/ })).toContainText("2.50");
});
