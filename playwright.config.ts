import { defineConfig, devices } from "@playwright/test";

// Local e2e suite. Targets the dev server on :4000 backed by the local Postgres
// (costabrava_dev) via USE_LOCAL_PG. Reuses an already-running server if present.
const PORT = Number(process.env.E2E_PORT || 4000);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // Serial: the capture flows hit per-IP rate limits (booking-inquiries 5/h,
  // login 5/15min). One worker keeps the whole run under those ceilings.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Logs in once and persists the admin cookie to e2e/.auth/admin.json so the
    // rest of the suite reuses it (avoids the 5-logins/15min rate limit).
    { name: "setup", testMatch: /global\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command:
      "USE_LOCAL_PG=1 DATABASE_URL=postgresql://macbookpro@localhost:5432/costabrava_dev PORT=4000 NODE_ENV=development npx tsx server/index.ts",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
