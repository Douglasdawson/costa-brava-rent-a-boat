import { test, expect } from "@playwright/test";
import { mark, adminApi, findInquiryByPhone, findBookingByPhone } from "./helpers";

// Real browser journey: open the jet ski modal, submit, and verify the request
// landed in BOTH the CRM Inquiries (whatsapp_inquiries) and Bookings (requested).
test("jet ski request → inquiry + booking captured", async ({
  page,
  playwright,
}) => {
  const m = mark("JS");

  // Neutralize the WhatsApp popup (openWhatsApp calls window.open).
  await page.addInitScript(() => {
    window.open = () => null;
  });

  await page.goto("/es/circuito-jet-ski-blanes");
  await page.getByRole("button", { name: "Solicitar" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.locator('input[name="jetski-slot"]').first().check();
  await dialog.locator("#js-firstname").fill(m.firstName);
  await dialog.locator("#js-lastname").fill("E2E");
  await dialog.locator("#js-phone").fill(m.phoneNumber);
  await dialog.locator("#js-email").fill(m.email);

  const inqResp = page.waitForResponse(
    (r) =>
      r.url().includes("/api/booking-inquiries") &&
      r.request().method() === "POST",
  );
  const bkResp = page.waitForResponse(
    (r) =>
      r.url().includes("/api/jetski-booking") &&
      r.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: /Enviar solicitud|Enviando/ }).click();

  expect((await inqResp).status(), "inquiry POST").toBe(201);
  expect((await bkResp).status(), "jetski booking POST").toBe(201);
  await expect(dialog.getByText(/Pulsa enviar en WhatsApp/i)).toBeVisible();

  // Verify in admin.
  const ctx = await adminApi(playwright);
  const inquiry = await findInquiryByPhone(ctx, m.phoneNumber);
  expect(inquiry, "inquiry captured in CRM").toBeTruthy();
  expect((inquiry as { source: string }).source).toBe("jetski");

  const booking = await findBookingByPhone(ctx, m.phoneNumber, "requested");
  expect(booking, "booking mirror captured in CRM").toBeTruthy();
  expect((booking as { source: string }).source).toBe("jetski");
  // Partner attribution lives only in the inquiry's internal notes, never the booking.
  expect((booking as { notes?: string }).notes || "").not.toMatch(
    /partner|reventa/i,
  );
  await ctx.dispose();
});
