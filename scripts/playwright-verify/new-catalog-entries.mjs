import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const newNames = [
  "Lat Pulldown",
  "RDL",
  "Cable Row",
  "Hollow Hold",
  "Swiss Ball Curl",
  "Bird Dog",
  "Romanian Deadlift",
  "Glute Bridge"
];

const browser = await chromium.launch();
const page = await browser.newPage();

await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);

await page.goto(`${BASE_URL}/library`);
await page.waitForSelector(".exercise-library", { timeout: 10000 });

let allPassed = true;

// Note: the library search matches across name/category/purpose/cues/
// mistakes/substitutions text (see useExerciseLibrary.ts), so searching a
// new exercise's own name also surfaces every OTHER exercise that lists it
// as a substitution option -- e.g. searching "RDL" also matches "Trap Bar
// Deadlift or RDL" and anything that lists RDL as a substitute. So instead
// of asserting exactly one result (the plan's original assumption, which
// doesn't hold given how search actually works), assert that a result card
// titled exactly `name` is present among the filtered results.
for (const name of newNames) {
  await page.fill('.library-search input[type="text"]', name);
  await page.waitForTimeout(200);

  const cardTitles = await page.locator(".exercise-card h3").allTextContents();
  const found = cardTitles.some((title) => title.trim() === name);

  const status = found ? "PASS" : "FAIL";
  if (!found) allPassed = false;
  console.log(`${status}: search "${name}" -> exact-name card ${found ? "found" : "NOT FOUND"} (${cardTitles.length} total results)`);
}

await page.fill('.library-search input[type="text"]', "");

// Verify Lat Pulldown surfaces as a curated substitution for Pull-Ups
// (Wednesday, week 1: "Upper Body Foundation + Core").
await page.goto(`${BASE_URL}/workouts`);
await page.waitForSelector(".day-card", { timeout: 10000 });

const swapButton = page.locator('button[aria-label="Swap Pull-Ups"]');
await swapButton.waitFor({ timeout: 10000 });
await swapButton.click();

const options = await page.locator(".swap-picker select option").allTextContents();
console.log("Substitution options for Pull-Ups:", options);

const hasLatPulldown = options.some((opt) => opt.trim() === "Lat Pulldown");
if (hasLatPulldown) {
  console.log("PASS: Lat Pulldown appears as a substitution option for Pull-Ups");
} else {
  console.error("FAIL: Lat Pulldown does not appear as a substitution option for Pull-Ups");
  allPassed = false;
}

await page.screenshot({ path: "scripts/playwright-verify/screenshots/new-catalog-substitution.png" });

await browser.close();

if (!allPassed) {
  console.error("FAIL: one or more checks failed");
  process.exitCode = 1;
} else {
  console.log("PASS: all 8 new catalog entries resolve and Lat Pulldown substitution surfaces correctly");
}
