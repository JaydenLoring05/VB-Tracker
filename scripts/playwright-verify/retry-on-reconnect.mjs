import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);

await page.goto(`${BASE_URL}/workouts`);
await page.waitForSelector(".exercise-row input[type='checkbox']", { timeout: 10000 });

// Simulate offline for the exercise_checks write only: abort that one REST call.
await page.route("**/rest/v1/exercise_checks**", (route) => route.abort());

const checkbox = page.locator(".exercise-row input[type='checkbox']").first();
const wasChecked = await checkbox.isChecked();
await checkbox.click();

await page.waitForSelector(".sync-toast", { timeout: 5000 });
const toastText = await page.textContent(".sync-toast");
console.log("Toast appeared:", toastText?.trim());

const retryButton = page.locator(".sync-toast-retry");
const retryVisible = await retryButton.isVisible().catch(() => false);

if (!retryVisible) {
  console.error("FAIL: Retry button not visible on sync-error toast");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/retry-on-reconnect-fail.png" });
  await browser.close();
  process.exit(1);
}

console.log("PASS (step 1): Retry button visible on sync-error toast after a failed write");

// Simulate connectivity returning: stop intercepting, then fire the 'online' event.
await page.unroute("**/rest/v1/exercise_checks**");

const retriedWrite = page.waitForResponse(
  (response) => response.url().includes("/rest/v1/exercise_checks") && response.request().method() === "POST",
  { timeout: 5000 }
);

await page.evaluate(() => window.dispatchEvent(new Event("online")));

// The stored retry should replay the same write; wait for both the network
// call to complete and the toast to clear.
try {
  const [retriedResponse] = await Promise.all([
    retriedWrite,
    page.waitForSelector(".sync-toast", { state: "detached", timeout: 5000 })
  ]);
  console.log("Retried write response status:", retriedResponse.status());
  console.log("Retried write request body:", retriedResponse.request().postData());
} catch {
  console.error("FAIL: sync-error toast did not clear (or retry write did not fire) after synthetic 'online' event");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/retry-on-reconnect-fail.png" });
  await browser.close();
  process.exit(1);
}

console.log("PASS (step 2): sync-error toast cleared after synthetic 'online' event (auto-retry fired)");

// Confirm the write actually persisted: reload and re-check the checkbox state.
const reloadFetch = page.waitForResponse(
  (response) => response.url().includes("/rest/v1/exercise_checks") && response.request().method() === "GET",
  { timeout: 10000 }
);
await page.reload();
const reloadResponse = await reloadFetch;
console.log("Reload GET status:", reloadResponse.status());
console.log("Reload GET body:", await reloadResponse.text());
await page.waitForSelector(".exercise-row input[type='checkbox']", { timeout: 10000 });
const afterReload = await page.locator(".exercise-row input[type='checkbox']").first().isChecked();

if (afterReload === !wasChecked) {
  console.log(`PASS (step 3): checkbox state persisted after reload (was ${wasChecked}, now ${afterReload})`);
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/retry-on-reconnect-pass.png" });
} else {
  console.error(`FAIL: checkbox state did not persist (was ${wasChecked}, now ${afterReload})`);
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/retry-on-reconnect-fail.png" });
  process.exitCode = 1;
}

await browser.close();
