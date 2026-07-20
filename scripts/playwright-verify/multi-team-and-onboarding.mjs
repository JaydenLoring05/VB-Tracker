import { chromium } from "@playwright/test";

import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("dialog", (dialog) => dialog.accept());
page.on("pageerror", (err) => {
  throw new Error(`Uncaught page error: ${err.message}`);
});

try {
  // --- Multi-team switching (deferred live-verification from the
  // multi-team-and-programming plan, now that its migrations are applied) ---
  await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
  await page.goto(`${BASE_URL}/coach`);
  await page.waitForLoadState("networkidle").catch(() => {});

  await page.waitForSelector("text=New Team", { timeout: 10000 });
  console.log("PASS: coach dashboard loads with a 'New Team' control.");

  const newTeamName = `Verify Team ${Date.now()}`;
  await page.locator("button", { hasText: "New Team" }).click();
  await page.locator(".team-switcher-new-form input").fill(newTeamName);
  await page.locator(".team-switcher-new-form button[type='submit']").click();

  await page
    .locator(".team-switcher-select option", { hasText: newTeamName })
    .waitFor({ state: "attached", timeout: 10000 });
  const options = await page.locator(".team-switcher-select option").allInnerTexts();
  console.log(`PASS: switcher now lists the new team. Options: ${options.join(", ")}`);

  await page.locator(".team-switcher-select").selectOption({ label: newTeamName });
  await page.waitForSelector(`text=Visible to every athlete on ${newTeamName}`, { timeout: 10000 });
  console.log("PASS: switching teams updates the dashboard to the selected team.");

  await page.locator("button", { hasText: "Program" }).click();
  await page
    .locator(".program-editor")
    .or(page.locator("text=Loading program"))
    .first()
    .waitFor({ timeout: 10000 });
  console.log("PASS: Program tab renders for the new team without error.");

  // --- Onboarding flow, fresh account ---
  const onboardPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const disposableEmail = `nextrep.verify.onboard.${Date.now()}@example.com`;

  await onboardPage.goto(`${BASE_URL}/login?mode=sign-up`);
  await onboardPage.fill('input[placeholder="Name"]', "Verify Athlete");
  await onboardPage.fill('input[type="email"]', disposableEmail);
  await onboardPage.fill('input[type="password"]', "Verify-Onboard-2026!");
  await onboardPage.click('button[type="submit"]');

  await onboardPage.waitForURL("**/onboarding", { timeout: 10000 });
  console.log("PASS: fresh signup redirects to /onboarding.");

  let stepText = await onboardPage.locator(".onboarding-step-indicator").innerText();
  if (!stepText.toLowerCase().includes("step 1 of 4")) throw new Error(`FAIL: expected "Step 1 of 4", got "${stepText}"`);
  console.log(`PASS: step indicator shows "${stepText}".`);

  await onboardPage.locator("button", { hasText: "I'm an Athlete" }).click();
  stepText = await onboardPage.locator(".onboarding-step-indicator").innerText();
  if (!stepText.toLowerCase().includes("step 2 of 4")) throw new Error(`FAIL: expected "Step 2 of 4", got "${stepText}"`);

  await onboardPage.locator("select").selectOption("Middle Blocker");
  const checkedGoals = await onboardPage.locator(".onboarding-goal-option input:checked").count();
  if (checkedGoals < 1) throw new Error("FAIL: choosing a position didn't pre-check any default training goals.");
  console.log(`PASS: choosing "Middle Blocker" pre-checked ${checkedGoals} default training goal(s).`);

  await onboardPage.locator("button[type='submit']").click();
  await onboardPage.waitForSelector("text=Join your team", { timeout: 10000 });
  console.log("PASS: advanced to the team-join step.");

  await onboardPage.close();
  console.log("\nALL MULTI-TEAM + ONBOARDING CHECKS PASSED.");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
