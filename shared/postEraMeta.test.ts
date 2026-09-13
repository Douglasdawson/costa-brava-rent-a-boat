import { describe, it, expect } from "vitest";
import { POST_ERA_META, SEO_PAGE_TO_META_KEY, postEraMeta } from "./postEraMeta";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

const PRE = new Date("2026-09-30T12:00:00+02:00");
const POST = new Date("2026-10-01T00:00:00+02:00");
const base = { title: "Sin Licencia", description: "sin licencia", ogTitle: "og sin licencia", ogDescription: "ogd" };

describe("postEraMeta", () => {
  it("leaves the pre-era copy untouched until October 1", () => {
    expect(postEraMeta("/barcos-sin-licencia", "es", base, PRE)).toBe(base);
  });

  it("overrides title/description and their OG twins from October 1", () => {
    const m = postEraMeta("/barcos-sin-licencia", "es", base, POST);
    expect(m.title).toContain("Titulín");
    expect(m.ogTitle).toBe(m.title);
    expect(m.ogDescription).toBe(m.description);
  });

  it("keeps fields the override does not mention", () => {
    const m = postEraMeta("/precios", "es", base, POST);
    expect(m.title).toBe("Sin Licencia");
    expect(m.description).not.toMatch(/sin licencia/i);
  });

  it("returns base for keys or languages without an entry", () => {
    expect(postEraMeta("/faq", "es", base, POST)).toBe(base);
    expect(postEraMeta("/alquiler-barcos-tossa-de-mar", "es", base, POST)).toBe(base);
  });
});

describe("the post-era map tells the truth", () => {
  const promise = /sin licencia necesaria|no licen[cs]e (needed|required)|license-free, fuel|ohne führerschein ab|sans permis dès/i;
  it("no entry promises licence-free rental and every entry names the titulín or a skipper", () => {
    for (const [key, langs] of Object.entries(POST_ERA_META)) {
      for (const [lang, f] of Object.entries(langs)) {
        const text = `${f?.title ?? ""} ${f?.description ?? ""}`;
        expect(text, `${key}.${lang}`).not.toMatch(promise);
        expect(text, `${key}.${lang}`).toMatch(/titul|licencia de navegaci|llicència|patr[óo]n|skipper|schipper|капитан|права/i);
      }
    }
  });

  it("covers the 8 locales on the category page and the satellite towns", () => {
    for (const key of ["/barcos-sin-licencia", "/alquiler-barcos-lloret-de-mar", "/alquiler-barcos-malgrat-de-mar"]) {
      for (const lang of SUPPORTED_LANGUAGES) expect(POST_ERA_META[key][lang], `${key}.${lang}`).toBeDefined();
    }
  });

  it("every seo-config page name maps to a key that exists", () => {
    for (const [page, key] of Object.entries(SEO_PAGE_TO_META_KEY)) expect(POST_ERA_META[key], page).toBeDefined();
  });
});
