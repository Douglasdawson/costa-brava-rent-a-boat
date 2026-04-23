import { describe, it, expect } from "vitest";
import { buildBoatFaqItems, buildBoatFaqTitle, type BoatFaqInput, type BoatFaqText } from "./boatFaqBuilder";

const esText: BoatFaqText = {
  title: "Preguntas frecuentes sobre {name}",
  q1: "¿Cuánto cuesta alquilar el {name}?",
  a1Intro: "Packs en temporada baja (abril-junio, septiembre-octubre):",
  a1PackItem: "{hours}h desde {price}€",
  a1Empty: "Consulta los precios al reservar.",
  q2: "¿Cuántas personas caben en el {name}?",
  a2: "El {name} tiene capacidad para {capacity} personas. Ideal para {audience}.",
  audienceSmall: "parejas y familias pequeñas",
  audienceMedium: "familias y grupos de amigos",
  audienceLarge: "grupos grandes y celebraciones",
  q3: "¿Necesito licencia para el {name}?",
  a3None: "No, el {name} no requiere licencia. Solo necesitas ser mayor de 18 años.",
  a3Licensed: "Sí, el {name} requiere {license}. Deberás presentar tu titulación en vigor antes de zarpar.",
  a3Fallback: "licencia náutica en vigor",
  q4: "¿Qué incluye el alquiler del {name}?",
  a4Base: "El alquiler incluye: {items}.",
  a4Empty: "El alquiler incluye los servicios básicos.",
  a4FuelIncluded: "El combustible está incluido.",
  a4FuelNotIncluded: "El combustible no está incluido (se paga aparte).",
  q5: "¿Cuál es la política de cancelación?",
  a5: "Puedes cambiar la fecha sin coste con 7 días de antelación.",
  licenseTypes: {
    none: "No requiere licencia",
    navegacion: "Licencia Básica de Navegación (LBN)",
    pnb: "Patrón para Navegación Básica (PNB)",
    per: "Patrón de Embarcaciones de Recreo (PER)",
    patron_yate: "Patrón de Yate",
    capitan_yate: "Capitán de Yate",
  },
};

const mingolla: BoatFaqInput = {
  name: "Mingolla Brava 19",
  capacity: 6,
  requiresLicense: true,
  licenseType: "navegacion",
  pricing: { BAJA: { prices: { "2h": 160, "4h": 230, "8h": 280 } } },
  included: ["IVA", "Amarre", "Limpieza", "Seguro embarcación y ocupantes"],
};

const pacificCraft: BoatFaqInput = {
  name: "Pacific Craft 625",
  capacity: 7,
  requiresLicense: true,
  licenseType: "per",
  pricing: { BAJA: { prices: { "2h": 200, "4h": 280, "8h": 380 } } },
  included: ["IVA", "Amarre", "Limpieza", "Seguro embarcación y ocupantes"],
};

const solar450: BoatFaqInput = {
  name: "Solar 450",
  capacity: 5,
  requiresLicense: false,
  licenseType: "none",
  pricing: { BAJA: { prices: { "1h": 70, "2h": 130, "4h": 220 } } },
  included: ["Gasolina", "IVA", "Amarre", "Limpieza", "Seguro embarcación y ocupantes"],
};

describe("buildBoatFaqItems", () => {
  it("returns exactly 5 items in fixed order", () => {
    const items = buildBoatFaqItems(mingolla, esText);
    expect(items).toHaveLength(5);
  });

  describe("Q1 price", () => {
    it("lists packs in ascending duration order for Mingolla", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      expect(items[0].question).toBe("¿Cuánto cuesta alquilar el Mingolla Brava 19?");
      expect(items[0].answer).toContain("2h desde 160€");
      expect(items[0].answer).toContain("4h desde 230€");
      expect(items[0].answer).toContain("8h desde 280€");
      // Ensure 2h appears before 4h which appears before 8h
      const a = items[0].answer;
      expect(a.indexOf("2h")).toBeLessThan(a.indexOf("4h"));
      expect(a.indexOf("4h")).toBeLessThan(a.indexOf("8h"));
    });

    it("never claims €/hora", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      expect(items[0].answer).not.toMatch(/€\/hora/);
      expect(items[0].answer).not.toMatch(/por hora/);
    });

    it("falls back to a1Empty when pricing is absent", () => {
      const noPrice: BoatFaqInput = { ...mingolla, pricing: null };
      const items = buildBoatFaqItems(noPrice, esText);
      expect(items[0].answer).toBe(esText.a1Empty);
    });

    it("skips packs with price 0 or null", () => {
      const partial: BoatFaqInput = {
        ...mingolla,
        pricing: { BAJA: { prices: { "2h": 160, "4h": 0, "8h": null } } },
      };
      const items = buildBoatFaqItems(partial, esText);
      expect(items[0].answer).toContain("2h desde 160€");
      expect(items[0].answer).not.toContain("4h");
      expect(items[0].answer).not.toContain("8h");
    });
  });

  describe("Q2 capacity", () => {
    it("uses audienceMedium for Mingolla (6 pax)", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      expect(items[1].answer).toContain("6 personas");
      expect(items[1].answer).toContain("familias y grupos de amigos");
    });

    it("uses audienceLarge for Pacific Craft (7 pax)", () => {
      const items = buildBoatFaqItems(pacificCraft, esText);
      expect(items[1].answer).toContain("7 personas");
      expect(items[1].answer).toContain("grupos grandes y celebraciones");
    });

    it("uses audienceSmall for small boats (≤4 pax)", () => {
      const small: BoatFaqInput = { ...solar450, capacity: 4 };
      const items = buildBoatFaqItems(small, esText);
      expect(items[1].answer).toContain("parejas y familias pequeñas");
    });
  });

  describe("Q3 license", () => {
    it("returns LBN answer for Mingolla (navegacion)", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      expect(items[2].answer).toContain("Licencia Básica de Navegación (LBN)");
      expect(items[2].answer).not.toContain("PER");
    });

    it("returns PER answer for Pacific Craft 625", () => {
      const items = buildBoatFaqItems(pacificCraft, esText);
      expect(items[2].answer).toContain("Patrón de Embarcaciones de Recreo (PER)");
    });

    it("returns no-license answer when requiresLicense=false", () => {
      const items = buildBoatFaqItems(solar450, esText);
      expect(items[2].answer).toContain("no requiere licencia");
      expect(items[2].answer).toContain("18 años");
    });

    it("falls back when licenseType is unknown but requiresLicense=true", () => {
      const legacy: BoatFaqInput = { ...mingolla, licenseType: undefined };
      const items = buildBoatFaqItems(legacy, esText);
      expect(items[2].answer).toContain(esText.a3Fallback);
    });

    it("treats inconsistent licenseType='none' + requiresLicense=true as unknown (does not say 'requires no license required')", () => {
      const inconsistent: BoatFaqInput = { ...mingolla, licenseType: "none" };
      const items = buildBoatFaqItems(inconsistent, esText);
      expect(items[2].answer).toContain("Sí");
      expect(items[2].answer).toContain(esText.a3Fallback);
      // The literal "none" label must NOT appear in the licensed answer
      expect(items[2].answer).not.toContain(esText.licenseTypes.none);
    });
  });

  describe("Q4 includes", () => {
    it("joins the included array for licensed Mingolla and appends fuel-not-included", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      expect(items[3].answer).toContain("IVA, Amarre, Limpieza, Seguro embarcación y ocupantes");
      expect(items[3].answer).toContain("combustible no está incluido");
    });

    it("appends fuel-included for unlicensed Solar 450", () => {
      const items = buildBoatFaqItems(solar450, esText);
      expect(items[3].answer).toContain("Gasolina, IVA");
      expect(items[3].answer).toContain("combustible está incluido");
      expect(items[3].answer).not.toContain("no está incluido");
    });

    it("does not invent claims not in the included array", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      // "todo riesgo" was the old hardcoded claim — must not appear
      expect(items[3].answer).not.toContain("todo riesgo");
      expect(items[3].answer).not.toContain("homologado");
      expect(items[3].answer).not.toContain("formación previa");
    });

    it("falls back to a4Empty when included array is empty", () => {
      const emptyIncluded: BoatFaqInput = { ...mingolla, included: [] };
      const items = buildBoatFaqItems(emptyIncluded, esText);
      expect(items[3].answer).toContain(esText.a4Empty);
      expect(items[3].answer).toContain("combustible no está incluido");
    });

    it("dedupes case-insensitively, keeping first occurrence", () => {
      const dupes: BoatFaqInput = {
        ...mingolla,
        included: ["IVA", "Seguro", "Amarre", "iva", "SEGURO", "Limpieza"],
      };
      const items = buildBoatFaqItems(dupes, esText);
      const occurrences = (items[3].answer.match(/IVA/gi) || []).length;
      expect(occurrences).toBe(1);
    });

    it("strips fuel-like items from included[] when requiresLicense=true", () => {
      // Real DB state observed: Mingolla has 'Carburante' mistakenly in
      // included[] despite being licensed. Business rule: licensed never
      // includes fuel. Builder must strip to avoid contradiction with
      // the authoritative a4FuelNotIncluded sentence.
      const withFuelEntry: BoatFaqInput = {
        ...mingolla,
        included: ["IVA", "Carburante", "Amarre", "Limpieza", "Seguro embarcación y ocupantes"],
      };
      const items = buildBoatFaqItems(withFuelEntry, esText);
      expect(items[3].answer).not.toContain("Carburante");
      expect(items[3].answer).toContain("combustible no está incluido");
    });

    it("keeps fuel-like items in included[] for unlicensed boats", () => {
      // For Solar 450 (unlicensed) fuel IS included; keeping the admin entry
      // is harmless and reinforces the a4FuelIncluded sentence.
      const unlicensedWithFuel: BoatFaqInput = {
        ...solar450,
        included: ["Gasolina", "IVA", "Amarre"],
      };
      const items = buildBoatFaqItems(unlicensedWithFuel, esText);
      expect(items[3].answer).toContain("Gasolina");
      expect(items[3].answer).toContain("combustible está incluido");
    });
  });

  describe("Q5 cancellation", () => {
    it("returns the a5 text unchanged", () => {
      const items = buildBoatFaqItems(mingolla, esText);
      expect(items[4].question).toBe(esText.q5);
      expect(items[4].answer).toBe(esText.a5);
    });
  });
});

describe("buildBoatFaqTitle", () => {
  it("interpolates the boat name", () => {
    expect(buildBoatFaqTitle({ name: "Mingolla Brava 19" }, esText)).toBe(
      "Preguntas frecuentes sobre Mingolla Brava 19",
    );
  });
});
