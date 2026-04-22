// WhatsApp message templates for post-booking flows.
// Plain text (Twilio doesn't render HTML). Localized per booking.language.
// Keep messages short: WhatsApp has no real limit but concise messages convert
// better and are less likely to be flagged as spam.
//
// Languages supported: es, en, fr, de, nl, it, ru, ca. Anything else -> en fallback.

import { GOOGLE_REVIEW_URL } from "../../shared/businessProfile";

type SupportedLang = "es" | "en" | "fr" | "de" | "nl" | "it" | "ru" | "ca";

function normalizeLang(lang: string | null | undefined): SupportedLang {
  const l = (lang ?? "").toLowerCase().slice(0, 2);
  if (l === "es" || l === "en" || l === "fr" || l === "de" || l === "nl" || l === "it" || l === "ru" || l === "ca") {
    return l as SupportedLang;
  }
  return "en";
}

interface ThankYouInput {
  customerName: string;
  language: string | null | undefined;
}

/**
 * Build the post-trip WhatsApp message asking for a Google review.
 * Intentionally doesn't reference "yesterday" so the same copy works for
 * back-fill sends (e.g., 3 days after the trip, if the scheduler was down).
 */
export function renderThankYouWhatsApp(input: ThankYouInput): string {
  const lang = normalizeLang(input.language);
  const name = input.customerName.trim();
  const t = TEMPLATES[lang];

  return [
    t.greeting(name),
    ``,
    t.hopeEnjoyed,
    ``,
    t.reviewAsk,
    GOOGLE_REVIEW_URL,
    ``,
    t.nextBookingPerk,
    ``,
    t.signature,
  ].join("\n");
}

const TEMPLATES: Record<SupportedLang, {
  greeting: (name: string) => string;
  hopeEnjoyed: string;
  reviewAsk: string;
  nextBookingPerk: string;
  signature: string;
}> = {
  es: {
    greeting: (n) => `Hola ${n}!`,
    hopeEnjoyed: "Esperamos que hayas disfrutado de tu salida en barco con nosotros.",
    reviewAsk: "Si tuviste una buena experiencia, nos ayudaría muchísimo que nos dejaras una reseña en Google:",
    nextBookingPerk: "Como cliente, tienes un descuento exclusivo para tu próxima reserva. Solo pídelo.",
    signature: "Un abrazo, Costa Brava Rent a Boat",
  },
  en: {
    greeting: (n) => `Hi ${n}!`,
    hopeEnjoyed: "We hope you enjoyed your boat trip with us.",
    reviewAsk: "If you had a good experience, a Google review would help us a lot:",
    nextBookingPerk: "As a returning customer, you have an exclusive discount on your next booking. Just ask.",
    signature: "Warm regards, Costa Brava Rent a Boat",
  },
  fr: {
    greeting: (n) => `Bonjour ${n} !`,
    hopeEnjoyed: "Nous espérons que vous avez apprécié votre sortie en bateau avec nous.",
    reviewAsk: "Si vous avez passé un bon moment, un avis Google nous aiderait énormément :",
    nextBookingPerk: "En tant que client, vous bénéficiez d'une remise exclusive sur votre prochaine réservation. Il suffit de demander.",
    signature: "Cordialement, Costa Brava Rent a Boat",
  },
  de: {
    greeting: (n) => `Hallo ${n}!`,
    hopeEnjoyed: "Wir hoffen, Sie haben Ihre Bootstour bei uns genossen.",
    reviewAsk: "Wenn Sie zufrieden waren, würde uns eine Google-Bewertung sehr helfen:",
    nextBookingPerk: "Als Stammkunde erhalten Sie einen exklusiven Rabatt auf Ihre nächste Buchung. Fragen Sie einfach nach.",
    signature: "Herzliche Grüße, Costa Brava Rent a Boat",
  },
  nl: {
    greeting: (n) => `Hallo ${n}!`,
    hopeEnjoyed: "We hopen dat u heeft genoten van uw boottocht met ons.",
    reviewAsk: "Als u een fijne ervaring had, zou een Google-review ons enorm helpen:",
    nextBookingPerk: "Als terugkerende klant krijgt u een exclusieve korting op uw volgende boeking. Vraag er gewoon om.",
    signature: "Hartelijke groet, Costa Brava Rent a Boat",
  },
  it: {
    greeting: (n) => `Ciao ${n}!`,
    hopeEnjoyed: "Speriamo che abbia apprezzato la sua uscita in barca con noi.",
    reviewAsk: "Se ha vissuto una bella esperienza, una recensione su Google ci aiuterebbe moltissimo:",
    nextBookingPerk: "Come cliente, ha uno sconto esclusivo sulla prossima prenotazione. Basta chiedere.",
    signature: "Un caro saluto, Costa Brava Rent a Boat",
  },
  ru: {
    greeting: (n) => `Здравствуйте, ${n}!`,
    hopeEnjoyed: "Надеемся, вам понравилась прогулка на лодке с нами.",
    reviewAsk: "Если вам всё понравилось, отзыв в Google очень поможет нам:",
    nextBookingPerk: "Как нашему клиенту, вам доступна эксклюзивная скидка на следующее бронирование. Просто напишите нам.",
    signature: "С наилучшими пожеланиями, Costa Brava Rent a Boat",
  },
  ca: {
    greeting: (n) => `Hola ${n}!`,
    hopeEnjoyed: "Esperem que hagis gaudit de la teva sortida amb vaixell amb nosaltres.",
    reviewAsk: "Si vas tenir una bona experiència, una ressenya a Google ens ajudaria moltíssim:",
    nextBookingPerk: "Com a client, tens un descompte exclusiu per a la teva propera reserva. Només demana-ho.",
    signature: "Una abraçada, Costa Brava Rent a Boat",
  },
};
