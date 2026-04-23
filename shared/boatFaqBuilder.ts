/**
 * Pure builder for per-boat FAQ items (visible FAQ + FAQPage JSON-LD).
 *
 * Every answer is derived from data the admin edits in the CRM
 * (pricing, capacity, licenseType, included, requiresLicense), so
 * operational changes propagate without code edits.
 *
 * The caller passes a BoatFaqText bundle of translated strings;
 * this module stays free of any i18n import.
 */

export type BoatLicenseType =
  | "none"
  | "navegacion"
  | "pnb"
  | "per"
  | "patron_yate"
  | "capitan_yate";

export type BoatFaqInput = {
  name: string;
  capacity: number;
  requiresLicense: boolean;
  licenseType?: BoatLicenseType | string | null;
  pricing?: {
    BAJA?: { prices?: Record<string, number | null | undefined> | null } | null;
  } | null;
  included?: string[] | null;
};

export type BoatFaqText = {
  title: string;
  q1: string;
  a1Intro: string;
  a1PackItem: string;
  a1Empty: string;
  q2: string;
  a2: string;
  audienceSmall: string;
  audienceMedium: string;
  audienceLarge: string;
  q3: string;
  a3None: string;
  a3Licensed: string;
  a3Fallback: string;
  q4: string;
  a4Base: string;
  a4Empty: string;
  a4FuelIncluded: string;
  a4FuelNotIncluded: string;
  q5: string;
  a5: string;
  licenseTypes: Partial<Record<BoatLicenseType, string>> & Record<string, string>;
};

export type BoatFaqItem = { question: string; answer: string };

export function buildBoatFaqItems(
  boat: BoatFaqInput,
  text: BoatFaqText,
): BoatFaqItem[] {
  return [
    { question: interpolate(text.q1, { name: boat.name }), answer: buildPriceAnswer(boat, text) },
    { question: interpolate(text.q2, { name: boat.name }), answer: buildCapacityAnswer(boat, text) },
    { question: interpolate(text.q3, { name: boat.name }), answer: buildLicenseAnswer(boat, text) },
    { question: interpolate(text.q4, { name: boat.name }), answer: buildIncludedAnswer(boat, text) },
    { question: text.q5, answer: text.a5 },
  ];
}

export function buildBoatFaqTitle(boat: Pick<BoatFaqInput, "name">, text: BoatFaqText): string {
  return interpolate(text.title, { name: boat.name });
}

function buildPriceAnswer(boat: BoatFaqInput, text: BoatFaqText): string {
  const pricesRaw = boat.pricing?.BAJA?.prices ?? {};
  const activePacks = Object.entries(pricesRaw)
    .map(([durationKey, price]) => ({
      durationKey,
      hours: parseDurationHours(durationKey),
      price: typeof price === "number" ? price : 0,
    }))
    .filter((p) => p.hours > 0 && p.price > 0)
    .sort((a, b) => a.hours - b.hours);

  if (activePacks.length === 0) {
    return text.a1Empty;
  }

  const packList = activePacks
    .map((p) =>
      interpolate(text.a1PackItem, {
        hours: formatHours(p.hours),
        price: String(p.price),
      }),
    )
    .join(", ");

  return `${text.a1Intro} ${packList}.`;
}

function buildCapacityAnswer(boat: BoatFaqInput, text: BoatFaqText): string {
  const audience =
    boat.capacity <= 4
      ? text.audienceSmall
      : boat.capacity <= 6
        ? text.audienceMedium
        : text.audienceLarge;
  return interpolate(text.a2, {
    name: boat.name,
    capacity: String(boat.capacity),
    audience,
  });
}

function buildLicenseAnswer(boat: BoatFaqInput, text: BoatFaqText): string {
  if (!boat.requiresLicense) {
    return interpolate(text.a3None, { name: boat.name });
  }

  // Licensed path. licenseType='none' alongside requiresLicense=true is an
  // inconsistent admin state — treat it as unknown and use the fallback
  // ("licencia náutica en vigor") instead of the literal "No requiere
  // licencia" label, which would produce an absurd sentence.
  const typeKey = boat.licenseType ?? "";
  const hasRealType = typeKey && typeKey !== "none" && text.licenseTypes[typeKey];
  const licenseLabel = hasRealType ? text.licenseTypes[typeKey] : text.a3Fallback;

  return interpolate(text.a3Licensed, {
    name: boat.name,
    license: licenseLabel,
  });
}

// Matches fuel-like entries across the site languages so the admin's
// included[] doesn't contradict the authoritative fuel sentence when
// requiresLicense=true (business rule: licensed boats never include fuel).
const FUEL_ITEM_PATTERN = /\b(carburante|gasolina|combustible|fuel|brandstof|kraftstoff|carburant|topliv|benzin)/i;

function buildIncludedAnswer(boat: BoatFaqInput, text: BoatFaqText): string {
  const raw = (boat.included ?? []).filter((s) => typeof s === "string" && s.trim().length > 0);
  // Dedupe preserving first occurrence (admin data sometimes has "Seguro" and
  // "Seguro embarcación y ocupantes" as separate entries — we collapse exact
  // case-insensitive duplicates at minimum).
  const seen = new Set<string>();
  const items: string[] = [];
  for (const entry of raw) {
    const normalized = entry.trim();
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    // On licensed boats, strip fuel-like entries. The fuel sentence below
    // (a4FuelNotIncluded) is the single source of truth; letting both live
    // produces public-facing contradictions when admin data is stale.
    if (boat.requiresLicense && FUEL_ITEM_PATTERN.test(normalized)) continue;
    seen.add(key);
    items.push(normalized);
  }
  const fuelSentence = boat.requiresLicense ? text.a4FuelNotIncluded : text.a4FuelIncluded;

  const base =
    items.length === 0
      ? text.a4Empty
      : interpolate(text.a4Base, { items: items.join(", ") });

  return `${base} ${fuelSentence}`.trim();
}

function interpolate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${escapeRegex(key)}\\}`, "g"), value);
  }
  return result;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseDurationHours(durationKey: string): number {
  const match = durationKey.match(/^(\d+(?:\.\d+)?)h$/i);
  return match ? parseFloat(match[1]) : 0;
}

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : hours.toString();
}
