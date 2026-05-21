/**
 * Countries shown in the nautical license verifier.
 * ISO-3166-1 alpha-2 codes. Localised display names come from Intl.DisplayNames.
 *
 * Order: Costa Brava tourism priorities first, then alphabetical by ISO code.
 * Includes every EEE country, every ICC-issuing country (UN/ECE Res. 40),
 * and major non-EEE tourism origins for Spain.
 */

export interface LicenseCountry {
  iso2: string;
  flag: string;
}

function flagFromIso(iso2: string): string {
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

const PRIORITY_ISO2 = ["ES", "FR", "GB", "DE", "NL", "BE", "IT", "PT", "CH", "US"];

const ALL_ISO2 = [
  "AR", "AT", "AU", "BE", "BG", "BR", "CA", "CH", "CL", "CN",
  "CO", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GB",
  "GR", "HR", "HU", "IE", "IL", "IN", "IS", "IT", "JP", "KR",
  "LI", "LT", "LU", "LV", "MA", "MD", "MT", "MX", "NL", "NO",
  "NZ", "PE", "PL", "PT", "RO", "RS", "RU", "SE", "SI", "SK",
  "TR", "UA", "US", "UY", "VE", "ZA",
];

function uniq(arr: string[]): string[] {
  return Array.from(new Set(arr));
}

const ORDERED = uniq([...PRIORITY_ISO2, ...ALL_ISO2]);

export const LICENSE_COUNTRIES: LicenseCountry[] = ORDERED.map((iso2) => ({
  iso2,
  flag: flagFromIso(iso2),
}));

export function findCountry(iso2: string): LicenseCountry | undefined {
  const upper = iso2.toUpperCase();
  return LICENSE_COUNTRIES.find((c) => c.iso2 === upper);
}

/** Display name for an ISO-2 code in the given language, with English fallback. */
export function getCountryDisplayName(iso2: string, language: string): string {
  try {
    const dn = new Intl.DisplayNames([language], { type: "region" });
    const name = dn.of(iso2.toUpperCase());
    if (name) return name;
  } catch {
    // Intl.DisplayNames may throw on unsupported locales — fall through.
  }
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(iso2.toUpperCase()) || iso2;
  } catch {
    return iso2;
  }
}
