// Temporary verification script for P2 fixes (BoatClubModal trigger + FAB stack).
// Run: node scripts/verify-p2-popup-fab.mjs
import { chromium } from "playwright";

const BASE = "http://localhost:5181";
const results = [];
const log = (name, pass, detail = "") => {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} - ${name}${detail ? " :: " + detail : ""}`);
};

const POPUP_SEL = '[aria-labelledby="boat-club-promo-title"]';

async function freshPage(browser, url) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  // Dismiss cookie banner if present so overlay guards don't block the popup
  try {
    const btn = page.locator("button", { hasText: /aceptar|accept/i }).first();
    if (await btn.isVisible({ timeout: 1500 })) await btn.click();
  } catch {
    /* no cookie banner */
  }
  return { ctx, page };
}

const browser = await chromium.launch();

// (a) /es/ — popup must NOT appear early (no scroll, < 25s)
{
  const { ctx, page } = await freshPage(browser, `${BASE}/es/`);
  await page.waitForTimeout(8000); // old trigger was 2.5s (+retries each 1.5s)
  const visible = await page.locator(POPUP_SEL).count();
  log("(a) /es/ popup NOT shown before scroll and before 25s", visible === 0);
  await ctx.close();
}

// (b) /es/ — popup appears after scrolling 50%
{
  const { ctx, page } = await freshPage(browser, `${BASE}/es/`);
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, max * 0.5);
  });
  let shown = false;
  try {
    await page.waitForSelector(POPUP_SEL, { timeout: 8000 });
    shown = true;
  } catch {
    /* not shown */
  }
  log("(b) /es/ popup shown after 50% scroll", shown);
  if (shown) {
    await page.waitForTimeout(1200); // let the card scale-in animation settle
    const closeBox = await page
      .locator(`${POPUP_SEL} button[aria-label]`)
      .first()
      .boundingBox();
    const dismissBox = await page
      .locator(POPUP_SEL)
      .locator("button")
      .last()
      .boundingBox();
    log(
      "(b2) tap targets >= 44px (X y 'Ahora no')",
      !!closeBox && closeBox.height >= 44 && closeBox.width >= 44 &&
        !!dismissBox && dismissBox.height >= 44,
      `X=${closeBox?.width}x${closeBox?.height}, dismiss h=${dismissBox?.height}`,
    );
  }
  await ctx.close();
}

// (c) /es/barco/solar-450 — popup never appears + FAB hides when sticky CTA visible
{
  const { ctx, page } = await freshPage(browser, `${BASE}/es/barco/solar-450`);
  const fab = page.locator('a[aria-label="Contactar por WhatsApp"]');
  await fab.waitFor({ state: "visible", timeout: 10000 });
  log("(c1) FAB visible at top of boat detail (sticky hidden)", await fab.isVisible());

  // Scroll enough that sticky CTA shows (>300px) and engagement scroll passes 40%
  await page.evaluate(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.max(600, max * 0.6));
  });
  await page.waitForTimeout(1500); // throttled scroll handler (250ms) + transition
  const stickyVisible = await page.evaluate(() => {
    const el = document.querySelector("div.fixed.bottom-0.z-40");
    if (!el) return false;
    return getComputedStyle(el).opacity === "1";
  });
  const fabVisible = await fab.isVisible();
  log("(c2) sticky bottom CTA visible after scroll", stickyVisible);
  log("(c3) FAB hidden on mobile while sticky CTA visible", !fabVisible);

  // Wait past old 2.5s trigger window with scroll engagement satisfied
  await page.waitForTimeout(6000);
  const popupCount = await page.locator(POPUP_SEL).count();
  log("(c4) popup NEVER shown on /es/barco/solar-450", popupCount === 0);
  await ctx.close();
}

// (d) scroll-to-top clickable without overlap on /es/
{
  const { ctx, page } = await freshPage(browser, `${BASE}/es/`);
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(1000);
  const stt = page.locator('button[aria-label*="rriba" i], button[aria-label*="top" i]').first();
  const sttBox = await stt.boundingBox();
  const fabBox = await page
    .locator('a[aria-label="Contactar por WhatsApp"]')
    .boundingBox();
  let noOverlap = false;
  if (sttBox && fabBox) {
    noOverlap = sttBox.y + sttBox.height <= fabBox.y; // STT strictly above FAB
  }
  log(
    "(d1) scroll-to-top stacked above FAB without overlap",
    noOverlap,
    `stt bottom=${sttBox ? Math.round(sttBox.y + sttBox.height) : "?"}, fab top=${fabBox ? Math.round(fabBox.y) : "?"}`,
  );
  // Click at the center of scroll-to-top and confirm the page scrolls up
  if (sttBox) {
    await page.mouse.click(sttBox.x + sttBox.width / 2, sttBox.y + sttBox.height / 2);
    await page.waitForTimeout(1800);
    const y = await page.evaluate(() => window.scrollY);
    log("(d2) scroll-to-top click works (no element intercepts)", y < 50, `scrollY=${y}`);
  } else {
    log("(d2) scroll-to-top click works", false, "button not found");
  }
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
