import { chromium } from "@playwright/test";
import { BASE_URL } from "./env.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();

const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});

await page.goto(BASE_URL);

const headline = await page.locator("h1").first().textContent();
console.log("Hero headline:", headline?.trim());
if (!headline?.includes("Know who's ready")) {
  throw new Error("Hero headline did not update as expected");
}

const pricingLead = await page.locator(".pricing-toggle").locator("..").locator(".landing-section-lead").textContent();
console.log("Pricing lead:", pricingLead?.trim());
if (!pricingLead?.includes("90-day pilot")) {
  throw new Error("Pricing copy did not update as expected");
}

const pilotSection = await page.locator("text=Founding Team Pilot").count();
if (pilotSection === 0) throw new Error("Founding Team Pilot section not found");

const contactHref = await page.locator('a[href^="mailto:jaydenloring05@gmail.com"]').count();
if (contactHref === 0) throw new Error("No mailto link to the new contact email found");

await page.locator('footer a[href="/privacy"]').click();
await page.waitForURL("**/privacy");
console.log("Privacy page title:", await page.locator("h1").first().textContent());

await page.goto(`${BASE_URL}/terms`);
console.log("Terms page title:", await page.locator("h1").first().textContent());

await page.goto(`${BASE_URL}/login`);
await page.locator(".auth-back-link").click();
await page.waitForURL(BASE_URL + "/");
console.log("Back-to-landing link works.");

await page.screenshot({ path: "scripts/playwright-verify/screenshots/prelaunch-copy-legal.png", fullPage: true });

console.log("Console errors observed:", consoleErrors.length === 0 ? "none" : consoleErrors);
if (consoleErrors.length > 0) throw new Error("Console errors observed during copy/legal verification");

await browser.close();
console.log("prelaunch-copy-legal: PASS");
