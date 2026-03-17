// Schema.org validation -- validates JSON-LD structured data on critical pages
import { logger } from "../../lib/logger";
import { db } from "../../db";
import { seoAlerts } from "../../../shared/schema";
import { SEO_CONFIG } from "../config";

// Required fields per schema type
const SCHEMA_REQUIREMENTS: Record<string, string[]> = {
  LocalBusiness: ["name", "@type", "address", "telephone"],
  Product: ["name", "@type", "offers"],
  FAQPage: ["@type", "mainEntity"],
  Article: ["@type", "headline", "author"],
  BreadcrumbList: ["@type", "itemListElement"],
  Event: ["@type", "name", "startDate", "location"],
  Organization: ["@type", "name", "url"],
  AggregateRating: ["@type", "ratingValue", "reviewCount"],
};

interface ValidationResult {
  url: string;
  valid: boolean;
  errors: string[];
  schemaTypes: string[];
}

// Validate a single page's JSON-LD
export async function validatePageSchema(url: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const schemaTypes: string[] = [];

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "SEO-Engine-Validator/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return { url, valid: false, errors: [`HTTP ${response.status}`], schemaTypes: [] };
    }

    const html = await response.text();

    // Extract all JSON-LD blocks
    const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    const schemas: unknown[] = [];

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        // Handle @graph arrays
        if (parsed["@graph"]) {
          schemas.push(...(parsed["@graph"] as unknown[]));
        } else if (Array.isArray(parsed)) {
          schemas.push(...parsed);
        } else {
          schemas.push(parsed);
        }
      } catch {
        errors.push("JSON-LD parse error");
      }
    }

    if (schemas.length === 0) {
      errors.push("No JSON-LD found");
      return { url, valid: false, errors, schemaTypes: [] };
    }

    // Validate each schema against requirements
    for (const schema of schemas) {
      const s = schema as Record<string, unknown>;
      const type = String(s["@type"] || "");
      if (type) schemaTypes.push(type);

      const requirements = SCHEMA_REQUIREMENTS[type];
      if (requirements) {
        for (const field of requirements) {
          if (!(field in s) || s[field] === null || s[field] === undefined || s[field] === "") {
            errors.push(`${type}: missing required field "${field}"`);
          }
        }
      }
    }

    return {
      url,
      valid: errors.length === 0,
      errors,
      schemaTypes,
    };
  } catch (error) {
    return {
      url,
      valid: false,
      errors: [error instanceof Error ? error.message : String(error)],
      schemaTypes: [],
    };
  }
}

// Validate all critical pages
export async function validateAllSchemas(): Promise<ValidationResult[]> {
  const baseUrl = SEO_CONFIG.baseUrl;
  const criticalPages = [
    "/", "/precios", "/faq", "/galeria", "/rutas",
    "/barcos-sin-licencia", "/barcos-con-licencia",
    "/alquiler-barcos-blanes", "/alquiler-barcos-lloret-de-mar",
    "/alquiler-barcos-tossa-de-mar", "/blog", "/testimonios",
  ];

  const results: ValidationResult[] = [];

  for (const page of criticalPages) {
    const result = await validatePageSchema(`${baseUrl}${page}`);
    results.push(result);

    if (!result.valid) {
      // Create alert for invalid schemas
      await db.insert(seoAlerts).values({
        type: "schema_validation",
        severity: "medium",
        title: `Schema invalido en ${page}`,
        message: result.errors.join(", "),
      });
    }

    // Small delay to avoid hammering our own server
    await new Promise(r => setTimeout(r, 500));
  }

  logger.info(`[SEO:Schema] Validated ${results.length} pages, ${results.filter(r => !r.valid).length} with issues`);
  return results;
}
