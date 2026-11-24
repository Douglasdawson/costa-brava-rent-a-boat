/**
 * Single source of the title / meta description of a boat detail page (8 languages).
 *
 * Consumed by the SSR injector (server/seoInjector.ts, boat branch), by the client SEO config
 * (client/src/utils/seo-config.ts) and by BoatDetailPage, so the <title> a crawler reads in the
 * SSR shell is the same one React hydrates. Pure: no i18n bundle, no DB.
 *
 * Rules (CLAUDE.md): the price is the real minimum BLOCK of the boat ("desde 175 € / 2 h"), never
 * "/h" with a 2 h price; fuel is only claimed by boatIncludesFuel() and only while the licence-free
 * era lasts; the captained excursion never says "sin licencia"; no em dashes.
 */
import { boatIncludesFuel, isCaptainedBoat } from "./boatData";
import { isLicenseFreeEraActive } from "./constants";
import { filterActivePrices, getMaximumDuration } from "./pricing";
import { translateBoatText } from "./boatTextTranslations";

export interface BoatPageMetaInput {
  id: string;
  /** Raw (Spanish) boat name: the helper translates it. */
  name: string;
  capacity: number;
  requiresLicense: boolean;
  pricing?: unknown;
}

export interface BoatPageMeta {
  title: string;
  description: string;
}

type PricingShape = Record<string, { prices?: Record<string, number | null | undefined> | null } | null | undefined>;

export interface BoatPriceBlock {
  price: number;
  hours: number;
}

function durationHours(key: string): number {
  const n = parseFloat(key);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Cheapest sellable block of a boat across all seasons: price plus its duration, so the copy can
 * say "175 € / 2 h". Ignores 0 placeholders and durations above the boat's cap. Ties keep the
 * shorter block. Returns null when the boat has no active price.
 */
export function getBoatFromBlock(boatId: string, pricing: unknown): BoatPriceBlock | null {
  if (!pricing || typeof pricing !== "object") return null;
  const cap = getMaximumDuration(boatId, new Date());
  const maxHours = cap ? parseFloat(cap) : Infinity;
  let best: BoatPriceBlock | null = null;
  for (const season of Object.values(pricing as PricingShape)) {
    for (const [dur, price] of Object.entries(filterActivePrices(season?.prices))) {
      const hours = durationHours(dur);
      if (!hours || hours > maxHours) continue;
      if (!best || price < best.price || (price === best.price && hours < best.hours)) best = { price, hours };
    }
  }
  return best;
}

/**
 * BAJA price table the visible FAQ (and its FAQPage JSON-LD) publishes: only blocks the booking
 * accepts (licence-free boats are capped at 4 h). Same filter in client and SSR.
 */
export function boatFaqPricing(
  boatId: string,
  pricing: unknown,
): { BAJA: { prices: Record<string, number | null | undefined> } } | null {
  const prices = (pricing as PricingShape | null | undefined)?.BAJA?.prices;
  if (!prices) return null;
  const cap = getMaximumDuration(boatId, new Date());
  if (!cap) return { BAJA: { prices } };
  const maxHours = parseFloat(cap);
  return {
    BAJA: { prices: Object.fromEntries(Object.entries(prices).filter(([d]) => parseFloat(d) <= maxHours)) },
  };
}

/**
 * "Included" items shown in prose (FAQ answer, SSR body): translated to the page language, with the
 * insurance line dropped. Insurance has its own sentence (boatDetail.ssrInsurance, wording of
 * INSURANCE_SCOPE_ES with the seats limit), so no second, looser wording of it can appear.
 */
export function boatIncludedItems(included: readonly string[] | null | undefined, lang: string): string[] {
  return (included ?? []).filter((i) => !/seguro|insurance/i.test(i)).map((i) => translateBoatText(i, lang));
}

interface Labels {
  verb: string;
  prep: string;
  bookVerb: string;
  upTo: string;
  people: string;
  from: string;
  hour: string;
  cta: string;
  withLicense: string;
  withoutLicense: string;
  /** Post-era wording for the small boats (RD 1188/2025). */
  withoutLicensePostEra: string;
  fuelApart: string;
  fuelIncluded: string;
  excursionTitle: string;
  excursionDesc: string;
}

const L: Record<string, Labels> = {
  es: {
    verb: "Alquiler", prep: "en", bookVerb: "Alquila el", upTo: "Hasta", people: "personas", from: "desde", hour: "h",
    cta: "Reserva por WhatsApp.",
    withLicense: "con licencia", withoutLicense: "sin licencia", withoutLicensePostEra: "hasta 15 CV, con titulín",
    fuelApart: "combustible aparte", fuelIncluded: "gasolina incluida",
    excursionTitle: "Excursión Privada en Barco Blanes | Con Capitán",
    excursionDesc: "Contrata una excursión privada en barco con patrón en Blanes, Costa Brava. Hasta {n} personas, capitán incluido",
  },
  en: {
    verb: "Rent", prep: "in", bookVerb: "Book the", upTo: "Up to", people: "people", from: "from", hour: "h",
    cta: "Book via WhatsApp.",
    withLicense: "with license", withoutLicense: "without license", withoutLicensePostEra: "up to 15 HP, titulín required",
    fuelApart: "fuel apart", fuelIncluded: "fuel included",
    excursionTitle: "Private Boat Excursion Blanes | With Captain",
    excursionDesc: "Private boat trip with skipper in Blanes, Costa Brava. Up to {n} people, captain included",
  },
  ca: {
    verb: "Lloguer", prep: "a", bookVerb: "Lloga el", upTo: "Fins a", people: "persones", from: "des de", hour: "h",
    cta: "Reserva per WhatsApp.",
    withLicense: "amb llicència", withoutLicense: "sense llicència", withoutLicensePostEra: "fins a 15 CV, amb titulí",
    fuelApart: "combustible a part", fuelIncluded: "gasolina inclosa",
    excursionTitle: "Excursió Privada Vaixell Blanes | Amb Patró",
    excursionDesc: "Contracta una excursió privada en vaixell amb patró a Blanes, Costa Brava. Fins a {n} persones, patró inclòs",
  },
  fr: {
    verb: "Location", prep: "à", bookVerb: "Louez le", upTo: "Jusqu'à", people: "personnes", from: "dès", hour: "h",
    cta: "Réservez par WhatsApp.",
    withLicense: "avec permis", withoutLicense: "sans permis", withoutLicensePostEra: "15 CV max, avec titulín",
    fuelApart: "carburant en sus", fuelIncluded: "carburant inclus",
    excursionTitle: "Excursion Privée Bateau Blanes | Avec Capitaine",
    excursionDesc: "Réservez une excursion privée en bateau avec skipper à Blanes, Costa Brava. Jusqu'à {n} personnes, capitaine inclus",
  },
  de: {
    verb: "Mieten", prep: "in", bookVerb: "Mieten Sie das", upTo: "Bis zu", people: "Personen", from: "ab", hour: "h",
    cta: "Per WhatsApp buchen.",
    withLicense: "mit Lizenz", withoutLicense: "ohne Lizenz", withoutLicensePostEra: "bis 15 PS, mit Titulín",
    fuelApart: "Kraftstoff separat", fuelIncluded: "Kraftstoff inklusive",
    excursionTitle: "Private Bootsexkursion Blanes | Mit Kapitän",
    excursionDesc: "Buchen Sie eine private Bootsexkursion mit Skipper in Blanes, Costa Brava. Bis zu {n} Personen, Kapitän inklusive",
  },
  nl: {
    verb: "Huur", prep: "in", bookVerb: "Huur de", upTo: "Tot", people: "personen", from: "vanaf", hour: "uur",
    cta: "Boek via WhatsApp.",
    withLicense: "met vaarbewijs", withoutLicense: "zonder vaarbewijs", withoutLicensePostEra: "tot 15 pk, met titulín",
    fuelApart: "brandstof apart", fuelIncluded: "brandstof inbegrepen",
    excursionTitle: "Privé Boottocht Blanes | Met Schipper",
    excursionDesc: "Boek een privé boottocht met schipper in Blanes, Costa Brava. Tot {n} personen, schipper inbegrepen",
  },
  it: {
    verb: "Noleggio", prep: "a", bookVerb: "Noleggia il", upTo: "Fino a", people: "persone", from: "da", hour: "h",
    cta: "Prenota via WhatsApp.",
    withLicense: "con patente", withoutLicense: "senza patente", withoutLicensePostEra: "fino a 15 CV, con titulín",
    fuelApart: "carburante a parte", fuelIncluded: "carburante incluso",
    excursionTitle: "Escursione Privata Barca Blanes | Con Capitano",
    excursionDesc: "Prenota un'escursione privata in barca con skipper a Blanes, Costa Brava. Fino a {n} persone, capitano incluso",
  },
  ru: {
    verb: "Аренда", prep: "в", bookVerb: "Арендуйте", upTo: "До", people: "человек", from: "от", hour: "ч",
    cta: "Бронирование по WhatsApp.",
    withLicense: "с лицензией", withoutLicense: "без лицензии", withoutLicensePostEra: "до 15 л.с., с titulín",
    fuelApart: "топливо отдельно", fuelIncluded: "топливо включено",
    excursionTitle: "Частная экскурсия Бланес | С капитаном",
    excursionDesc: "Закажите частную экскурсию на лодке с капитаном в Бланесе, Коста Брава. До {n} человек, капитан включён",
  },
};

/**
 * schema.org offer of a boat page, derived from boat.pricing. One sellable price -> Offer;
 * several -> AggregateOffer with lowPrice / highPrice / offerCount. Never a per-hour
 * UnitPriceSpecification: 2 h blocks priced as "/h" is the misleading price this replaces.
 * Returns null when the boat has no active price (the caller then omits `offers`).
 */
export function buildBoatOffer(
  boatId: string,
  pricing: unknown,
  opts: { seasonYear: number; sellerId: string; sellerName: string },
): Record<string, unknown> | null {
  if (!pricing || typeof pricing !== "object") return null;
  const cap = getMaximumDuration(boatId, new Date());
  const maxHours = cap ? parseFloat(cap) : Infinity;
  const blocks: number[] = [];
  for (const season of Object.values(pricing as PricingShape)) {
    for (const [dur, price] of Object.entries(filterActivePrices(season?.prices))) {
      const hours = durationHours(dur);
      if (hours && hours <= maxHours) blocks.push(price);
    }
  }
  if (blocks.length === 0) return null;
  const low = Math.min(...blocks);
  const high = Math.max(...blocks);
  const common = {
    priceCurrency: "EUR",
    availability: "https://schema.org/InStock",
    availabilityStarts: `${opts.seasonYear}-04-01`,
    availabilityEnds: `${opts.seasonYear}-10-31`,
    priceValidUntil: `${opts.seasonYear}-10-31`,
    validFrom: `${opts.seasonYear}-04-01`,
    businessFunction: "http://purl.org/goodrelations/v1#LeaseOut",
    eligibleRegion: { "@type": "Country", name: "ES" },
    seller: { "@type": "LocalBusiness", name: opts.sellerName, "@id": opts.sellerId },
  };
  return low === high
    ? { "@type": "Offer", price: low, ...common }
    : { "@type": "AggregateOffer", lowPrice: low, highPrice: high, offerCount: blocks.length, ...common };
}

/** "desde 175 € / 2 h" for a boat, in the given language; "" when it has no active price. */
export function boatFromPriceLabel(boatId: string, pricing: unknown, lang: string): string {
  const l = L[lang] ?? L.es;
  const block = getBoatFromBlock(boatId, pricing);
  return block ? `${l.from} ${block.price} € / ${block.hours} ${l.hour}` : "";
}

const MAX_DESCRIPTION = 160;

/** Joins the parts while they fit in 160 chars: optional trailing parts (the CTA) go first. */
function fit(parts: string[]): string {
  const list = parts.filter(Boolean);
  while (list.length > 1 && list.join(" ").length > MAX_DESCRIPTION) list.pop();
  return list.join(" ");
}

export function buildBoatPageMeta(boat: BoatPageMetaInput, lang: string, now: Date = new Date()): BoatPageMeta {
  const l = L[lang] ?? L.es;
  const priceLabel = boatFromPriceLabel(boat.id, boat.pricing, lang);

  if (isCaptainedBoat(boat.id)) {
    return {
      title: priceLabel ? `${l.excursionTitle} | ${priceLabel}` : l.excursionTitle,
      description: fit([`${l.excursionDesc.replace("{n}", String(boat.capacity))}${priceLabel ? `, ${priceLabel}` : ""}.`, l.cta]),
    };
  }

  const name = translateBoatText(boat.name, lang);
  const eraActive = isLicenseFreeEraActive(now);
  const licenseText = boat.requiresLicense ? l.withLicense : eraActive ? l.withoutLicense : l.withoutLicensePostEra;
  const fuel = eraActive && boatIncludesFuel(boat.id, boat.requiresLicense) ? l.fuelIncluded : l.fuelApart;
  const head = `${l.bookVerb} ${name} ${l.prep} Blanes, Costa Brava.`;
  const specs = `${l.upTo} ${boat.capacity} ${l.people}, ${licenseText}, ${fuel}${priceLabel ? `, ${priceLabel}` : ""}.`;
  return {
    title: `${l.verb} ${name} ${l.prep} Blanes${priceLabel ? ` | ${priceLabel}` : ""}`,
    description: fit([head, specs, l.cta]),
  };
}
