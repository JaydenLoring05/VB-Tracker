import { chromium } from "@playwright/test";
import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
await page.goto(`${BASE_URL}/coach`);
await page.waitForTimeout(1000);
await page.screenshot({ path: "scripts/playwright-verify/screenshots/coach-page.png" });

console.log("Console errors observed:", consoleErrors.length === 0 ? "none" : consoleErrors);
console.log(
  "Screenshot taken -- manually confirm no native browser confirm() dialog fires when clicking Remove on a roster row, and that a themed modal appears instead."
);
console.log(
  "Full click-through of the ConfirmModal (open, cancel, confirm) is verified in Task 9's script once TEST_COACH_EMAIL has a team with a roster."
);

await browser.close();
