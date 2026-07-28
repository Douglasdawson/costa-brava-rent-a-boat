import { describe, it, expect } from "vitest";
import { crmArticleForSku } from "./crmDamarMerch";
import { SHOP_PRODUCTS } from "@shared/shopData";

describe("crmArticleForSku", () => {
  it("maps every catalogue SKU to a CRM article", () => {
    // Guards the drift that breaks the sync silently: a new colour or size added
    // to shopData.ts with no CRM_ARTICLE_NAME entry would stop syncing its stock.
    const unmapped = SHOP_PRODUCTS.flatMap((p) => p.variants)
      .map((v) => v.sku)
      .filter((sku) => !crmArticleForSku(sku));
    expect(unmapped).toEqual([]);
  });

  it("uses the CRM names and the one-size label", () => {
    expect(crmArticleForSku("tee-butter-S")).toEqual({
      nombre: "Camiseta Oversize Boxy AM",
      talla: "S",
    });
    expect(crmArticleForSku("tee-navy-XL")).toEqual({
      nombre: "Camiseta Oversize Boxy DN",
      talla: "XL",
    });
    expect(crmArticleForSku("tote-royal")).toEqual({
      nombre: "Bolsa Mountain RB",
      talla: "Única",
    });
  });

  it("returns null for an unknown SKU", () => {
    expect(crmArticleForSku("nope-123")).toBeNull();
  });
});
