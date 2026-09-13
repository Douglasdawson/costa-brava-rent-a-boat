import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import {
  ESCOLA_NAUTICA_DOMAIN,
  ESCOLA_NAUTICA_LANGS,
  escolaNauticaHandoff,
  escolaNauticaUrl,
} from "./escolaNauticaLinks";
import { SUPPORTED_LANGUAGES } from "./seoConstants";
import { es } from "@/i18n/es";
import { ca } from "@/i18n/ca";
import { en } from "@/i18n/en";
import { de } from "@/i18n/de";
import { fr } from "@/i18n/fr";
import { it as itLocale } from "@/i18n/it";
import { nl } from "@/i18n/nl";
import { ru } from "@/i18n/ru";

// La escuela abre en abril de 2027 y hoy solo tiene lista de espera, y su web existe solo en
// castellano (su /en/ es un 404 real). Este archivo existe para que ni el copy prometa una
// plaza que no hay, ni el enlace aparezca en un idioma al que el destino no responde.

const GATED = ["es", "ca", "en"];
const UNGATED = SUPPORTED_LANGUAGES.filter((lang) => !GATED.includes(lang));
const LOCALES = { es, ca, en, de, fr, it: itLocale, nl, ru };

describe("gate de idioma", () => {
  it("devuelve copy y enlace en es, ca y en", () => {
    for (const lang of GATED) {
      const handoff = escolaNauticaHandoff(lang, "titulin-course");
      expect(handoff, lang).not.toBeNull();
      expect(handoff!.title.length, lang).toBeGreaterThan(10);
      expect(handoff!.cta.length, lang).toBeGreaterThan(5);
    }
  });

  it("devuelve null en los idiomas que el destino no habla", () => {
    for (const lang of UNGATED) {
      expect(escolaNauticaHandoff(lang, "titulin-course"), lang).toBeNull();
    }
  });

  it("ESCOLA_NAUTICA_LANGS y el gate dicen lo mismo", () => {
    expect([...ESCOLA_NAUTICA_LANGS].sort()).toEqual([...GATED].sort());
  });
});

describe("la URL", () => {
  it("apunta a la raiz, sin www y sin prefijo de idioma", () => {
    // Su canonical es el apex, y /es/, /en/, /ca/ devuelven 404 real alli, no redireccion.
    for (const lang of GATED) {
      const url = new URL(escolaNauticaUrl(lang, "titulin-course"));
      expect(url.hostname, lang).toBe("escolanauticablanes.com");
      expect(url.pathname, lang).toBe("/");
      expect(url.protocol, lang).toBe("https:");
    }
  });

  it("lleva la atribucion completa, con la superficie y el idioma", () => {
    const url = new URL(escolaNauticaUrl("ca", "faq"));
    expect(url.searchParams.get("utm_source")).toBe("cbrb");
    expect(url.searchParams.get("utm_medium")).toBe("referral");
    expect(url.searchParams.get("utm_campaign")).toBe("faq");
    expect(url.searchParams.get("utm_content")).toBe("ca");
  });

  it("pone la query antes de cualquier fragmento", () => {
    // Si algun dia se enlaza una ancla (#lista-de-espera), el "?" tiene que ir ANTES del "#"
    // o los UTM viajan dentro del fragmento y GA4 no los ve.
    const url = escolaNauticaUrl("es", "titulin-course");
    const hash = url.indexOf("#");
    if (hash !== -1) expect(url.indexOf("?")).toBeLessThan(hash);
  });
});

describe("el copy no vende lo que la escuela no puede dar", () => {
  it("no promete matricula, plaza ni precio", () => {
    // Ojo: "matricula" y "precio" SI pueden aparecer, porque el copy dice justo que no las
    // hay ("todavia no hay matricula abierta ni precio"). Lo que no puede aparecer es una
    // cifra ni un imperativo de compra.
    const selling = /\d+\s*(€|eur)|€\s*\d|reserva (tu|la)|inscr[ií]b(ete|ase)|apúntate al curso|book (now|your)|sign up for|enrol now/i;
    for (const lang of GATED) {
      const h = escolaNauticaHandoff(lang, "titulin-course")!;
      const text = `${h.title} ${h.body} ${h.cta} ${h.finalTitle} ${h.finalBody}`;
      expect(text.match(selling), lang).toBeNull();
    }
  });

  it("el CTA final tampoco promete fecha de convocatoria", () => {
    for (const lang of GATED) {
      const { finalTitle, finalBody } = escolaNauticaHandoff(lang, "titulin-course")!;
      expect(finalTitle.length, lang).toBeGreaterThan(10);
      expect(finalBody, lang).toContain("2027");
    }
  });

  it("dice explicitamente que todavia no hay matricula ni precio", () => {
    for (const lang of GATED) {
      const { body } = escolaNauticaHandoff(lang, "titulin-course")!;
      expect(body.toLowerCase(), lang).toMatch(
        /no hay matrícula abierta ni precio|no hi ha matrícula oberta ni preu|enrolment is not open and there is no price/,
      );
    }
  });

  it("dice que la escuela abre en 2027 y que hay lista de espera", () => {
    for (const lang of GATED) {
      const { title, body } = escolaNauticaHandoff(lang, "titulin-course")!;
      expect(`${title} ${body}`, lang).toContain("2027");
      expect(`${title} ${body}`.toLowerCase(), lang).toMatch(/lista de espera|llista d'espera|waiting list/);
    }
  });

  it("avisa al visitante ingles de que el destino esta en castellano", () => {
    const { cta, body } = escolaNauticaHandoff("en", "titulin-course")!;
    expect(`${cta} ${body}`).toMatch(/spanish/i);
  });
});

describe("las superficies que el tipo no alcanza", () => {
  it("la FAQ del titulin nombra la escuela solo en los idiomas gateados", () => {
    for (const [lang, locale] of Object.entries(LOCALES)) {
      const answer = locale.faqPage?.items?.titulin?.answer ?? "";
      if (GATED.includes(lang)) {
        expect(answer, lang).toContain("escolanauticablanes.com");
      } else {
        expect(answer, lang).not.toContain("escolanautica");
      }
    }
  });

  it("llms.txt enlaza la escuela solo en la raiz, es y ca", () => {
    const read = (file: string) =>
      fs.readFileSync(path.resolve(__dirname, "..", "client", "public", file), "utf8");

    expect(read("llms.txt")).toContain(escolaNauticaUrl("en", "llms"));
    expect(read("es/llms.txt")).toContain(escolaNauticaUrl("es", "llms"));
    expect(read("ca/llms.txt")).toContain(escolaNauticaUrl("ca", "llms"));

    for (const lang of ["de", "fr", "it", "nl", "ru"]) {
      expect(read(`${lang}/llms.txt`), lang).not.toContain("escolanautica");
    }
  });

  it("el dominio no se escribe a mano en ninguna superficie de cliente", () => {
    // Unicos sitios legitimos: este modulo, los 3 locales gateados y la capa de entidad
    // (sameAs de seoInjector y robots.ts, que necesitan el dominio pelado).
    const allowed = [
      "shared/escolaNauticaLinks.ts",
      "shared/escolaNauticaLinks.test.ts",
      "shared/aiCitationFacts.ts",
      "client/src/i18n/es.ts",
      "client/src/i18n/ca.ts",
      "client/src/i18n/en.ts",
      "server/seoInjector.ts",
      "server/routes/robots.ts",
    ];
    const root = path.resolve(__dirname, "..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === "node_modules" || entry.name === "dist") continue;
          walk(full);
        } else if (/\.tsx?$/.test(entry.name)) {
          const rel = path.relative(root, full);
          if (allowed.includes(rel)) continue;
          if (fs.readFileSync(full, "utf8").includes("escolanauticablanes")) offenders.push(rel);
        }
      }
    };
    for (const dir of ["client/src", "server", "shared"]) walk(path.join(root, dir));
    expect(offenders).toEqual([]);
  });

  it("el dominio del modulo es el que usa la capa de entidad", () => {
    expect(ESCOLA_NAUTICA_DOMAIN).toBe("https://escolanauticablanes.com");
  });
});
