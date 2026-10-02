import { defineConfig, devices } from "@playwright/test";

// End-to-end smoke tests. They run against a production build (`next start`)
// and only visit public pages, so they need no account and no secrets. The
// Supabase env vars only have to exist for the build; /demo never calls it.
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure"
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/demo`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
