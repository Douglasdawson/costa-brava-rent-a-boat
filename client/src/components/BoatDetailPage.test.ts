import { describe, it, expect } from "vitest";
import { translateBoatText } from "./BoatDetailPage";

describe("translateBoatText", () => {
  it("translates an exact catalogue string", () => {
    expect(translateBoatText("Sin licencia · 5 personas · Premium con bluetooth", "en")).toBe(
      "No licence required · 5 people · Premium with bluetooth"
    );
  });

  it("re-stamps the live figure when the entry was written for another capacity", () => {
    // The dictionary entry says "7 personas"; the fleet row says 6.
    expect(translateBoatText("Con patrón · 6 personas · Experiencia VIP", "en")).toBe(
      "With skipper · 6 people · VIP experience"
    );
    expect(translateBoatText("Con patrón · 6 personas · Experiencia VIP", "de")).toBe(
      "Mit Skipper · 6 Personen · VIP-Erlebnis"
    );
  });

  it("keeps every number of a multi-figure string in order", () => {
    expect(translateBoatText("Con licencia · 6 personas · Lloret en 15 min, Tossa en 30", "en")).toBe(
      "Licence required · 6 people · Lloret in 15 min, Tossa in 30"
    );
  });

  it("serves the whole 'Hasta N personas' family from one entry", () => {
    // Wildcarding digits collapses these into a single key on purpose.
    expect(translateBoatText("Hasta 4 personas", "en")).toBe("Up to 4 people");
    expect(translateBoatText("Hasta 7 personas", "en")).toBe("Up to 7 people");
    expect(translateBoatText("Hasta 6 personas", "fr")).toBe("Jusqu'a 6 personnes");
  });

  it("ignores case and accents, and leaves Spanish untouched", () => {
    expect(translateBoatText("  ESCALERA DE BANO  ", "en")).toBe("Bathing ladder");
    expect(translateBoatText("Con patrón · 6 personas · Experiencia VIP", "es")).toBe(
      "Con patrón · 6 personas · Experiencia VIP"
    );
  });

  it("falls back to the original when there is no entry", () => {
    expect(translateBoatText("Nevera portátil de 40L", "en")).toBe("Nevera portátil de 40L");
  });
});
