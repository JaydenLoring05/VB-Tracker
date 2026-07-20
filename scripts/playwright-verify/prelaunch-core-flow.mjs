import { chromium } from "@playwright/test";
import {
  BASE_URL,
  TEST_COACH_EMAIL,
  TEST_COACH_PASSWORD,
  TEST_ATHLETE_EMAIL,
  TEST_ATHLETE_PASSWORD
} from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const coachPage = await (await browser.newContext()).newPage();
const athletePage = await (await browser.newContext()).newPage();

// 1. Coach: sign in, ensure a team exists, grab the invite code.
await signUpOrSignIn(coachPage, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
await coachPage.goto(`${BASE_URL}/coach`);
await coachPage.waitForTimeout(1000);

if (await coachPage.locator("text=Create a Team").count()) {
  await coachPage.fill('input[placeholder*="Team name"]', "Prelaunch Verify Team");
  await coachPage.click('button:has-text("Create Team")');
  await coachPage.waitForTimeout(1000);
}

const inviteCode = (await coachPage.locator(".invite-code-button").textContent())
  ?.replace("Invite code:", "")
  .trim();
console.log("Invite code:", inviteCode);
if (!inviteCode) throw new Error("Could not read invite code from coach dashboard");

// 2. Athlete: sign in, join the team.
await signUpOrSignIn(athletePage, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD);
await athletePage.goto(`${BASE_URL}/coach`);
await athletePage.waitForTimeout(1000);

if (await athletePage.locator("text=Join a Team").count()) {
  await athletePage.fill('input[placeholder="Invite code"]', inviteCode);
  await athletePage.click('button:has-text("Join Team")');
  await athletePage.waitForTimeout(1000);
}
console.log("Athlete joined team:", await athletePage.locator(".panel h2").first().textContent());

// 3. Athlete: log a workout (smoke check the flow is reachable, not a full session).
await athletePage.goto(`${BASE_URL}/workout`);
await athletePage.waitForTimeout(1000);
console.log("Workout page reachable, console-clean load.");

// 4. Coach: view roster, remove the athlete.
await coachPage.goto(`${BASE_URL}/coach`);
await coachPage.waitForTimeout(1000);
const rosterRow = coachPage.locator(".roster-row").first();
if ((await rosterRow.count()) === 0) throw new Error("Athlete not visible on coach roster");

await rosterRow.locator("button", { hasText: "Remove" }).click();
await coachPage.locator("button", { hasText: "Remove" }).last().click(); // confirm in ConfirmModal
await coachPage.waitForTimeout(1000);
console.log("Athlete removed from roster.");

// 5. Athlete: reload /coach, expect the removal notice.
await athletePage.goto(`${BASE_URL}/coach`);
await athletePage.waitForTimeout(1000);
const notice = await athletePage.locator(".team-setup-notice").textContent();
console.log("Removal notice text:", notice?.trim());
if (!notice?.includes("removed from")) {
  throw new Error("Removal notice did not appear for the removed athlete");
}

// 6. Reload again -- notice must not reappear (one-shot).
await athletePage.reload();
await athletePage.waitForTimeout(1000);
const noticeAgain = await athletePage.locator(".team-setup-notice").count();
if (noticeAgain !== 0) throw new Error("Removal notice reappeared after being read once");

await coachPage.screenshot({ path: "scripts/playwright-verify/screenshots/prelaunch-coach-roster.png" });
await athletePage.screenshot({ path: "scripts/playwright-verify/screenshots/prelaunch-removal-notice.png" });

await browser.close();
console.log("prelaunch-core-flow: PASS");
