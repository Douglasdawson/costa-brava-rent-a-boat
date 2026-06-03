import { test, expect } from "@playwright/test";
import { ADMIN_PIN, adminApi } from "./helpers";

// UI: PIN login redirects into the CRM.
test("admin UI login redirects to CRM", async ({ page }) => {
  await page.goto("/es/login");
  await page.locator("#pin").fill(ADMIN_PIN);
  await page.getByTestId("button-admin-login").click();
  await page.waitForURL(/\/crm/);
  // No longer on the login form.
  await expect(page.getByTestId("input-admin-pin")).toHaveCount(0);
});

// API: the data surfaces the CRM tabs consume respond and have the right shape.
test("admin API surfaces respond with expected shapes", async ({
  playwright,
}) => {
  const ctx = await adminApi(playwright);

  const stats = await ctx.get("/api/admin/stats");
  expect(stats.ok(), `stats ${stats.status()}`).toBeTruthy();
  expect(await stats.json()).toHaveProperty("totalBoats");

  for (const url of [
    "/api/admin/booking-inquiries?limit=5",
    "/api/admin/bookings?limit=5",
  ]) {
    const res = await ctx.get(url);
    expect(res.ok(), `${url} → ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body, url).toHaveProperty("data");
    expect(Array.isArray(body.data), `${url} data is array`).toBeTruthy();
    expect(body).toHaveProperty("total");
  }

  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 60 * 86400000)
    .toISOString()
    .slice(0, 10);
  const cal = await ctx.get(
    `/api/admin/bookings/calendar?startDate=${start}&endDate=${end}`,
  );
  expect(cal.ok(), `calendar ${cal.status()}`).toBeTruthy();
  expect(Array.isArray(await cal.json()), "calendar is array").toBeTruthy();

  const fleet = await ctx.get("/api/admin/boats");
  expect(fleet.ok(), `boats ${fleet.status()}`).toBeTruthy();

  await ctx.dispose();
});
