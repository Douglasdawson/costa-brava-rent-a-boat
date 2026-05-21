// Infer the customer's likely native language from their phone prefix, and
// resolve which language to actually use when rendering localized messages
// (WhatsApp thank-you, future emails, etc.).
//
// Why: booking.language is set from the URL path during checkout (`/es/`,
// `/en/`, ...). A German tourist who browsed the site in Spanish gets
// language="es" — and then receives the post-trip review request in Spanish.
// Their phone prefix (+49) is a stronger signal of their native language than
// the URL path they happened to land on.
//
// Mapping is the inverse of LANGUAGE_TO_PREFIX in
// client/src/utils/phone-prefixes.ts. Kept here (in shared/) because server
// code cannot import from client/.

const PHONE_PREFIX_TO_LANGUAGE: Record<string, string> = {
  "34": "es",
  "44": "en",
  "33": "fr",
  "49": "de",
  "31": "nl",
  "39": "it",
  "7": "ru",
};

// Prefixes sorted longest-first so multi-digit prefixes match before shorter
// ones (e.g. "+44" before "+4" would matter if "+4" existed). Cheap memoization
// — the map is small and static.
const PREFIXES_LONGEST_FIRST = Object.keys(PHONE_PREFIX_TO_LANGUAGE).sort(
  (a, b) => b.length - a.length,
);

export function inferLanguageFromPhone(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;

  // Strip everything that isn't a digit: "+49 176 1234567" -> "491761234567";
  // "(49) 176-1234" -> "491761234"; "N/A" -> "".
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  // Some clients store the international prefix as "00" instead of "+"
  // (e.g. "0049176..."). Strip a leading "00" so the digits look the same.
  if (digits.startsWith("00")) {
    digits = digits.slice(2);
    if (!digits) return null;
  }

  for (const prefix of PREFIXES_LONGEST_FIRST) {
    if (digits.startsWith(prefix)) {
      return PHONE_PREFIX_TO_LANGUAGE[prefix];
    }
  }

  return null;
}

/**
 * Decide which language to use when rendering a localized message for a
 * booking. Returns the resolved language (always a non-empty string).
 *
 * Rule: if `bookingLanguage` is "es" (the default that the web applies when
 * the customer browsed `/es/`) AND the phone prefix infers a different
 * language, prefer the inferred language. Otherwise trust `bookingLanguage`.
 *
 * Known limitation: an operator who deliberately picks "es" for a +49
 * customer via the CRM LanguageSelect will see the dropdown "snap back" to
 * "de" on the next render. Workaround: pick any other language code.
 * Resolving this cleanly would require a `languageOverridden` column.
 */
export function resolveEffectiveLanguage(
  bookingLanguage: string | null | undefined,
  customerPhone: string | null | undefined,
): string {
  const stored = (bookingLanguage ?? "").toLowerCase().slice(0, 2) || "es";

  if (stored === "es") {
    const inferred = inferLanguageFromPhone(customerPhone);
    if (inferred && inferred !== "es") {
      return inferred;
    }
  }

  return stored;
}
