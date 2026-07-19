import { chromium } from "@playwright/test";

import { BASE_URL, TEST_COACH_EMAIL } from "./env.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', TEST_COACH_EMAIL);

  const forgotButton = page.locator("button", { hasText: "Forgot password?" });
  await forgotButton.waitFor({ state: "visible", timeout: 5000 });
  await forgotButton.click();

  await page.waitForSelector("text=Check your email", { timeout: 10000 });

  console.log("PASS: forgot-password request flow shows confirmation message");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
