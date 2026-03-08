import { defineConfig, devices } from "@playwright/test";

const shouldUseWebServer = !process.env.PW_NO_WEBSERVER;
const webPort = Number(process.env.E2E_WEB_PORT || 4173);
const webBaseUrl = `http://localhost:${webPort}`;

export default defineConfig({
  testDir: "./apps/web/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: webBaseUrl,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: shouldUseWebServer
    ? {
      command: `pnpm --filter web exec vite --port ${webPort} --strictPort`,
      url: `${webBaseUrl}/login`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    }
    : undefined,
});
