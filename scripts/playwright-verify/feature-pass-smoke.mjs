import { chromium } from "@playwright/test";

import { BASE_URL, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("dialog", (dialog) => dialog.accept());
page.on("pageerror", (err) => {
  throw new Error(`Uncaught page error: ${err.message}`);
});

const eventTitle = `Verify Match ${Date.now()}`;

try {
  // --- Coach side: Attention Center + Team Calendar ---
  await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
  await page.goto(`${BASE_URL}/coach`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/feature-pass-coach.png", fullPage: true });

  await page.waitForSelector("text=Attention Center", { timeout: 10000 });
  console.log("PASS: Attention Center renders on /coach.");

  const attentionText = await page.locator(".attention-center").innerText();
  console.log("Attention Center content:", attentionText.replace(/\n+/g, " | "));

  await page.waitForSelector("text=Team Calendar", { timeout: 10000 });
  console.log("PASS: Team Calendar panel renders on /coach.");

  await page.locator("button", { hasText: "+ Add Event" }).click();
  const today = new Date().toISOString().slice(0, 10);
  await page.locator(".team-event-form input[type='date']").fill(today);
  await page.locator(".team-event-form select").selectOption("match");
  await page.locator(".team-event-form input[placeholder*='title']").fill(eventTitle);
  await page.locator(".team-event-form button[type='submit']").click();

  await page.waitForSelector(`text=${eventTitle}`, { timeout: 10000 });
  console.log("PASS: coach-created team event appears in the Team Calendar list.");

  // --- Athlete side: sees the team event, expanded check-in fields ---
  const athletePage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  athletePage.on("dialog", (dialog) => dialog.accept());
  await signUpOrSignIn(athletePage, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD);

  await athletePage.goto(`${BASE_URL}/calendar`);
  await athletePage.waitForLoadState("networkidle").catch(() => {});
  const calendarText = await athletePage.locator("body").innerText();
  if (!calendarText.includes("Team")) {
    throw new Error("FAIL: athlete calendar preview doesn't show a 'Team' tagged event.");
  }
  console.log("PASS: athlete's personal calendar shows a coach-authored team event.");

  await athletePage.goto(`${BASE_URL}/stats`);
  await athletePage.waitForLoadState("networkidle").catch(() => {});
  const statsText = await athletePage.locator("body").innerText();
  for (const field of ["Stress", "Motivation", "Lower-Back Discomfort", "Ankle Discomfort"]) {
    if (!statsText.includes(field)) {
      throw new Error(`FAIL: check-in form is missing the "${field}" field.`);
    }
  }
  console.log("PASS: expanded readiness check-in fields (stress, motivation, lower-back, ankle) are present.");

  await athletePage.goto(`${BASE_URL}/dashboard`);
  await athletePage.waitForLoadState("networkidle").catch(() => {});
  const dashboardText = await athletePage.locator("body").innerText();
  if (!dashboardText.includes("Start Today's Workout") && !dashboardText.includes("Continue Workout")) {
    throw new Error("FAIL: dashboard hero CTA is missing.");
  }
  console.log("PASS: dashboard shows the primary Start/Continue workout CTA.");

  await athletePage.close();
  console.log("\nALL SMOKE CHECKS PASSED.");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
