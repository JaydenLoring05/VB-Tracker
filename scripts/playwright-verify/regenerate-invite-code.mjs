import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();
await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
await page.goto(`${BASE_URL}/coach`);

// Create a team if this account doesn't have one yet.
const createTeamButton = page.locator("button", { hasText: "Create" }).first();
if (await createTeamButton.isVisible().catch(() => false)) {
  await page.fill('input[placeholder*="team" i]', "Verify Team");
  await createTeamButton.click();
  await page.waitForTimeout(1000);
}

const codeButtonBefore = await page.textContent(".invite-code-button");
await page.click("button:has-text('Regenerate code')");
await page.waitForTimeout(1000);
const codeButtonAfter = await page.textContent(".invite-code-button");

if (codeButtonBefore !== codeButtonAfter) {
  console.log("PASS: invite code changed after regenerating", { codeButtonBefore, codeButtonAfter });
} else {
  console.error("FAIL: invite code did not change", { codeButtonBefore, codeButtonAfter });
  process.exitCode = 1;
}

await page.screenshot({ path: "scripts/playwright-verify/screenshots/regenerate-invite-code.png" });

await browser.close();
