import { describe, it, expect } from "vitest";
import {
  ACTIVITATUM_TOPICS,
  ACTIVITATUM_PICKS,
  ACTIVITATUM_BLOCKED,
  activitatumUrl,
  activitatumTopicUrl,
  activitatumTopicForCity,
} from "./activitatumLinks";
import { SUPPORTED_LANGUAGES } from "./seoConstants";

// Hasta 2026-09 el único enlace a Activitatum que existía (Footer.tsx, barra legal) apuntaba
// a /t/alquiler-barcos: mandaba al visitante a reservar un barco en la otra web, con comisión
// de por medio, en vez de quedarse en la nuestra. Este archivo existe para que eso no vuelva.
const ALL_DESTINATIONS = [
  ...Object.values(ACTIVITATUM_TOPICS),
  ...Object.values(ACTIVITATUM_PICKS).map((pick) => pick.path),
];

describe("destinos de Activitatum", () => {
  it("no enlaza nada que CBRB venda directo", () => {
    const blocked = new Set<string>(ACTIVITATUM_BLOCKED);
    const leaked = ALL_DESTINATIONS.filter((path) => blocked.has(path));
    expect(leaked).toEqual([]);
  });

  it("no enlaza barcos ni jet ski por patrón, aunque el slug sea nuevo", () => {
    // Ojo con "boat" a secas: /a/banana-boat-blanes es un hinchable de arrastre, no un
    // alquiler de barco, y sí queremos enlazarlo. El patrón busca embarcación de verdad.
    const offenders = ALL_DESTINATIONS.filter((path) =>
      /barco|velero|catamaran|jetski|jet-ski|moto-de-agua/.test(path),
    );
    expect(offenders).toEqual([]);
  });
});

describe("activitatumUrl", () => {
  // En Activitatum el castellano es la raíz: /es/... devuelve 404, no redirección.
  it("nunca genera el prefijo /es/", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const url = activitatumTopicUrl("blanes", lang, "footer");
      expect(url).not.toContain("/es/");
    }
  });

  // Activitatum solo sirve 6 idiomas; nl y ru no existen allí.
  it("manda nl y ru al inglés en vez de a un 404", () => {
    for (const lang of ["nl", "ru"]) {
      expect(activitatumTopicUrl("lloret", lang, "footer")).toContain("activitatum.com/en/t/");
    }
  });

  it("respeta el idioma cuando Activitatum lo tiene", () => {
    expect(activitatumTopicUrl("blanes", "fr", "nav")).toContain("activitatum.com/fr/t/blanes");
    expect(activitatumTopicUrl("blanes", "es", "nav")).toContain("activitatum.com/t/blanes");
  });

  // Sin UTM no hay forma de saber en GA4 qué superficie trae el tráfico, que es el criterio
  // con el que se decide si esto sirve para algo.
  it("etiqueta todos los enlaces con la superficie de origen", () => {
    const url = activitatumUrl("/a/parasailing-lloret", "en", "thankyou-email");
    expect(url).toContain("utm_source=cbrb");
    expect(url).toContain("utm_medium=referral");
    expect(url).toContain("utm_campaign=thankyou-email");
  });

  it("no deja dobles barras ni pierde el path", () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const url = activitatumTopicUrl("fenals", lang, "bridge");
      expect(url.replace("https://", "")).not.toContain("//");
      expect(url).toContain("/t/fenals?");
    }
  });
});

describe("activitatumTopicForCity", () => {
  it("manda cada landing a la puerta geográfica de su zona", () => {
    expect(activitatumTopicForCity("alquiler-barcos-blanes")).toBe("blanes");
    expect(activitatumTopicForCity("alquiler-barcos-lloret-de-mar")).toBe("lloret");
    // No existe colección comarcal (/t/costa-brava es 404): el resto cae en Lloret,
    // que es la puerta con más catálogo de la zona después de Blanes.
    expect(activitatumTopicForCity("alquiler-barcos-tossa-de-mar")).toBe("lloret");
  });
});
