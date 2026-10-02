// Captures the README screenshots from the public /demo page (sample data
// only, no real names or emails). Run against any build of the app:
//
//   npm run build && npx next start -p 3100
//   BASE_URL=http://localhost:3100 node scripts/capture-readme-screenshots.mjs
//
// Output goes to docs/screenshots/. JPEG keeps each file under 500 KB.
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "docs/screenshots";
const viewport = { width: 1280, height: 860 };

const browser = await chromium.launch();
const context = await browser.newContext({ viewport, deviceScaleFactor: 1, colorScheme: "dark" });
await context.addInitScript(() => window.localStorage.setItem("nextrep-demo-tour-dismissed", "1"));
const page = await context.newPage();

async function shot(name, options = {}) {
  await page.waitForTimeout(600); // let entrance animations settle
  await page.screenshot({ path: `${OUT}/${name}.jpg`, type: "jpeg", quality: 82, ...options });
  console.log(`saved ${OUT}/${name}.jpg`);
}

try {
  await page.goto(`${BASE_URL}/demo`);
  await page.getByRole("heading", { name: "Attention Center" }).waitFor();
  await shot("coach-dashboard");

  await page.getByRole("button", { name: "Maya Chen", exact: true }).click();
  // A native <dialog> in the top layer; wait on its open flag.
  await page.waitForFunction(() => document.querySelector("dialog.modal-overlay")?.open === true);
  await page.waitForTimeout(1200); // the chart bundle loads lazily
  await shot("athlete-drilldown");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Athlete view" }).click();
  await page.getByRole("heading", { level: 1, name: "Athlete view" }).waitFor();
  await shot("athlete-view");

  // The Workout Mode and Film room demo tabs need #39 (feat/demo-workout-and-film).
  await page.getByRole("button", { name: "Workout Mode" }).click();
  await page.getByPlaceholder("Weight").fill("160");
  await page.getByPlaceholder("Reps").fill("5");
  await page.getByRole("button", { name: /Log Set/ }).click();
  await page.waitForTimeout(3000); // PR badge pops and the rest timer starts
  await shot("workout-mode");

  await page.getByRole("button", { name: "Film room" }).click();
  await page.locator('iframe[src*="youtube"]').waitFor();
  await page.waitForTimeout(2500); // let the embed finish loading
  await page.getByRole("button", { name: "Pass", exact: true }).first().click();
  // Scroll the tag panel into view, just below the video.
  await page.evaluate(() => {
    const iframe = document.querySelector(".film-viewer-panel iframe");
    window.scrollBy(0, iframe.getBoundingClientRect().bottom + 12);
  });
  await shot("film-room", { clip: { x: 548, y: 64, width: 656, height: 796 } });
} finally {
  await browser.close();
}
