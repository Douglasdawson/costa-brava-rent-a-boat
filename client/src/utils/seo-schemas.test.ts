import { describe, it, expect } from "vitest";
import {
  generateItemListSchema,
  generateArticleSchema,
  generateSeasonalEventSchema,
  generatePlaceSchema,
} from "./seo-schemas";

describe("generateItemListSchema", () => {
  it("generates valid ItemList with correct positions", () => {
    const items = [
      { id: "boat-1", name: "Barco A" },
      { id: "boat-2", name: "Barco B" },
    ];
    const schema = generateItemListSchema(items);

    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("ItemList");
    expect(schema.itemListElement).toHaveLength(2);
    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
    expect(schema.itemListElement[0]["@type"]).toBe("ListItem");
  });

  it("builds correct URLs from item IDs", () => {
    const schema = generateItemListSchema([{ id: "my-boat", name: "Test" }]);
    expect(schema.itemListElement[0].url).toContain("/barco/my-boat");
  });

  it("handles empty array", () => {
    const schema = generateItemListSchema([]);
    expect(schema.itemListElement).toHaveLength(0);
  });
});

describe("generateArticleSchema", () => {
  const baseArticle = {
    headline: "Test Article",
    slug: "test-article",
    description: "A test article",
    author: "Costa Brava Rent a Boat",
    datePublished: "2026-01-15",
  };

  it("generates BlogPosting schema with required fields", () => {
    const schema = generateArticleSchema(baseArticle);
    expect(schema["@type"]).toBe("BlogPosting");
    expect(schema.headline).toBe("Test Article");
    expect(schema.datePublished).toBe("2026-01-15");
    expect(schema.dateModified).toBe("2026-01-15"); // defaults to published
  });

  it("uses dateModified when provided", () => {
    const schema = generateArticleSchema({ ...baseArticle, dateModified: "2026-02-01" });
    expect(schema.dateModified).toBe("2026-02-01");
  });

  it("includes image when provided", () => {
    const schema = generateArticleSchema({ ...baseArticle, image: "/images/test.jpg" });
    expect(schema.image).toContain("/images/test.jpg");
  });

  it("preserves absolute image URLs", () => {
    const schema = generateArticleSchema({ ...baseArticle, image: "https://cdn.example.com/img.jpg" });
    expect(schema.image).toBe("https://cdn.example.com/img.jpg");
  });

  it("includes category and body when provided", () => {
    const schema = generateArticleSchema({
      ...baseArticle,
      category: "Guides",
      body: "Full article text",
    });
    expect(schema.articleSection).toBe("Guides");
    expect(schema.articleBody).toBe("Full article text");
  });

  it("omits optional fields when not provided", () => {
    const schema = generateArticleSchema(baseArticle);
    expect(schema.image).toBeUndefined();
    expect(schema.articleSection).toBeUndefined();
    expect(schema.articleBody).toBeUndefined();
  });
});

describe("generateSeasonalEventSchema", () => {
  it("generates valid Event schema", () => {
    const schema = generateSeasonalEventSchema();
    expect(schema["@type"]).toBe("Event");
    expect(schema.startDate).toBe("2026-04-01");
    expect(schema.endDate).toBe("2026-10-31");
  });

  it("has AggregateOffer with EUR prices", () => {
    const schema = generateSeasonalEventSchema();
    expect(schema.offers["@type"]).toBe("AggregateOffer");
    expect(schema.offers.priceCurrency).toBe("EUR");
    expect(Number(schema.offers.lowPrice)).toBeGreaterThan(0);
    expect(Number(schema.offers.highPrice)).toBeGreaterThan(Number(schema.offers.lowPrice));
  });

  it("has location in Blanes", () => {
    const schema = generateSeasonalEventSchema();
    expect(schema.location.address.addressLocality).toBe("Blanes");
    expect(schema.location.address.addressCountry).toBe("ES");
  });
});

describe("generatePlaceSchema", () => {
  const basePlace = {
    name: "Cala Bona",
    slug: "cala-bona",
    description: "A beautiful cove",
  };

  it("generates TouristAttraction schema", () => {
    const schema = generatePlaceSchema(basePlace);
    expect(schema["@type"]).toBe("TouristAttraction");
    expect(schema.name).toBe("Cala Bona");
    expect(schema.url).toContain("/destinos/cala-bona");
  });

  it("includes geo coordinates when provided", () => {
    const schema = generatePlaceSchema({
      ...basePlace,
      coordinates: { lat: 41.6744, lng: 2.7903 },
    });
    expect(schema.geo).toBeDefined();
    const geo = schema.geo as Record<string, string>;
    expect(geo["@type"]).toBe("GeoCoordinates");
    expect(geo.latitude).toBe("41.6744");
  });

  it("includes image when provided", () => {
    const schema = generatePlaceSchema({ ...basePlace, image: "/img/cala.jpg" });
    expect(schema.image).toContain("/img/cala.jpg");
  });

  it("always includes Blanes address", () => {
    const schema = generatePlaceSchema(basePlace);
    const addr = schema.address as Record<string, string>;
    expect(addr.addressLocality).toBe("Blanes");
  });
});
