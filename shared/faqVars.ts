// shared/faqVars.ts
//
// FAQ answer variable interpolation, shared between the React FAQ page and the
// server-side FAQPage JSON-LD in server/seoInjector.ts so SSR and hydrated DOM
// always emit identical answers. Moved from client/src/utils/faqVars.ts
// (which re-exports from here for its 12 client importers).

import type { Boat } from "./schema";
import { minPriceAcrossBoats } from "./pricing";

/**
 * Variables available for FAQ answer substitution on public pages.
 * Values default to current catalog figures when the API hasn't loaded yet
 * so server-rendered HTML is never blank or "{placeholder}".
 */
export type FaqVars = Record<string, string | number>;

export function computeFaqVars(boats: Boat[] | undefined | null): FaqVars {
  const active = (boats || []).filter((b) => b.isActive);
  const unlicensed = active.filter((b) => !b.requiresLicense && b.id !== "excursion-privada");
  const licensed = active.filter((b) => b.requiresLicense);
  const excursion = active.filter((b) => b.id === "excursion-privada");
  return {
    fleetCount: active.length || 9,
    noLicBaja1h: minPriceAcrossBoats(unlicensed, "1h", "BAJA") ?? 85,
    noLicMedia1h: minPriceAcrossBoats(unlicensed, "1h", "MEDIA") ?? 95,
    noLicAlta1h: minPriceAcrossBoats(unlicensed, "1h", "ALTA") ?? 110,
    licBaja2h: minPriceAcrossBoats(licensed, "2h", "BAJA") ?? 175,
    licAlta2h: minPriceAcrossBoats(licensed, "2h", "ALTA") ?? 210,
    excursionBaja2h: minPriceAcrossBoats(excursion, "2h", "BAJA") ?? 265,
    excursionBaja4h: minPriceAcrossBoats(excursion, "4h", "BAJA") ?? 420,
  };
}

export function substituteFaqVars(text: string, vars: FaqVars): string {
  return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}
