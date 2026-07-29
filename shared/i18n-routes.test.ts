import { describe, it, expect } from "vitest";
import { ROUTE_SLUGS, resolveSlug, getSlugForPage } from "./i18n-routes";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

// Dos páginas distintas no pueden compartir slug en el mismo idioma: resolveSlug()
// devuelve el primero declarado, así que la segunda queda inalcanzable y su enlace
// muestra el contenido de la primera. Pasó de verdad con condicionesGenerales vs
// termsConditions en nl/it (2026-07): el checkout enlazaba al contrato equivocado.
//
// Estas tres parejas SÍ comparten slug a propósito y no son un bug:
//   - blogDetail / destinationDetail cuelgan de su listado (/blog y /blog/:slug),
//     igual que boatDetail. Son las DYNAMIC_PAGE_KEYS de i18n-routes.ts.
//   - myAccount y clientDashboard son dos claves para la misma página
//     (App.tsx las mapea ambas a ClientDashboardPage).
// Añadir algo aquí es una decisión consciente, no la forma de silenciar el test.
const SHARED_ON_PURPOSE = new Set(["blogDetail", "destinationDetail", "clientDashboard"]);

const PAGE_KEYS = Object.keys(ROUTE_SLUGS).filter((k) => !SHARED_ON_PURPOSE.has(k));

describe("ROUTE_SLUGS", () => {
  it("no repite un slug entre dos páginas del mismo idioma", () => {
    const seen = new Map<string, string>();
    const collisions: string[] = [];

    for (const pageKey of PAGE_KEYS) {
      for (const lang of SUPPORTED_LANGUAGES) {
        const slug = ROUTE_SLUGS[pageKey as keyof typeof ROUTE_SLUGS][lang];
        if (!slug) continue; // la home usa slug vacío en todos los idiomas
        const key = `${lang}/${slug}`;
        const owner = seen.get(key);
        if (owner) {
          collisions.push(`${key} lo reclaman "${owner}" y "${pageKey}"`);
        } else {
          seen.set(key, pageKey);
        }
      }
    }

    expect(collisions).toEqual([]);
  });

  it("resuelve cada slug de vuelta a su propia página", () => {
    for (const pageKey of PAGE_KEYS) {
      for (const lang of SUPPORTED_LANGUAGES) {
        const slug = getSlugForPage(pageKey as never, lang);
        if (!slug) continue;
        expect(resolveSlug(slug)?.pageKey, `${lang}/${slug}`).toBe(pageKey);
      }
    }
  });

  it("da a las condiciones generales un slug propio en neerlandés e italiano", () => {
    // El bug real: ambos slugs eran los de termsConditions.
    expect(resolveSlug("huurvoorwaarden")?.pageKey).toBe("condicionesGenerales");
    expect(resolveSlug("condizioni-noleggio")?.pageKey).toBe("condicionesGenerales");
    expect(resolveSlug("algemene-voorwaarden")?.pageKey).toBe("termsConditions");
    expect(resolveSlug("termini-condizioni")?.pageKey).toBe("termsConditions");
  });
});
