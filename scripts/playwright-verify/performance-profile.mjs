import { chromium } from "@playwright/test";
import { BASE_URL, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD } from "./env.mjs";
import { signUpOrSignIn } from "./auth.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

page.on("console", (msg) => console.log("BROWSER:", msg.type(), msg.text()));
page.on("response", async (res) => {
  if (res.url().includes("performance_profiles")) {
    console.log("RESPONSE", res.request().method(), res.url(), res.status());
    try {
      console.log("BODY", await res.text());
    } catch {}
  }
});

await signUpOrSignIn(page, TEST_ATHLETE_EMAIL, TEST_ATHLETE_PASSWORD);

await page.goto(`${BASE_URL}/stats`);
await page.waitForSelector("text=Performance Profile", { timeout: 10000 });

const panel = page.locator(".panel", { hasText: "Performance Profile" });

await panel.locator("select").selectOption({ label: "Outside Hitter" });
await panel.locator('label:has-text("Standing Reach (in)") input').fill("95");
await panel.locator('label:has-text("Approach Touch (in)") input').fill("110");

console.log("Before save - position:", await panel.locator("select").inputValue());
console.log("Before save - standing reach:", await panel.locator('label:has-text("Standing Reach (in)") input').inputValue());

await panel.locator('button:has-text("Save Profile")').click();
await page.waitForTimeout(1500);

await page.reload();
await page.waitForSelector("text=Performance Profile", { timeout: 10000 });

const panelAfterReload = page.locator(".panel", { hasText: "Performance Profile" });

const positionValue = await panelAfterReload.locator("select").inputValue();
const standingReach = await panelAfterReload.locator('label:has-text("Standing Reach (in)") input').inputValue();
const approachTouch = await panelAfterReload.locator('label:has-text("Approach Touch (in)") input').inputValue();
console.log("Panel HTML:", await panelAfterReload.innerHTML());
const approachVerticalText = await panelAfterReload.locator("text=/Approach vertical/").textContent();

console.log("Position:", positionValue);
console.log("Standing Reach:", standingReach);
console.log("Approach Touch:", approachTouch);
console.log("Approach vertical text:", approachVerticalText);

const pass =
  positionValue === "Outside Hitter" &&
  standingReach === "95" &&
  approachTouch === "110" &&
  approachVerticalText != null &&
  approachVerticalText.includes('Approach vertical: 15.0"');

if (pass) {
  console.log("PASS: performance profile values persisted and approach vertical calculated correctly");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/performance-profile-pass.png" });
} else {
  console.error("FAIL: performance profile did not persist or approach vertical incorrect");
  await page.screenshot({ path: "scripts/playwright-verify/screenshots/performance-profile-fail.png" });
  process.exitCode = 1;
}

await browser.close();
