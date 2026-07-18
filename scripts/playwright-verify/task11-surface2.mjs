import { chromium } from "@playwright/test";

import { BASE_URL, TEST_COACH_EMAIL, TEST_COACH_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await signUpOrSignIn(page, TEST_COACH_EMAIL, TEST_COACH_PASSWORD);

  const pages = ["library", "stats", "coach", "calendar"];
  for (const p of pages) {
    await page.goto(`${BASE_URL}/${p}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({
      path: `scripts/playwright-verify/screenshots/task11-${p}.png`,
      fullPage: true
    });
    console.log(`Captured ${p}`);
  }

  console.log("PASS: surface-2 token spot-check screenshots captured");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
