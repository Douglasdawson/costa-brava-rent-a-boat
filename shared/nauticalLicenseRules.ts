/**
 * Nautical license recognition rules for Spain.
 *
 * Legal source: Real Decreto 875/2014, de 10 de octubre.
 * https://www.boe.es/eli/es/rd/2014/10/10/875
 *
 * Practical summary:
 * - EEE citizens may use their national title in Spanish boats, with the
 *   attributions their own title confers in their country.
 * - Non-EEE: typically only valid with an ICC (International Certificate of
 *   Competence, UN/ECE Resolution 40).
 * - Rest of the world without ICC: not directly recognised — usually requires
 *   obtaining a Spanish title or proceeding via Capitanía Marítima.
 *
 * The result of `verifyLicense` is orientation only. The final authorisation
 * always depends on Capitanía Marítima.
 */

export const EEE_COUNTRIES = [
  "ES", "FR", "DE", "IT", "PT", "NL", "BE", "AT", "IE", "DK",
  "SE", "FI", "PL", "CZ", "SK", "HU", "RO", "BG", "HR", "SI",
  "EE", "LV", "LT", "LU", "MT", "CY", "GR", "IS", "LI", "NO",
] as const;

export const ICC_ISSUING_COUNTRIES = [
  "GB", "CH", "UA", "RU", "TR", "ZA", "AU", "NZ", "IL", "RS", "MD",
] as const;

export type EeeCountry = (typeof EEE_COUNTRIES)[number];
export type IccIssuingCountry = (typeof ICC_ISSUING_COUNTRIES)[number];

export type LicenseVerificationStatus =
  | "valid"
  | "probably_valid"
  | "needs_icc"
  | "not_recognized"
  | "insufficient"
  | "unknown";

/** Spanish recreational license levels, ordered by attributions (low → high). */
export const SPANISH_LICENSE_LEVELS = [
  "navegacion",      // LBN (legacy / very basic)
  "pnb",             // Patrón para Navegación Básica
  "per",             // Patrón de Embarcaciones de Recreo
  "patron_yate",     // Patrón de Yate
  "capitan_yate",    // Capitán de Yate
] as const;
export type SpanishLicenseLevel = (typeof SPANISH_LICENSE_LEVELS)[number];

const LEVEL_RANK: Record<SpanishLicenseLevel, number> = {
  navegacion: 1,
  pnb: 2,
  per: 3,
  patron_yate: 4,
  capitan_yate: 5,
};

/**
 * Minimum Spanish level needed to operate any "with-license" boat in the
 * Costa Brava Rent a Boat fleet (Mingolla Brava 19, Trimarchi 57S, Pacific
 * Craft 625). All three are bounded by ≤ 6.24m and 80–115cv — PNB is the
 * de facto common threshold.
 */
export const FLEET_MIN_LICENSE: SpanishLicenseLevel = "pnb";

/**
 * A foreign nautical title shown to the user with its (orientative) Spanish
 * equivalence. Equivalences come from commonly cited references (ICC + EU
 * reciprocity tables); they are NOT a legal pronouncement.
 *
 * `spanishEquivalent: null` means "no automatic mapping" — used for the catch-all
 * "Other" chip so the user can still declare an unrecognised title.
 */
export interface ForeignLicense {
  code: string;
  label: string;
  spanishEquivalent: SpanishLicenseLevel | null;
}

/**
 * Top-8 country-specific catalogue. Labels are in native language because they
 * are proper nouns (e.g., a French user recognises "Permis Côtier", not its
 * translation).
 */
export const COUNTRY_LICENSES: Record<string, ForeignLicense[]> = {
  ES: [
    { code: "pnb", label: "PNB · Patrón para Navegación Básica", spanishEquivalent: "pnb" },
    { code: "per", label: "PER · Patrón de Embarcaciones de Recreo", spanishEquivalent: "per" },
    { code: "patron_yate", label: "Patrón de Yate", spanishEquivalent: "patron_yate" },
    { code: "capitan_yate", label: "Capitán de Yate", spanishEquivalent: "capitan_yate" },
  ],
  FR: [
    { code: "permis_cotier", label: "Permis Côtier", spanishEquivalent: "pnb" },
    { code: "permis_hauturier", label: "Permis Hauturier", spanishEquivalent: "per" },
  ],
  IT: [
    { code: "patente_12m", label: "Patente Nautica entro 12 miglia", spanishEquivalent: "pnb" },
    { code: "patente_oltre12m", label: "Patente Nautica oltre 12 miglia", spanishEquivalent: "per" },
    { code: "patente_senza_limiti", label: "Patente Nautica senza alcun limite", spanishEquivalent: "patron_yate" },
  ],
  DE: [
    { code: "sbf_see", label: "SBF See (Sportbootführerschein See)", spanishEquivalent: "pnb" },
    { code: "sks", label: "Sportküstenschifferschein (SKS)", spanishEquivalent: "per" },
    { code: "sse", label: "Sportseeschifferschein (SSE)", spanishEquivalent: "patron_yate" },
    { code: "shs", label: "Sporthochseeschifferschein (SHS)", spanishEquivalent: "capitan_yate" },
  ],
  GB: [
    { code: "rya_powerboat_2", label: "RYA Powerboat Level 2", spanishEquivalent: "pnb" },
    { code: "rya_day_skipper", label: "RYA Day Skipper", spanishEquivalent: "per" },
    { code: "rya_coastal_skipper", label: "RYA Coastal Skipper", spanishEquivalent: "patron_yate" },
    { code: "rya_yachtmaster", label: "RYA Yachtmaster (Coastal / Offshore)", spanishEquivalent: "capitan_yate" },
    { code: "icc", label: "ICC (International Certificate of Competence)", spanishEquivalent: "per" },
  ],
  PT: [
    { code: "marinheiro", label: "Carta de Marinheiro", spanishEquivalent: "pnb" },
    { code: "patrao_local", label: "Carta de Patrão Local", spanishEquivalent: "pnb" },
    { code: "patrao_costa", label: "Carta de Patrão de Costa", spanishEquivalent: "per" },
    { code: "patrao_alto_mar", label: "Carta de Patrão de Alto Mar", spanishEquivalent: "patron_yate" },
  ],
  NL: [
    { code: "klein_vaarbewijs_2", label: "Klein Vaarbewijs II", spanishEquivalent: "pnb" },
    { code: "groot_pleziervaartbewijs", label: "Groot Pleziervaartbewijs", spanishEquivalent: "per" },
  ],
  BE: [
    { code: "beperkt_stuurbrevet", label: "Beperkt Stuurbrevet", spanishEquivalent: "pnb" },
    { code: "algemeen_stuurbrevet", label: "Algemeen Stuurbrevet", spanishEquivalent: "per" },
    { code: "yachtman_brevet", label: "Yachtman Brevet", spanishEquivalent: "patron_yate" },
  ],
};

/**
 * Fallback list for non-curated countries.
 *
 * Only ICC has a defensible equivalence (PER, via UN/ECE Resolution 40).
 * We deliberately do NOT include generic "basic / advanced" national chips
 * because that would claim an equivalence we cannot guarantee — every country
 * defines its own license tiers differently. The "Otra" path triggers the
 * ICC question and falls back to a manual check via WhatsApp.
 */
export const GENERIC_LICENSES: ForeignLicense[] = [
  { code: "icc", label: "ICC (International Certificate of Competence)", spanishEquivalent: "per" },
  { code: "other", label: "Otra", spanishEquivalent: null },
];

export function getLicensesForCountry(country: string): ForeignLicense[] {
  const upper = (country || "").toUpperCase();
  return COUNTRY_LICENSES[upper] ?? GENERIC_LICENSES;
}

export function findLicense(country: string, licenseCode: string): ForeignLicense | undefined {
  if (!licenseCode) return undefined;
  return getLicensesForCountry(country).find((l) => l.code === licenseCode);
}

export function isEeeCountry(country: string): country is EeeCountry {
  return (EEE_COUNTRIES as readonly string[]).includes(country);
}

export function isIccIssuingCountry(country: string): country is IccIssuingCountry {
  return (ICC_ISSUING_COUNTRIES as readonly string[]).includes(country);
}

export interface VerifyLicenseInput {
  country: string;
  hasIcc: boolean | null;
  licenseCode: string;
}

export interface VerifyLicenseResult {
  status: LicenseVerificationStatus;
  reasonKey: string;
  /** Declared license's equivalent in the Spanish system. null when no mapping. */
  spanishEquivalent: SpanishLicenseLevel | null;
  /** true when `spanishEquivalent` is at least `FLEET_MIN_LICENSE`. */
  meetsFleetMinimum: boolean;
}

const EMPTY_RESULT = (
  status: LicenseVerificationStatus,
  reasonKey: string,
  spanishEquivalent: SpanishLicenseLevel | null = null,
  meetsFleetMinimum = false,
): VerifyLicenseResult => ({ status, reasonKey, spanishEquivalent, meetsFleetMinimum });

export function verifyLicense({ country, hasIcc, licenseCode }: VerifyLicenseInput): VerifyLicenseResult {
  const upper = (country || "").toUpperCase();

  if (!upper) return EMPTY_RESULT("unknown", "missing_country");

  const lic = findLicense(upper, licenseCode);
  const eq = lic?.spanishEquivalent ?? null;
  const meets = eq != null && LEVEL_RANK[eq] >= LEVEL_RANK[FLEET_MIN_LICENSE];

  if (isEeeCountry(upper)) {
    if (!eq) return EMPTY_RESULT("not_recognized", "no_equivalent");
    return meets
      ? EMPTY_RESULT("valid", "eee_equivalent_sufficient", eq, true)
      : EMPTY_RESULT("insufficient", "eee_equivalent_below_min", eq, false);
  }

  // Non-EEE branch.
  const userHasIcc = hasIcc === true || licenseCode === "icc";
  if (userHasIcc) {
    if (!eq) return EMPTY_RESULT("probably_valid", "icc_declared", "per", true);
    return meets
      ? EMPTY_RESULT("probably_valid", "icc_or_equivalent_declared", eq, true)
      : EMPTY_RESULT("insufficient", "icc_equivalent_below_min", eq, false);
  }
  if (isIccIssuingCountry(upper)) {
    return EMPTY_RESULT("needs_icc", "country_issues_icc", eq, false);
  }
  return EMPTY_RESULT("not_recognized", "no_recognition_path", eq, false);
}
