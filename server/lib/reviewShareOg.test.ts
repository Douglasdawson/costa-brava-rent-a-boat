import { describe, it, expect } from "vitest";
import {
  buildReviewShareHtml,
  buildReviewShareUrl,
  normalizeReviewShareLang,
  reviewShareLangForPhone,
} from "./reviewShareOg";
import { GOOGLE_REVIEW_URL } from "../../shared/businessProfile";

describe("reviewShareLangForPhone — binary es/en by prefix", () => {
  it("returns es only for Spanish (+34) numbers", () => {
    expect(reviewShareLangForPhone("+34 611 500 372")).toBe("es");
    expect(reviewShareLangForPhone("0034611500372")).toBe("es");
  });

  it("returns en for any non-Spanish prefix", () => {
    expect(reviewShareLangForPhone("+49 176 1234567")).toBe("en"); // Germany
    expect(reviewShareLangForPhone("+33 6 12 34 56 78")).toBe("en"); // France
    expect(reviewShareLangForPhone("+1 555 0100")).toBe("en"); // USA (unmapped)
  });

  it("returns en when the phone is missing or unparseable", () => {
    expect(reviewShareLangForPhone(null)).toBe("en");
    expect(reviewShareLangForPhone(undefined)).toBe("en");
    expect(reviewShareLangForPhone("N/A")).toBe("en");
  });
});

describe("normalizeReviewShareLang", () => {
  it("only accepts 'en', defaulting everything else to 'es'", () => {
    expect(normalizeReviewShareLang("en")).toBe("en");
    expect(normalizeReviewShareLang("es")).toBe("es");
    expect(normalizeReviewShareLang(undefined)).toBe("es");
    expect(normalizeReviewShareLang("fr")).toBe("es");
    expect(normalizeReviewShareLang(["en", "es"])).toBe("en");
  });
});

describe("buildReviewShareUrl", () => {
  it("builds the branded vanity link with the lang param", () => {
    expect(buildReviewShareUrl("es")).toMatch(/\/resena\?l=es$/);
    expect(buildReviewShareUrl("en")).toMatch(/\/resena\?l=en$/);
  });
});

describe("buildReviewShareHtml", () => {
  it("renders Spanish OG tags for es", () => {
    const html = buildReviewShareHtml("es");
    expect(html).toContain('property="og:title" content="Deja tu reseña');
    expect(html).toContain('lang="es"');
    expect(html).toContain('content="es_ES"');
  });

  it("renders English OG tags for en", () => {
    const html = buildReviewShareHtml("en");
    expect(html).toContain('property="og:title" content="Leave your review');
    expect(html).toContain('lang="en"');
    expect(html).toContain('content="en_GB"');
  });

  it("includes the og:image and summary_large_image card", () => {
    const html = buildReviewShareHtml("es");
    expect(html).toContain("/og-image.webp");
    expect(html).toContain('content="summary_large_image"');
    expect(html).toContain('content="1200"');
    expect(html).toContain('content="630"');
  });

  it("redirects humans to the Google review URL via refresh + JS", () => {
    const html = buildReviewShareHtml("en");
    expect(html).toContain(`url=${GOOGLE_REVIEW_URL}`);
    expect(html).toContain("window.location.replace");
  });

  it("keeps the page out of the index but lets crawlers follow", () => {
    const html = buildReviewShareHtml("es");
    expect(html).toContain('name="robots" content="noindex, follow"');
  });
});
