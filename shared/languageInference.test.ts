import { describe, it, expect } from "vitest";
import {
  inferLanguageFromPhone,
  resolveEffectiveLanguage,
} from "./languageInference";

describe("inferLanguageFromPhone", () => {
  it("maps +49 (Germany) to de", () => {
    expect(inferLanguageFromPhone("+491761234567")).toBe("de");
  });

  it("handles spaces, dashes and parens", () => {
    expect(inferLanguageFromPhone("+49 176 123-4567")).toBe("de");
    expect(inferLanguageFromPhone("(+49) 176 1234567")).toBe("de");
  });

  it("handles 00-prefixed international dialing", () => {
    expect(inferLanguageFromPhone("0049 176 1234567")).toBe("de");
  });

  it("handles a digits-only number with leading prefix", () => {
    expect(inferLanguageFromPhone("491761234567")).toBe("de");
  });

  it("maps +34 (Spain) to es", () => {
    expect(inferLanguageFromPhone("+34611500372")).toBe("es");
  });

  it("maps +44 (UK) to en", () => {
    expect(inferLanguageFromPhone("+447911123456")).toBe("en");
  });

  it("maps +33 (France) to fr", () => {
    expect(inferLanguageFromPhone("+33612345678")).toBe("fr");
  });

  it("maps +31 (Netherlands) to nl", () => {
    expect(inferLanguageFromPhone("+31612345678")).toBe("nl");
  });

  it("maps +39 (Italy) to it", () => {
    expect(inferLanguageFromPhone("+393123456789")).toBe("it");
  });

  it("maps +7 (Russia) to ru", () => {
    expect(inferLanguageFromPhone("+79161234567")).toBe("ru");
  });

  it("returns null for unmapped prefixes like +1 (US)", () => {
    expect(inferLanguageFromPhone("+15551234567")).toBeNull();
  });

  it("returns null for null/undefined/empty input", () => {
    expect(inferLanguageFromPhone(null)).toBeNull();
    expect(inferLanguageFromPhone(undefined)).toBeNull();
    expect(inferLanguageFromPhone("")).toBeNull();
  });

  it("returns null for non-numeric placeholders like 'N/A'", () => {
    expect(inferLanguageFromPhone("N/A")).toBeNull();
  });

  it("returns null for a phone that becomes empty after stripping 00", () => {
    expect(inferLanguageFromPhone("00")).toBeNull();
  });
});

describe("resolveEffectiveLanguage", () => {
  it("uses inferred language when booking.language is the default 'es' and prefix is non-Spanish", () => {
    expect(resolveEffectiveLanguage("es", "+491761234567")).toBe("de");
  });

  it("keeps 'es' when booking.language is 'es' and phone is +34", () => {
    expect(resolveEffectiveLanguage("es", "+34611500372")).toBe("es");
  });

  it("keeps 'es' when booking.language is 'es' and phone is an unmapped prefix", () => {
    expect(resolveEffectiveLanguage("es", "+15551234567")).toBe("es");
  });

  it("keeps 'es' when booking.language is 'es' and phone is missing", () => {
    expect(resolveEffectiveLanguage("es", null)).toBe("es");
    expect(resolveEffectiveLanguage("es", "")).toBe("es");
    expect(resolveEffectiveLanguage("es", "N/A")).toBe("es");
  });

  it("respects an explicit non-default booking.language even when phone suggests something else", () => {
    expect(resolveEffectiveLanguage("en", "+491761234567")).toBe("en");
    expect(resolveEffectiveLanguage("ca", "+491761234567")).toBe("ca");
    expect(resolveEffectiveLanguage("fr", "+34611500372")).toBe("fr");
  });

  it("defaults to 'es' when booking.language is missing and no inference is possible", () => {
    expect(resolveEffectiveLanguage(null, null)).toBe("es");
    expect(resolveEffectiveLanguage(undefined, undefined)).toBe("es");
    expect(resolveEffectiveLanguage("", "")).toBe("es");
  });

  it("treats missing booking.language as the default and applies inference", () => {
    expect(resolveEffectiveLanguage(null, "+491761234567")).toBe("de");
    expect(resolveEffectiveLanguage(undefined, "+33612345678")).toBe("fr");
  });

  it("normalizes booking.language case and length", () => {
    expect(resolveEffectiveLanguage("ES", "+491761234567")).toBe("de");
    expect(resolveEffectiveLanguage("es-ES", "+491761234567")).toBe("de");
    expect(resolveEffectiveLanguage("DE-AT", "+34611500372")).toBe("de");
  });
});
