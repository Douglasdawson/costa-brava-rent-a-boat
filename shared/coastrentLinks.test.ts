import { describe, it, expect } from "vitest";
import {
  COASTRENT_PATHS,
  CARABELA,
  carabelaOpen,
  carabelaPosJsonLd,
  coastrentUrl,
  type CoastrentDestination,
} from "./coastrentLinks";
import { activitatumPicksBySlot } from "./activitatumLinks";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

const DESTINATIONS = Object.keys(COASTRENT_PATHS) as CoastrentDestination[];

describe("coastrentUrl", () => {
  // Hasta 2026-11 los 4 CTA de la página puente iban a coastrent.es/{lang} sin UTM: en GA4 el
  // tráfico salía como "referral / costabravarentaboat.com" y no se sabía qué superficie lo traía.
  it("etiqueta todos los enlaces con los tres UTM y la superficie de origen", () => {
    for (const key of DESTINATIONS) {
      const url = coastrentUrl(key, "es", "bridge");
      expect(url).toContain("utm_source=cbrb");
      expect(url).toContain("utm_medium=referral");
      expect(url).toContain("utm_campaign=bridge");
    }
  });

  it("resuelve cada destino en los 8 idiomas, con prefijo de idioma y sin dobles barras", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const key of DESTINATIONS) {
        const url = coastrentUrl(key, lang, "picks");
        expect(url.startsWith(`https://coastrent.es/${lang}`), `${key}/${lang}`).toBe(true);
        expect(url.replace("https://", "")).not.toContain("//");
      }
    }
  });

  it("la home no lleva barra final antes de la query", () => {
    expect(coastrentUrl("home", "de", "contact")).toBe(
      "https://coastrent.es/de?utm_source=cbrb&utm_medium=referral&utm_campaign=contact"
    );
  });

  it("un idioma desconocido cae al inglés en vez de a un 404", () => {
    expect(coastrentUrl("paddle", "pt", "picks")).toContain("/en/paddle-board-rental?");
  });
});

describe("carabelaOpen", () => {
  it("cambia justo el 1 de febrero de 2027", () => {
    expect(carabelaOpen("2027-01-31")).toBe(false);
    expect(carabelaOpen("2027-02-01")).toBe(true);
  });

  it("lee las fechas en hora de Madrid", () => {
    // 23:30 UTC del 31-ene es ya 00:30 del 1-feb en Madrid.
    expect(carabelaOpen(new Date("2027-01-31T23:30:00Z"))).toBe(true);
    expect(carabelaOpen(new Date("2027-01-31T22:30:00Z"))).toBe(false);
  });
});

describe("carabelaPosJsonLd", () => {
  it("usa el @id compartido con coastrent.es y el horario con validFrom", () => {
    const node = carabelaPosJsonLd();
    expect(node["@id"]).toBe("https://coastrent.es/#store-carabela");
    expect(node.telephone).toBe("+34611500372");
    expect(node.address.postalCode).toBe(CARABELA.postalCode);
    expect(node.openingHoursSpecification[0].validFrom).toBe("2027-02-01");
  });
});

describe("pick de paddle de Activitatum", () => {
  // Carabela vende paddle surf del grupo: desde la apertura el pick de un tercero sobra.
  it("desaparece de los picks el día que abre Carabela, y no antes", () => {
    expect(activitatumPicksBySlot("afterBoat", new Date("2027-01-31T12:00:00+01:00"))).toContain(
      "paddle"
    );
    expect(
      activitatumPicksBySlot("afterBoat", new Date("2027-02-01T12:00:00+01:00"))
    ).not.toContain("paddle");
  });
});
