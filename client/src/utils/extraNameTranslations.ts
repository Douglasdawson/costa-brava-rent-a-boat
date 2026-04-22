/**
 * Translate the Spanish extras[].name values from shared/boatData.ts.
 * Used by BoatDetailPage, BookingFormDesktop, and BookingWizardMobile so
 * the same extras render consistently across the detail tab and the
 * booking modal. Exact-match lookup — names not listed fall through to
 * the original (intentional for international terms like "Snorkel",
 * "Paddle Surf", "Seascooter" that are the same in every supported lang).
 */

type LangCode = "es" | "en" | "ca" | "fr" | "de" | "nl" | "it" | "ru";

const EXTRA_NAME_TRANSLATIONS: Record<string, Partial<Record<LangCode, string>>> = {
  "Parking delante del Barco": {
    en: "Parking in front of the boat",
    fr: "Parking devant le bateau",
    de: "Parkplatz direkt am Boot",
    nl: "Parkeren voor de boot",
    it: "Parcheggio davanti alla barca",
    ru: "Парковка перед лодкой",
    ca: "Aparcament davant del vaixell",
  },
  "Nevera": {
    en: "Cooler", fr: "Glacière", de: "Kühlbox", nl: "Koelbox",
    it: "Frigo portatile", ru: "Холодильник", ca: "Nevera",
  },
  "Bebidas": {
    en: "Drinks", fr: "Boissons", de: "Getränke", nl: "Drankjes",
    it: "Bevande", ru: "Напитки", ca: "Begudes",
  },
  "Agua y refrescos": {
    en: "Water & soft drinks", fr: "Eau et rafraîchissements", de: "Wasser & Erfrischungen",
    nl: "Water & frisdrank", it: "Acqua e bibite", ru: "Вода и напитки", ca: "Aigua i refrescs",
  },
  "Pack Basic": {
    en: "Basic Pack", fr: "Pack Basic", de: "Basic-Paket", nl: "Basic-pakket",
    it: "Pacchetto Basic", ru: "Пакет Basic", ca: "Pack Basic",
  },
  "Pack Aventura": {
    en: "Adventure Pack", fr: "Pack Aventure", de: "Abenteuer-Paket", nl: "Avonturen-pakket",
    it: "Pacchetto Avventura", ru: "Пакет Приключение", ca: "Pack Aventura",
  },
  "Pack Premium": {
    en: "Premium Pack", fr: "Pack Premium", de: "Premium-Paket", nl: "Premium-pakket",
    it: "Pacchetto Premium", ru: "Пакет Premium", ca: "Pack Premium",
  },
};

export function translateExtraName(name: string, language: string): string {
  if (language === "es") return name;
  return EXTRA_NAME_TRANSLATIONS[name]?.[language as LangCode] ?? name;
}
