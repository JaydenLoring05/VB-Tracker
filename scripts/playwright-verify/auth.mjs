export async function signUpOrSignIn(page, email, password) {
  await page.goto(`${(await import("./env.mjs")).BASE_URL}/login`);

  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL("**/dashboard", { timeout: 5000 });
    return;
  } catch {
    // Sign-in failed (account doesn't exist yet) -- switch to sign-up.
  }

  const signUpToggle = page.locator("button", { hasText: "Sign up" }).first();
  if (await signUpToggle.isVisible().catch(() => false)) {
    await signUpToggle.click();
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  }
}
