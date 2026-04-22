import { describe, it, expect } from "vitest";
import { renderThankYouWhatsApp } from "./whatsappTemplates";
import {
  BUSINESS_PLACE_ID,
  GOOGLE_REVIEW_URL,
} from "../../shared/businessProfile";

describe("GOOGLE_REVIEW_URL constant", () => {
  it("points to the correct Costa Brava Rent a Boat Place ID", () => {
    // This is the Place ID verified via Places API v1 (rating 4.8, 310 reviews).
    // If this changes, the business has likely moved to a new GBP listing.
    expect(BUSINESS_PLACE_ID).toBe("ChIJb4WolCwXuxIRp-DybpP6LZo");
  });

  it("builds a canonical Google writereview URL", () => {
    expect(GOOGLE_REVIEW_URL).toBe(
      "https://search.google.com/local/writereview?placeid=ChIJb4WolCwXuxIRp-DybpP6LZo",
    );
  });

  it("does not contain the legacy wrong Place ID that shipped for months", () => {
    // Guard against regression to the previously-hardcoded wrong Place ID
    // (ChIJrTRWOdA0uxIR_vCCNfbFNpE) that pointed to a different GBP.
    expect(GOOGLE_REVIEW_URL).not.toContain("ChIJrTRWOdA0uxIR_vCCNfbFNpE");
  });
});

describe("renderThankYouWhatsApp — language selection", () => {
  const baseInput = { customerName: "Thomas" };

  it("renders Spanish when language is 'es'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "es" });
    expect(msg).toContain("Hola Thomas!");
    expect(msg).toContain("Esperamos que hayas disfrutado");
    expect(msg).toContain(GOOGLE_REVIEW_URL);
  });

  it("renders English when language is 'en'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "en" });
    expect(msg).toContain("Hi Thomas!");
    expect(msg).toContain("We hope you enjoyed");
  });

  it("renders French when language is 'fr'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "fr" });
    expect(msg).toContain("Bonjour Thomas !");
    expect(msg).toContain("avis Google");
  });

  it("renders German when language is 'de'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "de" });
    expect(msg).toContain("Hallo Thomas!");
    expect(msg).toContain("Bootstour");
  });

  it("renders Dutch when language is 'nl'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "nl" });
    expect(msg).toContain("Hallo Thomas!");
    expect(msg).toContain("boottocht");
  });

  it("renders Italian when language is 'it'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "it" });
    expect(msg).toContain("Ciao Thomas!");
    expect(msg).toContain("uscita in barca");
  });

  it("renders Russian when language is 'ru'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "ru" });
    expect(msg).toContain("Здравствуйте, Thomas!");
    expect(msg).toContain("отзыв");
  });

  it("renders Catalan when language is 'ca'", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "ca" });
    expect(msg).toContain("Hola Thomas!");
    expect(msg).toContain("sortida amb vaixell");
  });

  it("falls back to English for unknown language codes", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "zh" });
    expect(msg).toContain("Hi Thomas!");
  });

  it("falls back to English when language is null", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: null });
    expect(msg).toContain("Hi Thomas!");
  });

  it("falls back to English when language is undefined", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: undefined });
    expect(msg).toContain("Hi Thomas!");
  });

  it("normalizes full locale codes like 'es-ES' to the base lang", () => {
    const msg = renderThankYouWhatsApp({ ...baseInput, language: "es-ES" });
    expect(msg).toContain("Hola Thomas!");
  });
});

describe("renderThankYouWhatsApp — content rules", () => {
  it("includes the canonical review URL regardless of language", () => {
    for (const language of ["es", "en", "fr", "de", "nl", "it", "ru", "ca"]) {
      const msg = renderThankYouWhatsApp({ customerName: "X", language });
      expect(msg).toContain(GOOGLE_REVIEW_URL);
    }
  });

  it("does not reference 'yesterday' (back-fill safe)", () => {
    // Old template said "tu salida de ayer" which would confuse customers
    // whose trip was several days ago (scheduler-outage back-fills).
    const es = renderThankYouWhatsApp({ customerName: "X", language: "es" });
    const en = renderThankYouWhatsApp({ customerName: "X", language: "en" });
    const fr = renderThankYouWhatsApp({ customerName: "X", language: "fr" });
    const de = renderThankYouWhatsApp({ customerName: "X", language: "de" });
    expect(es.toLowerCase()).not.toContain("ayer");
    expect(en.toLowerCase()).not.toContain("yesterday");
    expect(fr.toLowerCase()).not.toContain("hier");
    expect(de.toLowerCase()).not.toContain("gestern");
  });

  it("trims whitespace from customer name", () => {
    const msg = renderThankYouWhatsApp({
      customerName: "  Maria  ",
      language: "es",
    });
    expect(msg).toContain("Hola Maria!");
    expect(msg).not.toContain("Hola   Maria");
  });

  it("includes a closing signature", () => {
    const msg = renderThankYouWhatsApp({ customerName: "X", language: "en" });
    expect(msg).toContain("Costa Brava Rent a Boat");
  });
});
