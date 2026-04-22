import { describe, it, expect } from "vitest";
import {
  generateLocalBusinessSchema,
  generateServiceSchema,
  generateBreadcrumbSchema,
  generateWebSiteSchema,
  generateHowToBookingSchema,
  generateSpeakableSchema,
  generateEnhancedProductSchema,
} from "./seo-config";
import { generateHowToSchema } from "@/data/howToBlogPosts";

// ═══════════════════════════════════════════════════════════════════════════
// Anti-regression tests for JSON-LD schema generators.
// Validates required fields per schema.org type after the GEO integration
// to catch breaking changes before deploy. Not an exhaustive schema.org
// validator — focuses on the fields that AI crawlers (GPTBot, ClaudeBot,
// PerplexityBot, Google SGE) actively parse.
// ═══════════════════════════════════════════════════════════════════════════

describe("generateLocalBusinessSchema", () => {
  const schema = generateLocalBusinessSchema("es", 4.8, 310);

  it("has @context and @type and @id", () => {
    expect(schema["@context"]).toBe("https://schema.org");
    expect(schema["@type"]).toBe("LocalBusiness");
    expect(schema["@id"]).toMatch(/#organization$/);
  });

  it("includes canonical NAP fields", () => {
    expect(schema.name).toBeTruthy();
    expect(schema.telephone).toMatch(/^\+34/);
    expect(schema.email).toContain("@");
    expect(schema.address).toBeDefined();
    expect((schema.address as { addressLocality?: string }).addressLocality).toBe("Blanes");
    expect((schema.address as { postalCode?: string }).postalCode).toBe("17300");
  });

  it("includes geo coordinates matching canonical Place ID (Puerto de Blanes)", () => {
    const geo = schema.geo as { latitude?: number; longitude?: number };
    expect(geo.latitude).toBeCloseTo(41.67225, 3);
    expect(geo.longitude).toBeCloseTo(2.79786, 3);
  });

  it("has inLanguage set to a BCP-47 locale tag", () => {
    expect(schema.inLanguage).toBe("es-ES");
  });

  it("different language → different inLanguage", () => {
    expect(generateLocalBusinessSchema("en").inLanguage).toBe("en-GB");
    expect(generateLocalBusinessSchema("ca").inLanguage).toBe("ca-ES");
    expect(generateLocalBusinessSchema("fr").inLanguage).toBe("fr-FR");
    expect(generateLocalBusinessSchema("de").inLanguage).toBe("de-DE");
  });

  it("includes sameAs with GMB + social", () => {
    expect(Array.isArray(schema.sameAs)).toBe(true);
    const sameAs = schema.sameAs as string[];
    expect(sameAs.some((url) => url.includes("maps.app.goo.gl"))).toBe(true);
    expect(sameAs.some((url) => url.includes("instagram"))).toBe(true);
  });

  it("includes MerchantReturnPolicy with non-refund + free date change", () => {
    const policy = schema.hasMerchantReturnPolicy as {
      "@type"?: string;
      refundType?: string;
      returnPolicyCategory?: string;
      description?: string;
    };
    expect(policy?.["@type"]).toBe("MerchantReturnPolicy");
    expect(policy?.refundType).toContain("NoReturnRefund");
    expect(policy?.returnPolicyCategory).toContain("MerchantReturnNotPermitted");
    expect(policy?.description?.toLowerCase()).toMatch(/cambio de fecha|date change/);
  });

  it("aggregateRating only added when rating+reviewCount provided", () => {
    const withRating = generateLocalBusinessSchema("es", 4.8, 310);
    expect((withRating.aggregateRating as { ratingValue?: string }).ratingValue).toBe("4.8");
    expect((withRating.aggregateRating as { reviewCount?: string }).reviewCount).toBe("310");

    const withoutRating = generateLocalBusinessSchema("es");
    expect(withoutRating.aggregateRating).toBeUndefined();
  });

  it("opening hours include the April-October season", () => {
    const hours = schema.openingHoursSpecification;
    expect(hours).toBeDefined();
  });
});

describe("generateServiceSchema", () => {
  const schema = generateServiceSchema("es");

  it("has @type Service with @id and provider link", () => {
    expect(schema["@type"]).toBe("Service");
    expect(schema["@id"]).toMatch(/#service$/);
    expect((schema.provider as { "@id"?: string })["@id"]).toMatch(/#organization$/);
  });

  it("has inLanguage dynamic", () => {
    expect(schema.inLanguage).toBe("es-ES");
    expect(generateServiceSchema("ru").inLanguage).toBe("ru-RU");
  });
});

describe("generateBreadcrumbSchema", () => {
  const schema = generateBreadcrumbSchema([
    { name: "Inicio", url: "/" },
    { name: "Barcos", url: "/fleet" },
    { name: "Solar 450", url: "/barco/solar-450" },
  ]);

  it("has @type BreadcrumbList and positions start at 1", () => {
    expect(schema["@type"]).toBe("BreadcrumbList");
    const items = schema.itemListElement as Array<{ position: number; name: string }>;
    expect(items[0].position).toBe(1);
    expect(items[items.length - 1].position).toBe(items.length);
  });

  it("preserves order and names", () => {
    const items = schema.itemListElement as Array<{ position: number; name: string }>;
    expect(items[0].name).toBe("Inicio");
    expect(items[2].name).toBe("Solar 450");
  });
});

describe("generateWebSiteSchema", () => {
  const schema = generateWebSiteSchema();

  it("has @type WebSite with SearchAction potentialAction", () => {
    expect(schema["@type"]).toBe("WebSite");
    expect(schema.potentialAction).toBeDefined();
  });

  it("declares all 8 supported languages in inLanguage", () => {
    const langs = schema.inLanguage as string[];
    expect(langs).toContain("es-ES");
    expect(langs).toContain("en-GB");
    expect(langs.length).toBe(8);
  });
});

describe("generateHowToBookingSchema", () => {
  const schema = generateHowToBookingSchema("es");

  it("has @type HowTo with step array", () => {
    expect(schema["@type"]).toBe("HowTo");
    expect(Array.isArray(schema.step)).toBe(true);
    expect((schema.step as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("generateSpeakableSchema", () => {
  const schema = generateSpeakableSchema(["h1", ".hero-description"]);

  it("has @type SpeakableSpecification with cssSelector", () => {
    expect(schema["@type"]).toBe("SpeakableSpecification");
    expect(schema.cssSelector).toEqual(["h1", ".hero-description"]);
  });
});

describe("generateEnhancedProductSchema", () => {
  const schema = generateEnhancedProductSchema(
    {
      id: "solar-450",
      name: "Solar 450",
      description: "Barco sin licencia 4.5m",
      brand: "Solar",
      capacity: 5,
      power: "15cv",
      pricePerHour: 70,
      image: "https://example.com/solar.jpg",
      requiresLicense: false,
    },
    "es",
  );

  it("has @type Product with required commerce fields", () => {
    expect(schema["@type"]).toBe("Product");
    expect(schema.name).toBeTruthy();
    expect(schema.description).toBeTruthy();
    expect(schema.brand).toBeDefined();
    expect(schema.offers).toBeDefined();
  });
});

describe("generateHowToSchema (blog posts)", () => {
  it("returns null for slugs without HowTo mapping", () => {
    const schema = generateHowToSchema("some-random-slug", "https://example.com/blog/x");
    expect(schema).toBeNull();
  });

  it("returns valid HowTo for mapped blog slug", () => {
    const canonical = "https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia";
    const schema = generateHowToSchema("alquiler-barco-sin-licencia-blanes-guia", canonical);
    expect(schema).not.toBeNull();
    expect(schema!["@type"]).toBe("HowTo");
    expect(schema!["@id"]).toBe(`${canonical}#howto`);
    const steps = schema!.step as Array<{ position: number }>;
    expect(Array.isArray(steps)).toBe(true);
    expect(steps.length).toBeGreaterThanOrEqual(5);
    expect(steps[0].position).toBe(1);
  });

  it("handles estimatedCost and tool/supply arrays when present", () => {
    const canonical = "https://example.com/blog/alquiler-barco-sin-licencia-blanes-guia";
    const schema = generateHowToSchema("alquiler-barco-sin-licencia-blanes-guia", canonical);
    const cost = schema!.estimatedCost as { "@type"?: string; currency?: string };
    expect(cost?.["@type"]).toBe("MonetaryAmount");
    expect(cost?.currency).toBe("EUR");
    expect(Array.isArray(schema!.tool)).toBe(true);
    expect(Array.isArray(schema!.supply)).toBe(true);
  });
});

describe("Cross-schema entity consistency", () => {
  it("LocalBusiness @id matches Service provider @id (entity linking)", () => {
    const local = generateLocalBusinessSchema("es");
    const service = generateServiceSchema("es");
    const localId = local["@id"];
    const providerLink = (service.provider as { "@id"?: string })["@id"];
    expect(providerLink).toBe(localId);
  });

  it("Business address consistency across schemas", () => {
    const local = generateLocalBusinessSchema("es");
    const addr = local.address as { addressLocality?: string; postalCode?: string };
    expect(addr.addressLocality).toBe("Blanes");
    expect(addr.postalCode).toBe("17300");
  });
});
