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

// La escuela no esta autorizada todavia y hoy solo tiene lista de espera. Su web existe en
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
  it("lleva a cada idioma a SU version, sin www", () => {
    // Desde el 22-sep-2026 la escuela tiene es/ca/en. El castellano vive en la raiz (sin
    // prefijo, porque es la URL que lleva indexada) y los otros dos bajo el suyo. Antes era
    // monolingue y las tres iban a "/": si alguien vuelve a mandar ca o en a la raiz, aqui
    // se entera.
    const esperado: Record<string, string> = { es: "/", ca: "/ca", en: "/en" };
    for (const lang of GATED) {
      const url = new URL(escolaNauticaUrl(lang, "titulin-course"));
      expect(url.hostname, lang).toBe("escolanauticablanes.com");
      expect(url.pathname, lang).toBe(esperado[lang]);
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

  it("no promete FECHA DE APERTURA, que es lo que no controlamos", () => {
    /*
     * Hasta el 22-sep-2026 este test exigia lo contrario: que el copy dijera "2027".
     * La escuela retiro esa fecha de su propia web porque depende de una resolucion
     * administrativa que no controla nadie de aqui, y dos webs del mismo dueno no pueden
     * prometer cosas distintas sobre la misma escuela. Asi que ahora se prohibe.
     *
     * Ojo: "1 de octubre de 2026" SI puede aparecer — es la entrada en vigor del RD
     * 1188/2025, un hecho publicado en el BOE, no una promesa nuestra. Por eso se busca
     * el ano de apertura y los meses, no cualquier digito.
     */
    const fecha = /\b20(2[7-9]|[3-9]\d)\b|\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|gener|febrer|marc|abril|maig|juny|juliol|agost|setembre|octubre|novembre|desembre|january|february|march|april|may|june|july|august|september|november|december)\b/i;
    for (const lang of GATED) {
      const h = escolaNauticaHandoff(lang, "titulin-course")!;
      expect(h.finalTitle.length, lang).toBeGreaterThan(10);
      const texto = `${h.title} ${h.body} ${h.cta} ${h.finalTitle} ${h.finalBody}`
        // El RD y su entrada en vigor son hecho publicado, no promesa de apertura.
        .replace(/1 de octubre de 2026|1 d'octubre del 2026|1 October 2026/gi, "");
      expect(texto.match(fecha), lang).toBeNull();
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

  it("dice que la escuela todavia no esta autorizada y que hay lista de espera", () => {
    for (const lang of GATED) {
      const { title, body } = escolaNauticaHandoff(lang, "titulin-course")!;
      // Que todavia no esta autorizada, y que lo unico que hay es lista de espera.
      expect(`${title} ${body}`.toLowerCase(), lang).toMatch(
        /no esta autorizada|no está autorizada|no esta autoritzada|no està autoritzada|not authorised yet/,
      );
      expect(`${title} ${body}`.toLowerCase(), lang).toMatch(/lista de espera|llista d'espera|waiting list/);
    }
  });

  it("ninguna superficie afirma en PRESENTE que la escuela ya imparte", () => {
    /*
     * 🔴 El test que faltaba, y que habria cazado el bug del 22-sep-2026.
     *
     * `server/routes/robots.ts` decia «Imparte la Licencia de Navegacion» / «Teaches the
     * Licencia de Navegacion» dentro de un nodo EducationalOrganization servido a GPTBot,
     * ClaudeBot y PerplexityBot por /api/ai-context. La escuela no imparte nada: el AGR163
     * sigue en tramite. El copy del modulo SI estaba bien; lo que fallaba era que ese
     * fichero no lo miraba nadie.
     *
     * Se revisan las lineas de CODIGO (los comentarios quedan fuera: este mismo test y el
     * de robots.ts explican el bug citando el verbo viejo). El presente esta prohibido
     * junto a cualquier mencion de la escuela; el futuro y el condicional, no.
     */
    const ficheros = [
      "server/routes/robots.ts",
      "shared/aiCitationFacts.ts",
      "shared/escolaNauticaLinks.ts",
    ];
    const escuela = /escuela n[aá]utica|escola n[aà]utica|nautical school|escolanauticablanes/i;
    // Presente de indicativo. "impartira", "will teach" y "obrira" no casan.
    const presente = /\b(imparte|imparteix|teaches|expide|expedeix|issues|matricula a)\b/i;
    const offenders: string[] = [];
    for (const f of ficheros) {
      const lineas = fs.readFileSync(path.resolve(__dirname, "..", f), "utf8").split("\n");
      lineas.forEach((linea, i) => {
        const limpia = linea.trimStart();
        if (limpia.startsWith("//") || limpia.startsWith("*") || limpia.startsWith("/*")) return;
        if (!escuela.test(linea)) return;
        const m = linea.match(presente);
        if (m) offenders.push(`${f}:${i + 1} «${m[0]}»`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it("ya NO avisa al visitante ingles de que el destino esta en castellano", () => {
    // La escuela tiene version inglesa desde el 22-sep-2026 y el enlace va a /en, asi que
    // el aviso "(site in Spanish)" que llevaba el CTA paso de util a falso.
    const { cta, body } = escolaNauticaHandoff("en", "titulin-course")!;
    expect(`${cta} ${body}`).not.toMatch(/site in spanish|in Spanish\)/i);
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
    // (sameAs de seoInjector, robots.ts y seo-config.ts, que necesitan el dominio pelado).
    // seo-config.ts entro el 22-sep-2026: su sameAs no incluia la escuela y el del servidor
    // si, asi que la conexion de entidad solo existia para quien lee /api/ai-context.
    const allowed = [
      "shared/escolaNauticaLinks.ts",
      "shared/escolaNauticaLinks.test.ts",
      "shared/aiCitationFacts.ts",
      "client/src/i18n/es.ts",
      "client/src/i18n/ca.ts",
      "client/src/i18n/en.ts",
      "client/src/pages/category-license-free.tsx",
      "server/seoInjector.ts",
      "server/routes/robots.ts",
      "client/src/utils/seo-config.ts",
      "server/seeds/blogSeed.ts",
      // El cruce con la hermana la localiza por su carpeta, no por su dominio:
      // es una ruta de disco, no una URL que se pueda quedar vieja.
      "shared/gemela.test.ts",
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
