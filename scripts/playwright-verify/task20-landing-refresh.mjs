import { chromium } from "@playwright/test";

import { BASE_URL } from "./env.mjs";

const browser = await chromium.launch();

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto(`${BASE_URL}/`);
  await desktop.waitForLoadState("networkidle").catch(() => {});
  await desktop.screenshot({
    path: "scripts/playwright-verify/screenshots/task20-landing-desktop.png",
    fullPage: true
  });
  await desktop.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`${BASE_URL}/`);
  await mobile.waitForLoadState("networkidle").catch(() => {});
  await mobile.screenshot({
    path: "scripts/playwright-verify/screenshots/task20-landing-mobile.png",
    fullPage: true
  });
  await mobile.close();

  console.log("PASS: landing page desktop and mobile screenshots captured");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
