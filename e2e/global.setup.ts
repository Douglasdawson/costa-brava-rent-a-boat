import { test as setup, expect } from "@playwright/test";
import { ADMIN_PIN, AUTH_FILE, BASE_URL } from "./helpers";

// Logs in once via the PIN endpoint and persists the admin_token cookie so the
// rest of the suite reuses it (one login instead of N → stays under 5/15min).
setup("authenticate admin", async ({ request }) => {
  const res = await request.post("/api/admin/login", {
    data: { pin: ADMIN_PIN },
    headers: { Origin: BASE_URL },
  });
  expect(res.ok(), `login ${res.status()}`).toBeTruthy();
  const body = await res.json();
  expect(body.success).toBeTruthy();
  await request.storageState({ path: AUTH_FILE });
});
