// Shared Intl locale helpers. Centralised so the wizard, summary, and any
// future date-formatting code agree on the BCP 47 tag for each supported
// language. Previously the mapping was duplicated in BookingWizardMobile and
// BookingFormDesktop, and the calendar trigger inputs were hardcoded to
// "es-ES" — which made the selected date render as "12 may. 2026" in /de/
// while the summary card below it correctly read "12. Mai 2026".

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES",
  ca: "ca-ES",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
  nl: "nl-NL",
  it: "it-IT",
  ru: "ru-RU",
};

/** Returns the BCP 47 locale for one of the project's UI language codes.
 *  Falls back to es-ES when the language isn't recognised. */
export function getLocaleForLanguage(language: string | undefined | null): string {
  if (!language) return "es-ES";
  return LOCALE_MAP[language] ?? "es-ES";
}

/** Formats an ISO date string (YYYY-MM-DD) for display in the user's UI
 *  language. Pass options to override the default (day numeric, month long,
 *  year numeric). Returns the original string on parse failure. */
export function formatBookingDate(
  dateStr: string,
  language: string,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
): string {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString(getLocaleForLanguage(language), options);
  } catch {
    return dateStr;
  }
}
