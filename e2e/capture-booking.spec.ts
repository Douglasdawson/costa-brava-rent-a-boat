import { test, expect } from "@playwright/test";
import { mark, publicApi, adminApi, findBookingByPhone } from "./helpers";

// Boat booking is a 2-call flow: /api/quote (hold) → /api/bookings/submit-request
// (hold → requested). Captured via API (the 4-step wizard UI is exercised as a
// mount smoke below; full UI automation of it is intentionally out of scope).
test("boat booking: quote → submit-request captured", async ({ playwright }) => {
  const m = mark("BK");
  const ctx = await publicApi(playwright);

  // Future date in-season, within 9-19 Madrid; randomize day to avoid hold clashes.
  const d = new Date(Date.now() + (30 + Math.floor(Math.random() * 40)) * 86400000);
  const ymd = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  const quote = await ctx.post("/api/quote", {
    data: {
      boatId: "solar-450",
      startTime: `${ymd}T10:00:00+02:00`,
      endTime: `${ymd}T12:00:00+02:00`,
      numberOfPeople: 2,
    },
  });
  expect(quote.status(), await quote.text()).toBe(201);
  const { holdId } = await quote.json();
  expect(holdId, "holdId returned").toBeTruthy();

  const submit = await ctx.post("/api/bookings/submit-request", {
    data: {
      holdId,
      termsAccepted: true,
      customerName: m.firstName,
      customerSurname: "E2E",
      customerEmail: m.email,
      customerPhone: `+34${m.phoneNumber}`,
      customerNationality: "Española",
      language: "es",
    },
  });
  expect(submit.ok(), await submit.text()).toBeTruthy();

  const admin = await adminApi(playwright);
  const booking = await findBookingByPhone(admin, m.phoneNumber, "requested");
  expect(booking, "boat booking captured in CRM").toBeTruthy();
  expect((booking as { source: string }).source).toBe("web");
  await ctx.dispose();
  await admin.dispose();
});

test("booking wizard (Hero) mounts", async ({ page }) => {
  await page.goto("/es/");
  await page.getByTestId("button-hero-cta").click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
