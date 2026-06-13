// Server-side strings for the merch shop surfaces that the client i18n
// bundles cannot reach: Stripe Checkout (line item names, shipping labels)
// and transactional emails. Same pattern as EMAIL_STRINGS in emailService.ts.

import type { LangCode } from "@shared/seoConstants";
import { getShopVariant } from "@shared/shopData";

export interface ShopLangStrings {
  tee: string;
  tote: string;
  colors: Record<string, string>;
  pickup: string;
  pickupLaura: string;
  shipping: string;
  orderConfirmedSubject: string;
  orderConfirmedTitle: string;
  orderConfirmedIntro: string;
  orderSummary: string;
  deliveryTitle: string;
  pickupInstructions: string;
  pickupLauraInstructions: string;
  shippingInstructions: string;
  totalLabel: string;
  shippingCostLabel: string;
  questions: string;
}

/** Instructions for a given delivery method, in the order's language. */
export function deliveryInstructions(method: string, s: ShopLangStrings): string {
  if (method === "shipping") return s.shippingInstructions;
  if (method === "pickup_laura") return s.pickupLauraInstructions;
  return s.pickupInstructions;
}

export const SHOP_STRINGS: Record<LangCode, ShopLangStrings> = {
  es: {
    tee: "Camiseta Costa Brava Culture",
    tote: "Tote bag Costa Brava Culture",
    colors: { butter: "amarillo mantequilla", navy: "azul marino", royal: "azul royal" },
    pickup: "Recogida en el Puerto de Blanes (gratis)",
    pickupLaura: "Recogida en Laura Cabanas, Lloret de Mar (gratis)",
    shipping: "Envio a domicilio (Espana)",
    orderConfirmedSubject: "Pedido confirmado",
    orderConfirmedTitle: "Tu pedido esta confirmado",
    orderConfirmedIntro: "Gracias por tu compra. Aqui tienes el resumen:",
    orderSummary: "Resumen del pedido",
    deliveryTitle: "Entrega",
    pickupInstructions: "Recogeras tu pedido en el Puerto de Blanes. Te escribiremos para coordinar el momento; tambien puedes pasarte el dia de tu salida en barco.",
    pickupLauraInstructions: "Recogeras tu pedido en la tienda de Laura Cabanas, en Carrer del Carme 5, Lloret de Mar. Te escribiremos para confirmar horario y direccion exacta.",
    shippingInstructions: "Enviaremos tu pedido a la direccion indicada en unos 3-7 dias laborables.",
    totalLabel: "Total",
    shippingCostLabel: "Envio",
    questions: "Si tienes cualquier duda, escribenos a costabravarentaboat@gmail.com o al +34 611 500 372.",
  },
  en: {
    tee: "Costa Brava Culture T-shirt",
    tote: "Costa Brava Culture tote bag",
    colors: { butter: "butter yellow", navy: "navy", royal: "royal blue" },
    pickup: "Pickup at the Port of Blanes (free)",
    pickupLaura: "Pickup at Laura Cabanas store, Lloret de Mar (free)",
    shipping: "Home delivery (Spain)",
    orderConfirmedSubject: "Order confirmed",
    orderConfirmedTitle: "Your order is confirmed",
    orderConfirmedIntro: "Thank you for your purchase. Here is your summary:",
    orderSummary: "Order summary",
    deliveryTitle: "Delivery",
    pickupInstructions: "You will pick up your order at the Port of Blanes. We will contact you to arrange a time; you can also collect it on the day of your boat trip.",
    pickupLauraInstructions: "You will pick up your order at the Laura Cabanas store in Carrer del Carme 5, Lloret de Mar. We will write to confirm opening hours and the exact address.",
    shippingInstructions: "We will ship your order to the address provided within 3-7 business days.",
    totalLabel: "Total",
    shippingCostLabel: "Shipping",
    questions: "If you have any questions, write to costabravarentaboat@gmail.com or call +34 611 500 372.",
  },
  ca: {
    tee: "Samarreta Costa Brava Culture",
    tote: "Tote bag Costa Brava Culture",
    colors: { butter: "groc mantega", navy: "blau mari", royal: "blau royal" },
    pickup: "Recollida al Port de Blanes (gratis)",
    pickupLaura: "Recollida a Laura Cabanas, Lloret de Mar (gratis)",
    shipping: "Enviament a domicili (Espanya)",
    orderConfirmedSubject: "Comanda confirmada",
    orderConfirmedTitle: "La teva comanda esta confirmada",
    orderConfirmedIntro: "Gracies per la teva compra. Aqui tens el resum:",
    orderSummary: "Resum de la comanda",
    deliveryTitle: "Lliurament",
    pickupInstructions: "Recolliras la comanda al Port de Blanes. T'escriurem per coordinar el moment; tambe pots passar el dia de la teva sortida en vaixell.",
    pickupLauraInstructions: "Recolliras la comanda a la botiga de Laura Cabanas, a Carrer del Carme 5, Lloret de Mar. T'escriurem per confirmar horari i adreca exacta.",
    shippingInstructions: "Enviarem la comanda a l'adreca indicada en uns 3-7 dies laborables.",
    totalLabel: "Total",
    shippingCostLabel: "Enviament",
    questions: "Si tens qualsevol dubte, escriu-nos a costabravarentaboat@gmail.com o truca al +34 611 500 372.",
  },
  fr: {
    tee: "T-shirt Costa Brava Culture",
    tote: "Tote bag Costa Brava Culture",
    colors: { butter: "jaune beurre", navy: "bleu marine", royal: "bleu royal" },
    pickup: "Retrait au Port de Blanes (gratuit)",
    pickupLaura: "Retrait chez Laura Cabanas, Lloret de Mar (gratuit)",
    shipping: "Livraison a domicile (Espagne)",
    orderConfirmedSubject: "Commande confirmee",
    orderConfirmedTitle: "Votre commande est confirmee",
    orderConfirmedIntro: "Merci pour votre achat. Voici le recapitulatif :",
    orderSummary: "Recapitulatif de la commande",
    deliveryTitle: "Livraison",
    pickupInstructions: "Vous recupererez votre commande au Port de Blanes. Nous vous contacterons pour convenir d'un moment ; vous pouvez aussi la retirer le jour de votre sortie en bateau.",
    pickupLauraInstructions: "Vous recupererez votre commande a la boutique Laura Cabanas, a Carrer del Carme 5, Lloret de Mar. Nous vous ecrirons pour confirmer les horaires et l'adresse exacte.",
    shippingInstructions: "Nous expedierons votre commande a l'adresse indiquee sous 3 a 7 jours ouvrables.",
    totalLabel: "Total",
    shippingCostLabel: "Livraison",
    questions: "Pour toute question, ecrivez-nous a costabravarentaboat@gmail.com ou appelez le +34 611 500 372.",
  },
  de: {
    tee: "Costa Brava Culture T-Shirt",
    tote: "Costa Brava Culture Tote Bag",
    colors: { butter: "buttergelb", navy: "marineblau", royal: "royalblau" },
    pickup: "Abholung im Hafen von Blanes (kostenlos)",
    pickupLaura: "Abholung im Laura-Cabanas-Store, Lloret de Mar (kostenlos)",
    shipping: "Lieferung nach Hause (Spanien)",
    orderConfirmedSubject: "Bestellung bestaetigt",
    orderConfirmedTitle: "Ihre Bestellung ist bestaetigt",
    orderConfirmedIntro: "Vielen Dank fuer Ihren Einkauf. Hier ist Ihre Uebersicht:",
    orderSummary: "Bestelluebersicht",
    deliveryTitle: "Lieferung",
    pickupInstructions: "Sie holen Ihre Bestellung im Hafen von Blanes ab. Wir melden uns, um einen Zeitpunkt zu vereinbaren; Sie koennen sie auch am Tag Ihrer Bootstour abholen.",
    pickupLauraInstructions: "Sie holen Ihre Bestellung im Laura-Cabanas-Store in Carrer del Carme 5, Lloret de Mar ab. Wir melden uns, um Oeffnungszeiten und genaue Adresse zu bestaetigen.",
    shippingInstructions: "Wir versenden Ihre Bestellung innerhalb von 3-7 Werktagen an die angegebene Adresse.",
    totalLabel: "Gesamt",
    shippingCostLabel: "Versand",
    questions: "Bei Fragen schreiben Sie an costabravarentaboat@gmail.com oder rufen Sie +34 611 500 372 an.",
  },
  nl: {
    tee: "Costa Brava Culture T-shirt",
    tote: "Costa Brava Culture tote bag",
    colors: { butter: "botergeel", navy: "marineblauw", royal: "koningsblauw" },
    pickup: "Ophalen in de haven van Blanes (gratis)",
    pickupLaura: "Ophalen bij Laura Cabanas, Lloret de Mar (gratis)",
    shipping: "Thuisbezorging (Spanje)",
    orderConfirmedSubject: "Bestelling bevestigd",
    orderConfirmedTitle: "Je bestelling is bevestigd",
    orderConfirmedIntro: "Bedankt voor je aankoop. Hier is je overzicht:",
    orderSummary: "Besteloverzicht",
    deliveryTitle: "Bezorging",
    pickupInstructions: "Je haalt je bestelling op in de haven van Blanes. We nemen contact op om een moment af te spreken; je kunt ook langskomen op de dag van je boottocht.",
    pickupLauraInstructions: "Je haalt je bestelling op bij de Laura Cabanas-winkel in Carrer del Carme 5, Lloret de Mar. We nemen contact op om openingstijden en het exacte adres te bevestigen.",
    shippingInstructions: "We versturen je bestelling binnen 3-7 werkdagen naar het opgegeven adres.",
    totalLabel: "Totaal",
    shippingCostLabel: "Verzending",
    questions: "Heb je vragen? Mail naar costabravarentaboat@gmail.com of bel +34 611 500 372.",
  },
  it: {
    tee: "T-shirt Costa Brava Culture",
    tote: "Tote bag Costa Brava Culture",
    colors: { butter: "giallo burro", navy: "blu navy", royal: "blu royal" },
    pickup: "Ritiro al Porto di Blanes (gratuito)",
    pickupLaura: "Ritiro da Laura Cabanas, Lloret de Mar (gratuito)",
    shipping: "Consegna a domicilio (Spagna)",
    orderConfirmedSubject: "Ordine confermato",
    orderConfirmedTitle: "Il tuo ordine e confermato",
    orderConfirmedIntro: "Grazie per il tuo acquisto. Ecco il riepilogo:",
    orderSummary: "Riepilogo dell'ordine",
    deliveryTitle: "Consegna",
    pickupInstructions: "Ritirerai il tuo ordine al Porto di Blanes. Ti contatteremo per concordare il momento; puoi anche ritirarlo il giorno della tua uscita in barca.",
    pickupLauraInstructions: "Ritirerai il tuo ordine presso il negozio Laura Cabanas, a Carrer del Carme 5, Lloret de Mar. Ti scriveremo per confermare orari e indirizzo esatto.",
    shippingInstructions: "Spediremo il tuo ordine all'indirizzo indicato entro 3-7 giorni lavorativi.",
    totalLabel: "Totale",
    shippingCostLabel: "Spedizione",
    questions: "Per qualsiasi domanda, scrivici a costabravarentaboat@gmail.com o chiama il +34 611 500 372.",
  },
  ru: {
    tee: "Futbolka Costa Brava Culture",
    tote: "Sumka-shopper Costa Brava Culture",
    colors: { butter: "slivochno-zheltyy", navy: "temno-siniy", royal: "yarko-siniy" },
    pickup: "Samovyvoz iz porta Blanes (besplatno)",
    pickupLaura: "Samovyvoz v magazine Laura Cabanas, Lloret de Mar (besplatno)",
    shipping: "Dostavka na dom (Ispaniya)",
    orderConfirmedSubject: "Zakaz podtverzhden",
    orderConfirmedTitle: "Vash zakaz podtverzhden",
    orderConfirmedIntro: "Spasibo za pokupku. Vot svodka zakaza:",
    orderSummary: "Sostav zakaza",
    deliveryTitle: "Dostavka",
    pickupInstructions: "Vy zaberete zakaz v portu Blanesa. My svyazhemsya s vami, chtoby dogovoritsya o vremeni; takzhe mozhno zabrat ego v den vashey morskoy progulki.",
    pickupLauraInstructions: "Vy zaberete zakaz v magazine Laura Cabanas v Carrer del Carme 5, Lloret de Mar. My napishem vam, chtoby podtverdit chasy raboty i tochnyy adres.",
    shippingInstructions: "My otpravim zakaz po ukazannomu adresu v techenie 3-7 rabochikh dney.",
    totalLabel: "Itogo",
    shippingCostLabel: "Dostavka",
    questions: "Esli u vas est voprosy, napishite na costabravarentaboat@gmail.com ili pozvonite +34 611 500 372.",
  },
};

export function getShopStrings(language?: string | null): ShopLangStrings {
  const lang = (language || "es") as LangCode;
  return SHOP_STRINGS[lang] || SHOP_STRINGS.es;
}

/** Human label for a SKU (e.g. "Camiseta Costa Brava Culture (azul marino, M)"). */
export function shopItemLabel(sku: string, language?: string | null): string {
  const entry = getShopVariant(sku);
  const strings = getShopStrings(language);
  if (!entry) return sku;
  const base = entry.product.i18nKey === "tee" ? strings.tee : strings.tote;
  const color = strings.colors[entry.variant.color] ?? entry.variant.color;
  return entry.variant.size
    ? `${base} (${color}, ${entry.variant.size})`
    : `${base} (${color})`;
}
