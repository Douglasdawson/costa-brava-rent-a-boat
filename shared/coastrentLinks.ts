/**
 * Cross-linking hacia Coast Rent (coastrent.es), la tienda de vehículos de tierra del mismo
 * propietario en Lloret de Mar: scooters, motos, bicis, paddle surf y patinetes eléctricos.
 *
 * Regla de negocio: misma propiedad y categorías que no se pisan. CBRB no vende nada de
 * tierra, así que aquí NO hace falta blocklist de canibalización (a diferencia de
 * activitatumLinks.ts). Lo que sí hay es una lista CERRADA de destinos con su slug por idioma:
 * nadie arma URLs a coastrent.es a mano, porque el slug cambia por idioma y una URL inventada
 * acaba en 404 (y sin UTM, que es con lo que se mide si esto sirve para algo).
 *
 * Desde el 1-feb-2027 la segunda tienda de Coast Rent (Centro Comercial Carabela, Lloret de
 * Mar) es además la oficina de venta y reservas de los barcos de CBRB. Los barcos siguen
 * saliendo del Puerto de Blanes: en Lloret hay oficina, no barcos. Toda superficie que lo
 * mencione lo gatea con carabelaOpen() y dice siempre de dónde salen los barcos.
 *
 * Fuente de los datos del local: coastrent/shared/stores.ts (copiados tal cual).
 */

import type { LangCode } from "./seoConstants";

export const COASTRENT_DOMAIN = "https://coastrent.es";

/** Nodo Organization de Coast Rent en su propio JSON-LD. Aquí se referencia, nunca se redefine. */
export const COASTRENT_ORG_ID = "https://coastrent.es/#organization";

/** Slugs por idioma de las páginas de Coast Rent que enlazamos. Lista cerrada: si no está, no se enlaza. */
export const COASTRENT_PATHS = {
  home: { es: "", en: "", ca: "", fr: "", de: "", nl: "", it: "", ru: "" },
  catalog: {
    es: "catalogo",
    en: "catalog",
    ca: "cataleg",
    fr: "catalogue",
    de: "katalog",
    nl: "catalogus",
    it: "catalogo",
    ru: "katalog",
  },
  paddle: {
    es: "alquiler-paddle-surf",
    en: "paddle-board-rental",
    ca: "lloguer-paddle-surf",
    fr: "location-paddle",
    de: "sup-verleih",
    nl: "sup-huren",
    it: "noleggio-sup",
    ru: "arenda-sup",
  },
  bikes: {
    es: "alquiler-bicicletas",
    en: "bike-rental",
    ca: "lloguer-bicicletes",
    fr: "location-velos",
    de: "fahrradverleih",
    nl: "fietsverhuur",
    it: "noleggio-bici",
    ru: "prokat-velosipedov",
  },
  escooters: {
    es: "alquiler-patinetes-electricos",
    en: "e-scooter-rental",
    ca: "lloguer-patinets-electrics",
    fr: "location-trottinettes-electriques",
    de: "e-scooter-verleih",
    nl: "e-step-huren",
    it: "noleggio-monopattini-elettrici",
    ru: "arenda-elektrosamokatov",
  },
} as const satisfies Record<string, Record<LangCode, string>>;

export type CoastrentDestination = keyof typeof COASTRENT_PATHS;

/** Superficie desde la que sale el enlace. Se lee en GA4 como utm_campaign. */
export type CoastrentSurface =
  | "bridge"
  | "landing-lloret"
  | "contact"
  | "post-booking"
  | "email"
  | "picks";

/** URL absoluta a Coast Rent en el idioma del visitante y con los tres UTM. */
export function coastrentUrl(
  key: CoastrentDestination,
  lang: string,
  surface: CoastrentSurface
): string {
  // Coast Rent sirve los mismos 8 idiomas que nosotros; un código desconocido cae al inglés.
  const l = (lang in COASTRENT_PATHS.home ? lang : "en") as LangCode;
  const slug = COASTRENT_PATHS[key][l];
  const path = slug ? `/${l}/${slug}` : `/${l}`;
  return `${COASTRENT_DOMAIN}${path}?utm_source=cbrb&utm_medium=referral&utm_campaign=${surface}`;
}

/** Segunda tienda de Coast Rent y oficina de reservas de CBRB en Lloret. Fuente: coastrent/shared/stores.ts. */
export const CARABELA = {
  id: "https://coastrent.es/#store-carabela",
  name: "Coast Rent - Paddle Surf, Bikes & Tickets",
  streetAddress: "Avinguda Just Marlès Vilarrodona 2 (Centro Comercial Carabela)",
  postalCode: "17310",
  locality: "Lloret de Mar",
  region: "Girona",
  country: "ES",
  latitude: 41.6975588,
  longitude: 2.844391,
  telephone: "+34 611 500 372",
  opens: "10:00",
  closes: "20:00",
  opensOn: "2027-02-01",
  mapsUrl: "https://www.google.com/maps?cid=6075411723544599165",
  /** Etiqueta corta para UI y fallbacks SSR. Nombre propio del centro, igual en los 8 idiomas. */
  shortLabel: "Coast Rent, Centro Comercial Carabela, Av. Just Marlès 2",
} as const;

/**
 * Si la tienda de Carabela ya está abierta. Acepta un `yyyy-mm-dd` (tests) o una fecha, que se
 * lee en Europe/Madrid igual que isLicenseFreeEraActive(): el cambio es a medianoche de aquí.
 */
export function carabelaOpen(date: Date | string = new Date()): boolean {
  const day =
    typeof date === "string"
      ? date
      : date.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  return day >= CARABELA.opensOn;
}

/**
 * Nodo `hasPOS` para el LocalBusiness de CBRB (home, /api/ai-context y la copia cliente).
 * Un solo generador para que la dirección no se teclee tres veces. `validFrom` dice desde
 * cuándo vale el horario, así que el nodo se puede publicar antes de la apertura.
 */
export function carabelaPosJsonLd() {
  return {
    "@type": "LocalBusiness",
    "@id": CARABELA.id,
    name: CARABELA.name,
    url: COASTRENT_DOMAIN,
    parentOrganization: { "@id": COASTRENT_ORG_ID },
    telephone: CARABELA.telephone.replace(/\s/g, ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: CARABELA.streetAddress,
      addressLocality: CARABELA.locality,
      postalCode: CARABELA.postalCode,
      addressRegion: CARABELA.region,
      addressCountry: CARABELA.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: CARABELA.latitude, longitude: CARABELA.longitude },
    hasMap: CARABELA.mapsUrl,
    openingHours: `Mo-Su ${CARABELA.opens}-${CARABELA.closes}`,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: CARABELA.opens,
        closes: CARABELA.closes,
        validFrom: CARABELA.opensOn,
      },
    ],
  };
}
