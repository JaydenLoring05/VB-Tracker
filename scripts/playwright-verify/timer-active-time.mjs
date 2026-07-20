import { chromium } from "@playwright/test";

import { BASE_URL, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

function parseDurationToSeconds(text) {
  const match = text.match(/(\d+):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("dialog", (dialog) => dialog.accept());

try {
  await signUpOrSignIn(page, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD);

  // Clear any stale open session from a prior run of this script so the
  // timer starts from a known, clean state.
  await page.goto(`${BASE_URL}/workout`);
  await page.waitForLoadState("networkidle").catch(() => {});
  const staleResume = page.locator("button", { hasText: "Resume" });
  if (await staleResume.isVisible().catch(() => false)) {
    await staleResume.click();
    await page.waitForSelector(".workout-elapsed", { timeout: 10000 });
    await page.locator("button", { hasText: "Finish Workout" }).click();
    await page.waitForSelector("text=Workout Complete", { timeout: 10000 });
    await page.goto(`${BASE_URL}/workout`);
    await page.waitForLoadState("networkidle").catch(() => {});
  }

  // Start a fresh workout. Use a button-scoped locator -- the sidebar also
  // has a "Start Workout" nav link, which a plain text selector would hit
  // first.
  await page.locator("button", { hasText: "Start Workout" }).click();
  await page.waitForSelector(".workout-elapsed", { timeout: 10000 });
  console.log("Workout started.");

  // ~5s of real "active" time with the screen open.
  await page.waitForTimeout(5000);

  // Navigate away via an in-app sidebar link, same as a real athlete would
  // -- this is a client-side route change (JS keeps running, ActiveWorkoutView
  // unmounts), not a hard page reload. Exercises the unmount-flush path in
  // useActiveWorkoutSession under realistic conditions.
  await page.locator(".sidebar a", { hasText: "Dashboard" }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });
  console.log("Navigated away from the workout at ~5s of active time.");

  // ~15s "away" -- this must NOT count toward the recorded duration.
  await page.waitForTimeout(15000);

  // Come back and resume the same open session.
  await page.goto(`${BASE_URL}/workout`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.locator("button", { hasText: "Resume" }).click();
  await page.waitForSelector(".workout-elapsed", { timeout: 10000 });
  console.log("Resumed the workout after ~15s away.");

  // ~3 more seconds of active time.
  await page.waitForTimeout(3000);

  await page.locator("button", { hasText: "Finish Workout" }).click();
  await page.waitForSelector("text=Workout Complete", { timeout: 10000 });

  const durationText = await page.locator(".workout-summary-stats .card").first().locator("h2").innerText();
  const seconds = parseDurationToSeconds(durationText);

  console.log(`Recorded duration: "${durationText}" (${seconds}s)`);

  if (seconds === null) throw new Error(`Couldn't parse duration text: "${durationText}"`);

  // Expected active time is ~8s (5s + 3s). Wall-clock time (if the bug
  // were still present) would be ~23s (5s + 15s away + 3s). Generous
  // tolerance for CI/script overhead, but this must clearly separate the
  // two: well under the ~15s away window, nowhere near the ~23s total.
  if (seconds > 15) {
    throw new Error(
      `FAIL: recorded duration is ${seconds}s, which includes some or all of the 15s the athlete was away. The timer is counting away time again.`
    );
  }

  if (seconds < 4) {
    throw new Error(`FAIL: recorded duration is only ${seconds}s, suspiciously low for ~8s of actual active time.`);
  }

  console.log(`PASS: recorded duration (${seconds}s) reflects active time only, not the 15s spent away.`);
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
