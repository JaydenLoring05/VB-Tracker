import { chromium } from "@playwright/test";

import { BASE_URL } from "./env.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
page.on("pageerror", (err) => {
  throw new Error(`Uncaught page error: ${err.message}`);
});

try {
  await page.goto(BASE_URL);
  await page.waitForLoadState("networkidle").catch(() => {});

  // Some headings are styled with text-transform: uppercase, which
  // innerText() reflects as rendered (not the literal DOM casing) -- match
  // case-insensitively throughout.
  const rawText = await page.locator("body").innerText();
  const text = rawText.toLowerCase();

  if (text.includes("elevateos")) throw new Error("FAIL: landing page still says ElevateOS.");
  console.log("PASS: no ElevateOS text.");

  const requiredStrings = [
    "Now accepting volleyball teams for our free 30-day founding-team pilot",
    "Know who's ready. Know who needs attention.",
    "Start Free Team Pilot",
    "View Demo Dashboard",
    "One system. Two connected experiences.",
    "Stop searching through data. See what matters today.",
    "How workouts work",
    "Built around the demands of volleyball",
    "Jump Development",
    "Shoulder Durability",
    "Knee & Landing Capacity",
    "Season-Aware Programming",
    "How it works",
    "Become a Founding Team",
    "Jayden Loring",
    "Pricing",
    "Founding Pilot",
    "Frequently asked questions",
    "Is NextRep medical software?",
    "Give every athlete a clear plan"
  ];

  for (const str of requiredStrings) {
    if (!text.includes(str.toLowerCase())) throw new Error(`FAIL: missing expected copy: "${str}"`);
  }
  console.log(`PASS: all ${requiredStrings.length} expected section strings present.`);

  // Attention Center demo renders real sample rows.
  await page.locator("#attention-center-demo").scrollIntoViewIfNeeded();
  const attentionText = (
    await page.locator("#attention-center-demo .attention-center").innerText()
  ).toLowerCase();
  if (!attentionText.includes("maya chen") || !attentionText.includes("check in")) {
    throw new Error("FAIL: Attention Center demo doesn't show expected sample row.");
  }
  console.log("PASS: real AttentionCenter component renders with sample data.");

  // Dashboard mock roster renders.
  const rosterText = (await page.locator(".landing-dashboard-mock").innerText()).toLowerCase();
  if (!rosterText.includes("ava thompson") || !rosterText.includes("elite")) {
    throw new Error("FAIL: dashboard roster mock missing expected sample content.");
  }
  console.log("PASS: dashboard roster mock renders sample data.");

  // FAQ accordion opens.
  const firstFaq = page.locator(".landing-faq-item").first();
  await firstFaq.locator("summary").click();
  const isOpen = await firstFaq.getAttribute("open");
  if (isOpen === null) throw new Error("FAIL: FAQ item didn't open on click.");
  console.log("PASS: FAQ accordion opens on click.");

  // Nav anchors resolve to real sections.
  for (const anchor of ["#product-preview", "#for-coaches", "#for-athletes", "#pricing", "#founding-pilot"]) {
    const count = await page.locator(anchor).count();
    if (count === 0) throw new Error(`FAIL: anchor target "${anchor}" doesn't exist on the page.`);
  }
  console.log("PASS: all nav/CTA anchor targets exist.");

  // Pricing shows the new 3-tier model.
  const pricingText = (await page.locator("#pricing").innerText()).toLowerCase();
  for (const str of ["Founding Pilot", "Team", "$29", "Program", "$49"]) {
    if (!pricingText.includes(str.toLowerCase())) throw new Error(`FAIL: pricing section missing "${str}".`);
  }
  console.log("PASS: pricing shows Founding Pilot / Team ($29) / Program ($49).");

  await page.screenshot({ path: "scripts/playwright-verify/screenshots/landing-page-rebuild.png", fullPage: true });

  console.log("\nALL LANDING PAGE CHECKS PASSED.");
} catch (err) {
  console.error("FAIL:", err);
  process.exitCode = 1;
} finally {
  await browser.close();
}
