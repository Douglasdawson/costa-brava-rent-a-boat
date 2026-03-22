export const SUPPORTED_LANGUAGES = ["es", "en", "ca", "fr", "de", "nl", "it", "ru"] as const;
export type LangCode = (typeof SUPPORTED_LANGUAGES)[number];
export const HREFLANG_CODES: Record<LangCode, string> = {
  es: "es-ES", en: "en-GB", ca: "ca", fr: "fr-FR",
  de: "de-DE", nl: "nl-NL", it: "it-IT", ru: "ru-RU",
};
