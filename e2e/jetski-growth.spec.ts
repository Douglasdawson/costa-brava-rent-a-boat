import { test, expect } from "@playwright/test";

// Covers the SEO/CRO additions: jet ski hub page + visible trust signals.

test("jet ski hub renders and links to both activities (ES)", async ({ page }) => {
  const resp = await page.goto("/es/alquiler-moto-de-agua-blanes");
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.locator("h1")).toContainText(/motos? de agua/i);
  await expect(
    page.locator('a[href*="circuito-jet-ski-blanes"]').first(),
  ).toBeVisible();
  await expect(
    page.locator('a[href*="excursion-jet-ski-blanes-tossa"]').first(),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/partner|reventa/i);
});

test("jet ski hub renders (EN)", async ({ page }) => {
  const resp = await page.goto("/en/jet-ski-rental-blanes");
  expect(resp?.status()).toBeLessThan(400);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/partner|reventa/i);
});

test("jet ski landing shows a visible rating (TrustBadges)", async ({ page }) => {
  await page.goto("/es/circuito-jet-ski-blanes");
  // TrustBadges renders "4,8 en Google" — rating is now visible, not only JSON-LD.
  await expect(page.getByText(/4[.,]8/).first()).toBeVisible();
});

test("jet ski landing offers a direct-WhatsApp escape in the modal", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.open = () => null;
  });
  await page.goto("/es/circuito-jet-ski-blanes");
  await page.getByRole("button", { name: "Solicitar" }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText(/Prefiero escribir por WhatsApp/i),
  ).toBeVisible();
});
