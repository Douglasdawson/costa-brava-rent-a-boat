import { describe, it, expect } from "vitest";
import {
  computeCartTotals,
  countPacks,
  DEFAULT_SHOP_OFFERS,
  SHOP_PRODUCTS,
  getShopVariant,
} from "./shopData";

const TEE = 2500;
const TOTE = 1000;

const tee = (sku = "tee-navy-M", quantity = 1) => ({ sku, quantity, unitPriceCents: TEE });
const tote = (quantity = 1) => ({ sku: "tote-royal", quantity, unitPriceCents: TOTE });

describe("countPacks", () => {
  it("pairs tees with totes, never counting the surplus of either", () => {
    expect(countPacks([tee(), tote()])).toBe(1);
    expect(countPacks([tee("tee-navy-M", 2), tote()])).toBe(1);
    expect(countPacks([tee("tee-navy-M", 2), tote(3)])).toBe(2);
    expect(countPacks([tee()])).toBe(0);
    expect(countPacks([tote()])).toBe(0);
  });

  it("counts tees of different colours and sizes towards the same pack", () => {
    expect(countPacks([tee("tee-navy-M"), tee("tee-butter-L"), tote(2)])).toBe(2);
  });

  it("ignores unknown SKUs instead of throwing", () => {
    expect(countPacks([{ sku: "nope", quantity: 9 }, tote()])).toBe(0);
  });
});

describe("computeCartTotals", () => {
  it("charges full price with no pack", () => {
    const t = computeCartTotals([tee()]);
    expect(t.subtotalCents).toBe(2500);
    expect(t.discountCents).toBe(0);
    expect(t.payableCents).toBe(2500);
    expect(t.shippingCents).toBe(DEFAULT_SHOP_OFFERS.shippingFlatCents);
    expect(t.toFreeShippingCents).toBe(500);
  });

  it("discounts one pack and lands exactly on free shipping", () => {
    const t = computeCartTotals([tee(), tote()]);
    expect(t.subtotalCents).toBe(3500);
    expect(t.packs).toBe(1);
    expect(t.discountCents).toBe(500);
    expect(t.payableCents).toBe(3000);
    expect(t.shippingCents).toBe(0);
    expect(t.toFreeShippingCents).toBe(0);
  });

  it("scales the discount per pair", () => {
    const t = computeCartTotals([tee("tee-navy-M", 2), tote(2)]);
    expect(t.packs).toBe(2);
    expect(t.discountCents).toBe(1000);
    expect(t.payableCents).toBe(6000);
  });

  it("never discounts below zero", () => {
    const t = computeCartTotals([
      { sku: "tee-navy-M", quantity: 1, unitPriceCents: 100 },
      { sku: "tote-royal", quantity: 1, unitPriceCents: 100 },
    ]);
    expect(t.discountCents).toBe(200);
    expect(t.payableCents).toBe(0);
  });

  it("reports an empty cart as empty, not as one step from free shipping", () => {
    const t = computeCartTotals([]);
    expect(t.subtotalCents).toBe(0);
    expect(t.toFreeShippingCents).toBe(0);
  });

  it("honours overridden offer values", () => {
    const t = computeCartTotals([tee(), tote()], {
      shippingFlatCents: 700,
      packDiscountCents: 0,
      freeShippingMinCents: 9999,
    });
    expect(t.discountCents).toBe(0);
    expect(t.shippingCents).toBe(700);
    expect(t.toFreeShippingCents).toBe(6499);
  });
});

describe("catalogue images", () => {
  it("points every gallery shot at a distinct path", () => {
    for (const product of SHOP_PRODUCTS) {
      for (const color of product.colors) {
        const shots = product.images[color]?.shots ?? [];
        expect(shots.length).toBeGreaterThan(0);
        expect(new Set(shots.map((s) => s.src)).size).toBe(shots.length);
      }
    }
  });

  it("resolves every declared variant SKU", () => {
    for (const product of SHOP_PRODUCTS) {
      for (const variant of product.variants) {
        expect(getShopVariant(variant.sku)?.product.id).toBe(product.id);
      }
    }
  });
});
