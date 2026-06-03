import { test, expect } from "@playwright/test";

// Smoke of representative public pages + the jet ski additions. Not exhaustive
// (40 pages × 8 langs is infeasible/flaky); covers the high-value surfaces.

test("home ES: fleet heading + jet ski card, no crash", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  await page.goto("/es/");
  await expect(
    page.getByRole("heading", { name: "Elige tu plan en el mar" }),
  ).toBeVisible();
  // Jet ski now appears in the fleet grid.
  await expect(page.getByText("Circuito en Jet Ski").first()).toBeVisible();

  expect(pageErrors, pageErrors.join("\n")).toHaveLength(0);
});

test("home EN: localized fleet heading", async ({ page }) => {
  await page.goto("/en/");
  await expect(
    page.getByRole("heading", { name: "Choose your day on the water" }),
  ).toBeVisible();
});

test("jet ski landings render and never expose 'partner'", async ({ page }) => {
  for (const slug of [
    "circuito-jet-ski-blanes",
    "excursion-jet-ski-blanes-tossa",
  ]) {
    const resp = await page.goto(`/es/${slug}`);
    expect(resp?.status(), slug).toBeLessThan(400);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/partner|reventa/i);
  }
});

test("representative pages load", async ({ page }) => {
  const slugs = [
    "precios",
    "faq",
    "tarjetas-regalo",
    "salidas-compartidas",
    "alquiler-barcos-blanes",
    "excursion-snorkel-barco-blanes",
  ];
  for (const slug of slugs) {
    const resp = await page.goto(`/es/${slug}`);
    expect(resp?.status(), slug).toBeLessThan(400);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  }
});
