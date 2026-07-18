import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const categories = [
  "Jump Development",
  "Landing Mechanics",
  "Knee Strength",
  "Shoulder Health",
  "Hitting Power",
  "Rotational Core",
  "Speed & Agility",
  "Volleyball Conditioning",
  "Mobility",
  "Recovery"
];

const browser = await chromium.launch();
const page = await browser.newPage();

await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);

await page.goto(`${BASE_URL}/library`);
await page.waitForSelector(".exercise-library", { timeout: 10000 });

let allPassed = true;

for (const category of categories) {
  await page.click(`.filter-row button:has-text("${category}")`, { exact: false });
  await page.waitForTimeout(200);

  const countText = await page.textContent(".library-header p.muted");
  const match = countText.match(/(\d+) of (\d+) exercises shown/);
  const shown = match ? parseInt(match[1], 10) : 0;

  const status = shown > 0 ? "PASS" : "FAIL";
  if (shown === 0) allPassed = false;
  console.log(`${status}: "${category}" -> ${shown} exercises (${countText.trim()})`);

  await page.screenshot({
    path: `scripts/playwright-verify/screenshots/category-${category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`
  });
}

await browser.close();

if (!allPassed) {
  console.error("FAIL: at least one category showed 0 exercises");
  process.exitCode = 1;
} else {
  console.log("PASS: all 10 categories show at least one exercise");
}
