import { chromium } from "@playwright/test";

import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  // The landing page (src/app/page.tsx) is deliberately out of scope for the
  // 2026-07-20 NextRep rebrand pass -- it still says "ElevateOS" on purpose,
  // pending a separate follow-up prompt. Don't flip this assertion until
  // that follow-up lands.
  await page.goto(`${BASE_URL}/`);
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/task19-landing.png", fullPage: true });
  const landingText = await page.locator("body").innerText();
  if (!landingText.includes("ElevateOS")) throw new Error("Landing page missing expected (still-unrebranded) ElevateOS text");
  if (landingText.includes("Volleyball Tracker")) throw new Error("Landing page still has Volleyball Tracker text");

  await page.goto(`${BASE_URL}/login`);
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/task19-login.png", fullPage: true });
  const loginText = await page.locator("body").innerText();
  if (!loginText.includes("NextRep")) throw new Error("Login page missing NextRep text");
  if (loginText.includes("ElevateOS")) throw new Error("Login page still has ElevateOS text");
  if (loginText.includes("Volleyball Tracker")) throw new Error("Login page still has Volleyball Tracker text");

  await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/task19-dashboard.png", fullPage: true });
  const dashboardText = await page.locator("body").innerText();
  if (dashboardText.includes("Volleyball Tracker")) throw new Error("Dashboard still has Volleyball Tracker text");
  if (dashboardText.includes("V19")) throw new Error("Dashboard still has the internal V19 version label");

  console.log("PASS: NextRep rebrand verified on /login and /dashboard; landing page correctly left unrebranded");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
