import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);

await page.goto(`${BASE_URL}/workout`);
await page.waitForSelector("text=Start", { timeout: 10000 });
await page.click("button:has-text('Start')");
await page.waitForURL("**/workout/*");

await page.fill('input[placeholder="Reps"]', "10");
await page.click('button:has-text("Log Set")');

await page.waitForSelector(".rest-timer", { timeout: 5000 });
const before = await page.textContent(".rest-timer-header span:nth-child(2)");
console.log("Rest timer showing:", before);

await page.click('button:has-text("Skip Rest")');
await page.waitForTimeout(400);

const restTimerStillVisible = await page.locator(".rest-timer").isVisible().catch(() => false);

if (restTimerStillVisible) {
  console.error("FAIL: rest timer still visible 400ms after clicking Skip Rest");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/rest-timer-fail.png" });
  process.exitCode = 1;
} else {
  console.log("PASS: rest timer cleared immediately after Skip Rest and did not reappear");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/rest-timer-pass.png" });
}

await browser.close();
