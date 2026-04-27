import sgMail from "@sendgrid/mail";
import type { Booking, Boat, BookingExtra } from "@shared/schema";
import { logger } from "../lib/logger";
import { sendgridBreaker } from "../lib/circuitBreaker";
import { generateOpaqueUnsubToken } from "../routes/newsletter";
import { GOOGLE_REVIEW_URL } from "../../shared/businessProfile";

type EmailLang = "es" | "en" | "fr" | "de" | "nl" | "it" | "ru" | "ca";

interface EmailStrings {
  bookingConfirmed: string;
  greeting: string;
  bookingDetails: string;
  meetingPoint: string;
  meetingPointDesc: string;
  arriveEarly: string;
  contact: string;
  thanks: string;
  reminderTitle: string;
  reminderSubtitle: string;
  tipsTitle: string;
  tips: string[];
  emergency: string;
  parking: string;
  parkingDesc: string;
  seeYouTomorrow: string;
  thankYouTitle: string;
  thankYouIntro: string;
  reviewTitle: string;
  reviewDesc: string;
  reviewButton: string;
  discountTitle: string;
  discountDesc: string;
  discountFooter: string;
  bookAgain: string;
  seeYouSoon: string;
  colBoat: string; colDate: string; colSchedule: string; colDuration: string;
  colPeople: string; colBase: string; colVat: string; colTotal: string;
  colHour: string; colHours: string;
  phone: string;
  emergencyCall: string;
  cancelTitle?: string;
  cancelLink?: string;
}

const EMAIL_STRINGS: Record<EmailLang, EmailStrings> = {
  es: {
    bookingConfirmed: "Reserva confirmada",
    greeting: "Tu reserva ha sido confirmada. Aquí tienes los detalles:",
    bookingDetails: "Detalles de tu reserva",
    meetingPoint: "Punto de encuentro",
    meetingPointDesc: "Puerto de Blanes, Costa Brava, Girona",
    arriveEarly: "Preséntate <strong>15 minutos antes</strong> de la hora de salida.",
    contact: "Contacto",
    thanks: "Gracias por confiar en nosotros. Nos vemos en el puerto.",
    reminderTitle: "Recordatorio: tu reserva es mañana",
    reminderSubtitle: "Te recordamos que tu alquiler de barco es <strong>mañana</strong>. Aquí tienes los detalles:",
    tipsTitle: "Consejos para tu experiencia",
    tips: ["Lleva protección solar y gafas de sol", "Viste ropa cómoda y calzado que se pueda mojar", "Trae una toalla y ropa de repuesto", "Puedes traer comida y bebida a bordo", "Consulta la previsión meteorológica antes de salir"],
    emergency: "Número de emergencia",
    parking: "Aparcamiento",
    parkingDesc: "Hay aparcamiento disponible cerca del puerto de Blanes. En temporada alta, recomendamos llegar con tiempo para encontrar plaza.",
    seeYouTomorrow: "Estamos deseando verte mañana. Si tienes alguna pregunta, no dudes en contactarnos.",
    thankYouTitle: "Gracias por navegar con nosotros",
    thankYouIntro: "Esperamos que disfrutaras de tu experiencia a bordo",
    reviewTitle: "Tu opinión nos importa",
    reviewDesc: "Si disfrutaste de la experiencia, nos encantaría que compartieras tu opinión en Google.",
    reviewButton: "Dejar una reseña en Google",
    discountTitle: "10% de descuento en tu próxima reserva",
    discountDesc: "Regalo exclusivo para ti",
    discountFooter: "Introduce este código al hacer tu próxima reserva en nuestra web.",
    bookAgain: "Reservar de nuevo",
    seeYouSoon: "Esperamos verte de nuevo pronto en la Costa Brava.",
    colBoat: "Barco", colDate: "Fecha", colSchedule: "Horario", colDuration: "Duración",
    colPeople: "Personas", colBase: "Base imponible (sin IVA)", colVat: "IVA (21%)", colTotal: "Total (IVA incluido)",
    colHour: "hora", colHours: "horas",
    phone: "Teléfono",
    emergencyCall: "En caso de incidencia, llámanos al",
    cancelTitle: "Cambio de fecha gratis con 7+ días de antelación. Cancelaciones no reembolsables.",
    cancelLink: "Cancelar mi reserva",
  },
  en: {
    bookingConfirmed: "Booking confirmed",
    greeting: "Your booking has been confirmed. Here are the details:",
    bookingDetails: "Your booking details",
    meetingPoint: "Meeting point",
    meetingPointDesc: "Port of Blanes, Costa Brava, Girona",
    arriveEarly: "Please arrive <strong>15 minutes before</strong> departure.",
    contact: "Contact",
    thanks: "Thank you for choosing us. See you at the port.",
    reminderTitle: "Reminder: your booking is tomorrow",
    reminderSubtitle: "Just a reminder that your boat rental is <strong>tomorrow</strong>. Here are the details:",
    tipsTitle: "Tips for your experience",
    tips: ["Bring sunscreen and sunglasses", "Wear comfortable clothes and shoes that can get wet", "Bring a towel and a change of clothes", "You can bring food and drinks on board", "Check the weather forecast before you go"],
    emergency: "Emergency number",
    parking: "Parking",
    parkingDesc: "Parking is available near the port of Blanes. In high season we recommend arriving early to find a spot.",
    seeYouTomorrow: "We look forward to seeing you tomorrow. If you have any questions, don't hesitate to contact us.",
    thankYouTitle: "Thank you for sailing with us",
    thankYouIntro: "We hope you enjoyed your time on board",
    reviewTitle: "Your opinion matters to us",
    reviewDesc: "If you enjoyed the experience, we would love for you to share your review on Google.",
    reviewButton: "Leave a Google review",
    discountTitle: "10% off your next booking",
    discountDesc: "An exclusive gift for you",
    discountFooter: "Enter this code when making your next booking on our website.",
    bookAgain: "Book again",
    seeYouSoon: "We hope to see you again soon on the Costa Brava.",
    colBoat: "Boat", colDate: "Date", colSchedule: "Schedule", colDuration: "Duration",
    colPeople: "People", colBase: "Subtotal (excl. VAT)", colVat: "VAT (21%)", colTotal: "Total (incl. VAT)",
    colHour: "hour", colHours: "hours",
    phone: "Phone",
    emergencyCall: "In case of emergency, call us at",
    cancelTitle: "Free date change with 7+ days notice. Cancellations are non-refundable.",
    cancelLink: "Cancel my booking",
  },
  fr: {
    bookingConfirmed: "Reservation confirmee",
    greeting: "Votre reservation a ete confirmee. Voici les details :",
    bookingDetails: "Details de votre reservation",
    meetingPoint: "Point de rendez-vous",
    meetingPointDesc: "Port de Blanes, Costa Brava, Gerone",
    arriveEarly: "Veuillez arriver <strong>15 minutes avant</strong> le depart.",
    contact: "Contact",
    thanks: "Merci de nous faire confiance. A bientot au port.",
    reminderTitle: "Rappel : votre reservation est demain",
    reminderSubtitle: "Rappel : votre location de bateau est <strong>demain</strong>. Voici les details :",
    tipsTitle: "Conseils pour votre experience",
    tips: ["Apportez de la creme solaire et des lunettes de soleil", "Portez des vetements confortables et des chaussures pouvant etre mouillees", "Apportez une serviette et des vetements de rechange", "Vous pouvez apporter de la nourriture et des boissons a bord", "Consultez les previsions meteo avant de partir"],
    emergency: "Numero d'urgence",
    parking: "Stationnement",
    parkingDesc: "Un parking est disponible pres du port de Blanes. En haute saison, nous recommandons d'arriver tot.",
    seeYouTomorrow: "Nous avons hate de vous voir demain. N'hesitez pas a nous contacter.",
    thankYouTitle: "Merci d'avoir navigue avec nous",
    thankYouIntro: "Nous esperons que vous avez apprecie votre experience a bord",
    reviewTitle: "Votre avis nous importe",
    reviewDesc: "Si vous avez apprecie l'experience, nous serions ravis que vous partagiez votre avis sur Google.",
    reviewButton: "Laisser un avis Google",
    discountTitle: "10% de reduction sur votre prochaine reservation",
    discountDesc: "Un cadeau exclusif pour vous",
    discountFooter: "Entrez ce code lors de votre prochaine reservation sur notre site.",
    bookAgain: "Reserver a nouveau",
    seeYouSoon: "Nous esperons vous revoir bientot sur la Costa Brava.",
    colBoat: "Bateau", colDate: "Date", colSchedule: "Horaire", colDuration: "Duree",
    colPeople: "Personnes", colBase: "Base imposable (HT)", colVat: "TVA (21%)", colTotal: "Total (TTC)",
    colHour: "heure", colHours: "heures",
    phone: "Téléphone",
    emergencyCall: "En cas d'incident, appelez-nous au",
  },
  de: {
    bookingConfirmed: "Buchung bestatigt",
    greeting: "Ihre Buchung wurde bestatigt. Hier sind die Details:",
    bookingDetails: "Ihre Buchungsdetails",
    meetingPoint: "Treffpunkt",
    meetingPointDesc: "Hafen von Blanes, Costa Brava, Girona",
    arriveEarly: "Bitte erscheinen Sie <strong>15 Minuten vor</strong> der Abfahrt.",
    contact: "Kontakt",
    thanks: "Vielen Dank fur Ihr Vertrauen. Wir sehen uns im Hafen.",
    reminderTitle: "Erinnerung: Ihre Buchung ist morgen",
    reminderSubtitle: "Erinnerung: Ihr Bootsverleih ist <strong>morgen</strong>. Hier sind die Details:",
    tipsTitle: "Tipps fur Ihr Erlebnis",
    tips: ["Sonnenschutz und Sonnenbrille mitbringen", "Bequeme Kleidung und Schuhe tragen, die nass werden konnen", "Handtuch und Wechselkleidung mitnehmen", "Essen und Getranke sind an Bord erlaubt", "Wettervorhersage vor der Abfahrt prufen"],
    emergency: "Notfallnummer",
    parking: "Parkmoglichkeiten",
    parkingDesc: "Parkplatze sind in der Nahe des Hafens von Blanes verfugbar. In der Hochsaison empfehlen wir fruh anzukommen.",
    seeYouTomorrow: "Wir freuen uns darauf, Sie morgen zu sehen. Kontaktieren Sie uns jederzeit.",
    thankYouTitle: "Danke, dass Sie mit uns gefahren sind",
    thankYouIntro: "Wir hoffen, dass Sie Ihre Zeit an Bord genossen haben",
    reviewTitle: "Ihre Meinung ist uns wichtig",
    reviewDesc: "Wenn Sie das Erlebnis genossen haben, wurden wir uns freuen, wenn Sie Ihre Bewertung auf Google teilen.",
    reviewButton: "Google-Bewertung hinterlassen",
    discountTitle: "10% Rabatt auf Ihre nachste Buchung",
    discountDesc: "Ein exklusives Geschenk fur Sie",
    discountFooter: "Geben Sie diesen Code bei Ihrer nachsten Buchung auf unserer Website ein.",
    bookAgain: "Erneut buchen",
    seeYouSoon: "Wir hoffen, Sie bald wieder an der Costa Brava zu sehen.",
    colBoat: "Boot", colDate: "Datum", colSchedule: "Zeitplan", colDuration: "Dauer",
    colPeople: "Personen", colBase: "Nettobetrag (ohne MwSt)", colVat: "MwSt (21%)", colTotal: "Gesamt (inkl. MwSt)",
    colHour: "Stunde", colHours: "Stunden",
    phone: "Telefon",
    emergencyCall: "Im Notfall rufen Sie uns an",
  },
  nl: {
    bookingConfirmed: "Boeking bevestigd",
    greeting: "Uw boeking is bevestigd. Hier zijn de details:",
    bookingDetails: "Uw boekingsdetails",
    meetingPoint: "Ontmoetingspunt",
    meetingPointDesc: "Haven van Blanes, Costa Brava, Girona",
    arriveEarly: "Kom <strong>15 minuten voor</strong> vertrek.",
    contact: "Contact",
    thanks: "Bedankt voor uw vertrouwen. Tot ziens in de haven.",
    reminderTitle: "Herinnering: uw boeking is morgen",
    reminderSubtitle: "Herinnering: uw boothuur is <strong>morgen</strong>.",
    tipsTitle: "Tips voor uw ervaring",
    tips: ["Neem zonnebrandcreme en een zonnebril mee", "Draag comfortabele kleding en schoenen die nat mogen worden", "Neem een handdoek en extra kleding mee", "Eten en drinken zijn aan boord toegestaan", "Controleer de weersvoorspelling voor vertrek"],
    emergency: "Noodnummer",
    parking: "Parkeren",
    parkingDesc: "Er is parkeergelegenheid bij de haven van Blanes. In het hoogseizoen raden wij aan vroeg aan te komen.",
    seeYouTomorrow: "We kijken ernaar uit u morgen te zien.",
    thankYouTitle: "Bedankt voor het varen met ons",
    thankYouIntro: "We hopen dat u heeft genoten van uw tijd aan boord",
    reviewTitle: "Uw mening is belangrijk voor ons",
    reviewDesc: "Als u de ervaring heeft genoten, zouden we het fijn vinden als u een review op Google achterlaat.",
    reviewButton: "Google-review achterlaten",
    discountTitle: "10% korting op uw volgende boeking",
    discountDesc: "Een exclusief cadeau voor u",
    discountFooter: "Voer deze code in bij uw volgende boeking op onze website.",
    bookAgain: "Opnieuw boeken",
    seeYouSoon: "We hopen u snel weer te zien aan de Costa Brava.",
    colBoat: "Boot", colDate: "Datum", colSchedule: "Tijdschema", colDuration: "Duur",
    colPeople: "Personen", colBase: "Subtotaal (excl. btw)", colVat: "btw (21%)", colTotal: "Totaal (incl. btw)",
    colHour: "uur", colHours: "uur",
    phone: "Telefoon",
    emergencyCall: "In geval van een incident, bel ons op",
  },
  it: {
    bookingConfirmed: "Prenotazione confermata",
    greeting: "La sua prenotazione e stata confermata. Ecco i dettagli:",
    bookingDetails: "Dettagli della sua prenotazione",
    meetingPoint: "Punto di incontro",
    meetingPointDesc: "Porto di Blanes, Costa Brava, Girona",
    arriveEarly: "Si presenti <strong>15 minuti prima</strong> della partenza.",
    contact: "Contatto",
    thanks: "Grazie per la sua fiducia. A presto in porto.",
    reminderTitle: "Promemoria: la sua prenotazione e domani",
    reminderSubtitle: "Promemoria: il noleggio barca e <strong>domani</strong>.",
    tipsTitle: "Consigli per la sua esperienza",
    tips: ["Portare crema solare e occhiali da sole", "Indossare abiti comodi e scarpe che possono bagnarsi", "Portare un asciugamano e vestiti di ricambio", "E possibile portare cibo e bevande a bordo", "Controllare le previsioni meteo prima di partire"],
    emergency: "Numero di emergenza",
    parking: "Parcheggio",
    parkingDesc: "Parcheggio disponibile vicino al porto di Blanes. In alta stagione si consiglia di arrivare presto.",
    seeYouTomorrow: "Non vediamo l'ora di vederla domani.",
    thankYouTitle: "Grazie per aver navigato con noi",
    thankYouIntro: "Speriamo che abbia apprezzato la sua esperienza a bordo",
    reviewTitle: "La sua opinione e importante per noi",
    reviewDesc: "Se ha apprezzato l'esperienza, ci farebbe piacere se condividesse la sua recensione su Google.",
    reviewButton: "Lascia una recensione su Google",
    discountTitle: "10% di sconto sulla prossima prenotazione",
    discountDesc: "Un regalo esclusivo per lei",
    discountFooter: "Inserisca questo codice alla prossima prenotazione sul nostro sito.",
    bookAgain: "Prenota di nuovo",
    seeYouSoon: "Speriamo di rivederla presto in Costa Brava.",
    colBoat: "Barca", colDate: "Data", colSchedule: "Orario", colDuration: "Durata",
    colPeople: "Persone", colBase: "Imponibile (IVA esclusa)", colVat: "IVA (21%)", colTotal: "Totale (IVA inclusa)",
    colHour: "ora", colHours: "ore",
    phone: "Telefono",
    emergencyCall: "In caso di incidente, chiamateci al",
  },
  ru: {
    bookingConfirmed: "Bronirovanie podtverzhdeno",
    greeting: "Vashe bronirovanie podtverzhdeno. Vot podrobnosti:",
    bookingDetails: "Detali vashego bronirovaniya",
    meetingPoint: "Mesto vstrechi",
    meetingPointDesc: "Port Blanesa, Kosta-Brava, Zhirona",
    arriveEarly: "Pozhaluysta, pribudte <strong>za 15 minut</strong> do otplytiya.",
    contact: "Kontakty",
    thanks: "Spasibo za doverie. Do vstrechi v portu.",
    reminderTitle: "Napominanie: vashe bronirovanie zavtra",
    reminderSubtitle: "Napominanie: vasha arenda lodki <strong>zavtra</strong>.",
    tipsTitle: "Sovety dlya vashego otdykha",
    tips: ["Vozmite solntsezashchitny krem i ochki", "Odente udobnuyu odezhdu i obuv, kotoraya mozhet namoknut", "Vozmite polotentse i smenu odezhdy", "Na bort mozhno brat edu i napitki", "Proverte prognoz pogody pered vyezdom"],
    emergency: "Nomer ekstrennoy svyazi",
    parking: "Parkovka",
    parkingDesc: "Parkovka dostupna ryadom s portom Blanesa. V vysokiy sezon rekomenduem priezhat zaranee.",
    seeYouTomorrow: "S neterpeniyem zhdem vstrechi zavtra.",
    thankYouTitle: "Spasibo, chto puteshestvovali s nami",
    thankYouIntro: "Nadeemsya, vam ponravilos na bortu",
    reviewTitle: "Vashe mnenie vazhno dlya nas",
    reviewDesc: "Yesli vam ponravilos, my budem rady otzuvu na Google.",
    reviewButton: "Ostavit otzuv v Google",
    discountTitle: "Skidka 10% na sleduyushchee bronirovanie",
    discountDesc: "Eksklyuzivnyy podarok dlya vas",
    discountFooter: "Vvedite etot kod pri sleduyushchem bronirovanii na nashem sayte.",
    bookAgain: "Zabronirovat snova",
    seeYouSoon: "Nadeemsya snova uvidet vas na Kosta-Brave.",
    colBoat: "Lodka", colDate: "Data", colSchedule: "Raspisanie", colDuration: "Dlitelnost",
    colPeople: "Chelovek", colBase: "Summa bez NDS", colVat: "NDS (21%)", colTotal: "Itogo (vklyuchaya NDS)",
    colHour: "chas", colHours: "chasov",
    phone: "Телефон",
    emergencyCall: "В случае инцидента позвоните нам по номеру",
  },
  ca: {
    bookingConfirmed: "Reserva confirmada",
    greeting: "La teva reserva ha estat confirmada. Aquí tens els detalls:",
    bookingDetails: "Detalls de la teva reserva",
    meetingPoint: "Punt de trobada",
    meetingPointDesc: "Port de Blanes, Costa Brava, Girona",
    arriveEarly: "Presenta't <strong>15 minuts abans</strong> de l'hora de sortida.",
    contact: "Contacte",
    thanks: "Gràcies per confiar en nosaltres. Ens veiem al port.",
    reminderTitle: "Recordatori: la teva reserva és demà",
    reminderSubtitle: "Et recordem que el teu lloguer de vaixell és <strong>demà</strong>. Aquí tens els detalls:",
    tipsTitle: "Consells per a la teva experiència",
    tips: ["Porta protecció solar i ulleres de sol", "Vesteix-te amb roba còmoda i calçat que es pugui mullar", "Porta una tovallola i roba de recanvi", "Pots portar menjar i begudes a bord", "Consulta la previsió meteorològica abans de sortir"],
    emergency: "Número d'emergència",
    parking: "Aparcament",
    parkingDesc: "Hi ha aparcament disponible a prop del port de Blanes. En temporada alta, recomanem arribar amb temps per trobar plaça.",
    seeYouTomorrow: "Estem desitjant veure't demà. Si tens cap pregunta, no dubtis a contactar-nos.",
    thankYouTitle: "Gràcies per navegar amb nosaltres",
    thankYouIntro: "Esperem que hagis gaudit de la teva experiència a bord",
    reviewTitle: "La teva opinió ens importa",
    reviewDesc: "Si vas gaudir de l'experiència, ens encantaria que compartissis la teva opinió a Google.",
    reviewButton: "Deixar una ressenya a Google",
    discountTitle: "10% de descompte a la teva propera reserva",
    discountDesc: "Regal exclusiu per a tu",
    discountFooter: "Introdueix aquest codi en fer la teva propera reserva al nostre web.",
    bookAgain: "Reservar de nou",
    seeYouSoon: "Esperem tornar a veure't aviat a la Costa Brava.",
    colBoat: "Vaixell", colDate: "Data", colSchedule: "Horari", colDuration: "Durada",
    colPeople: "Persones", colBase: "Base imposable (sense IVA)", colVat: "IVA (21%)", colTotal: "Total (IVA inclòs)",
    colHour: "hora", colHours: "hores",
    phone: "Telèfon",
    emergencyCall: "En cas d'incidència, truca'ns al",
    cancelTitle: "Canvi de data gratuït amb 7+ dies d'antelació. Cancel·lacions no reemborsables.",
    cancelLink: "Cancel·lar la meva reserva",
  },
};

function getEmailStrings(language?: string | null): EmailStrings {
  const lang = (language || "es") as EmailLang;
  return EMAIL_STRINGS[lang] || EMAIL_STRINGS.es;
}

// Lazy initialization for SendGrid
let initialized = false;

function initSendGrid(): boolean {
  if (!initialized && process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    initialized = true;
  }
  return initialized;
}

function getFromEmail(): string {
  return process.env.SENDGRID_FROM_EMAIL || "costabravarentaboat@gmail.com";
}

interface EmailResult {
  success: boolean;
  error?: string;
}

// Booking data enriched with boat info and extras for email templates
interface BookingEmailData {
  booking: Booking;
  boat: Boat;
  extras: BookingExtra[];
}

// ===== HTML EMAIL TEMPLATE HELPERS =====

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f7fa; font-family:Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d1a2d 0%, #1a2a4a 100%); padding:28px 32px; text-align:center; border-bottom:3px solid #A8C4DD;">
              <img src="https://www.costabravarentaboat.com/assets/logo-email-white.svg" alt="Costa Brava Rent a Boat" width="280" height="130" style="display:block; margin:0 auto; width:280px; height:auto;">
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer: Social Media -->
          <tr>
            <td style="background-color:#0d1a2d; padding:20px 32px 0; text-align:center;">
              <a href="https://www.instagram.com/costabravarentaboat/" target="_blank" style="display:inline-block; background-color:#E4405F; padding:6px 14px; border-radius:50px; color:#ffffff; font-size:11px; font-weight:600; text-decoration:none; margin:0 3px;">Instagram</a>
              <a href="https://www.facebook.com/costabravarentaboat" target="_blank" style="display:inline-block; background-color:#1877F2; padding:6px 14px; border-radius:50px; color:#ffffff; font-size:11px; font-weight:600; text-decoration:none; margin:0 3px;">Facebook</a>
              <a href="https://www.tiktok.com/@costabravarentaboat" target="_blank" style="display:inline-block; background-color:#000000; border:1px solid #333333; padding:6px 14px; border-radius:50px; color:#ffffff; font-size:11px; font-weight:600; text-decoration:none; margin:0 3px;">TikTok</a>
              <a href="https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5" target="_blank" style="display:inline-block; background-color:#4285F4; padding:6px 14px; border-radius:50px; color:#ffffff; font-size:11px; font-weight:600; text-decoration:none; margin:0 3px;">Ubicacion</a>
            </td>
          </tr>
          <!-- Footer: Contact -->
          <tr>
            <td style="background-color:#0d1a2d; border-top:1px solid #1a2a4a; padding:16px 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align:center;">
                    <img src="https://www.costabravarentaboat.com/assets/logo-email-white.svg" alt="Costa Brava Rent a Boat" width="160" height="74" style="display:block; margin:0 auto 8px; width:160px; height:auto;">
                    <p style="margin:0 0 4px; color:#A8C4DD; font-size:12px;">&#9875; Puerto de Blanes, Girona, Costa Brava</p>
                    <p style="margin:0 0 4px; color:#A8C4DD; font-size:12px;">Tel: <a href="tel:+34611500372" style="color:#A8C4DD; text-decoration:none;">+34 611 500 372</a> &middot; <a href="mailto:costabravarentaboat@gmail.com" style="color:#A8C4DD; text-decoration:none;">costabravarentaboat@gmail.com</a></p>
                    <p style="margin:0; color:#A8C4DD; font-size:11px; opacity:0.7;">www.costabravarentaboat.com</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
}

function bookingDetailsTable(data: BookingEmailData, strings: EmailStrings): string {
  const { booking, boat, extras } = data;

  const extrasHtml = extras.length > 0
    ? extras.map(e => `<tr>
        <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">Extra: ${e.extraName}</td>
        <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${parseFloat(e.extraPrice).toFixed(2)} EUR</td>
      </tr>`).join("")
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:8px; overflow:hidden; margin:16px 0;">
    <tr>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; border-bottom:1px solid #e2e8f0; background-color:#eff6ff;">${strings.colBoat}</td>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; border-bottom:1px solid #e2e8f0; background-color:#eff6ff; text-align:right;">${boat.name}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colDate}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${formatDate(booking.startTime)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colSchedule}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colDuration}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${booking.totalHours} ${booking.totalHours > 1 ? strings.colHours : strings.colHour}</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9;">${strings.colPeople}</td>
      <td style="padding:8px 12px; color:#475569; font-size:14px; border-bottom:1px solid #f1f5f9; text-align:right;">${booking.numberOfPeople}</td>
    </tr>
    ${extrasHtml}
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #f1f5f9;">${strings.colBase}</td>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #f1f5f9; text-align:right;">${(parseFloat(booking.totalAmount) / 1.21).toFixed(2)} EUR</td>
    </tr>
    <tr>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #e2e8f0;">${strings.colVat}</td>
      <td style="padding:8px 12px; color:#475569; font-size:13px; border-bottom:1px solid #e2e8f0; text-align:right;">${(parseFloat(booking.totalAmount) - parseFloat(booking.totalAmount) / 1.21).toFixed(2)} EUR</td>
    </tr>
    <tr>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:700; border-top:2px solid #2563eb;">${strings.colTotal}</td>
      <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:700; border-top:2px solid #2563eb; text-align:right;">${parseFloat(booking.totalAmount).toFixed(2)} EUR</td>
    </tr>
  </table>`;
}

// ===== EMAIL SENDING FUNCTIONS =====

/**
 * Send booking confirmation email after a booking is confirmed.
 */
export async function sendBookingConfirmation(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping booking confirmation email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const strings = getEmailStrings(booking.language);

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.bookingConfirmed}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName},<br>
      ${strings.greeting}
    </p>

    ${bookingDetailsTable(data, strings)}

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">${strings.meetingPoint}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.meetingPointDesc}</p>
      <p style="margin:8px 0 0; color:#475569; font-size:13px;">${strings.arriveEarly}</p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#166534; font-size:14px; font-weight:600;">${strings.contact}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.phone}: <a href="tel:+34611500372" style="color:#2563eb;">+34 611 500 372</a></p>
      <p style="margin:4px 0 0; color:#475569; font-size:14px;">Email: <a href="mailto:costabravarentaboat@gmail.com" style="color:#2563eb;">costabravarentaboat@gmail.com</a></p>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      ${strings.thanks}
    </p>
  `;

  const appUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";
  const cancelUrl = booking.cancelationToken
    ? `${appUrl}/cancel/${booking.cancelationToken}`
    : null;

  const cancelBlock = cancelUrl ? `
    <div style="margin-top:24px; padding:16px; background-color:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; text-align:center;">
      <p style="margin:0 0 8px; color:#64748b; font-size:13px;">${strings.cancelTitle || "Cambio de fecha gratis con 7+ días de antelación. Cancelaciones no reembolsables."}</p>
      <a href="${cancelUrl}" style="color:#dc2626; font-size:13px; text-decoration:underline;">${strings.cancelLink || "Cancelar mi reserva"}</a>
    </div>
  ` : "";

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `${strings.bookingConfirmed} - ${data.boat.name} - ${formatDate(booking.startTime)}`,
      html: emailWrapper(content + cancelBlock),
    }));

    logger.info("Booking confirmation sent", { to: booking.customerEmail, bookingId: booking.id });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending booking confirmation to ${booking.customerEmail}`, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Send booking reminder email 24h before the rental.
 */
export async function sendBookingReminder(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping booking reminder email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const strings = getEmailStrings(booking.language);

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.reminderTitle}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName},<br>
      ${strings.reminderSubtitle}
    </p>

    ${bookingDetailsTable(data, strings)}

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">${strings.meetingPoint}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.meetingPointDesc}</p>
      <p style="margin:8px 0 0; color:#475569; font-size:13px;">${strings.arriveEarly}</p>
    </div>

    <div style="background-color:#fefce8; border-left:4px solid #eab308; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 8px; color:#854d0e; font-size:14px; font-weight:600;">${strings.tipsTitle}</p>
      <ul style="margin:0; padding:0 0 0 18px; color:#475569; font-size:14px; line-height:1.8;">
        ${strings.tips.map(tip => `<li>${tip}</li>`).join("")}
      </ul>
    </div>

    <div style="background-color:#fef2f2; border-left:4px solid #ef4444; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#991b1b; font-size:14px; font-weight:600;">${strings.emergency}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.emergencyCall}: <a href="tel:+34611500372" style="color:#2563eb; font-weight:600;">+34 611 500 372</a></p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 6px; color:#166534; font-size:14px; font-weight:600;">${strings.parking}</p>
      <p style="margin:0; color:#475569; font-size:14px;">${strings.parkingDesc}</p>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      ${strings.seeYouTomorrow}
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `${strings.reminderTitle} - ${data.boat.name}`,
      html: emailWrapper(content),
    }));

    logger.info("Booking reminder sent", { to: booking.customerEmail, bookingId: booking.id });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending booking reminder to ${booking.customerEmail}`, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Send thank-you email 24h after the rental with Google Review link and discount code.
 * @param discountCode - The actual discount code stored in the database
 */
export async function sendThankYouEmail(data: BookingEmailData, discountCode: string): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping thank-you email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking } = data;

  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const strings = getEmailStrings(booking.language);
  const googleReviewUrl = GOOGLE_REVIEW_URL;

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.thankYouTitle}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName},<br>
      ${strings.thankYouIntro} <strong>${data.boat.name}</strong>.
    </p>

    <!-- Google Review CTA (primary) -->
    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 8px; color:#1e3a5f; font-size:16px; font-weight:600;">${strings.reviewTitle}</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px; line-height:1.5;">
        ${strings.reviewDesc}
      </p>
      <a href="${googleReviewUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:700;">${strings.reviewButton}</a>
    </div>

    <!-- TripAdvisor Review CTA (secondary) -->
    <div style="background-color:#f0fdf4; border-radius:8px; padding:16px; margin:0 0 20px; text-align:center;">
      <p style="margin:0 0 10px; color:#166534; font-size:14px; font-weight:600;">TripAdvisor</p>
      <a href="https://www.tripadvisor.com/UserReviewEdit-g187498-e-Blanes_Province_of_Girona_Catalonia.html" target="_blank" style="display:inline-block; background-color:#34e0a1; color:#1a1a1a; text-decoration:none; padding:10px 24px; border-radius:6px; font-size:14px; font-weight:600;">${strings.reviewButton}</a>
    </div>

    <!-- Social sharing -->
    <div style="text-align:center; margin:0 0 20px; padding:12px; background-color:#fafafa; border-radius:6px;">
      <p style="margin:0 0 8px; color:#64748b; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Share your experience</p>
      <a href="https://www.facebook.com/sharer/sharer.php?u=https://www.costabravarentaboat.com" target="_blank" style="display:inline-block; margin:0 4px; padding:8px 14px; background-color:#1877f2; color:#fff; border-radius:4px; font-size:12px; font-weight:600; text-decoration:none;">Facebook</a>
      <a href="https://www.instagram.com/costabravarentaboat/" target="_blank" style="display:inline-block; margin:0 4px; padding:8px 14px; background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888); color:#fff; border-radius:4px; font-size:12px; font-weight:600; text-decoration:none;">Instagram</a>
    </div>

    <!-- Discount Code -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 4px; color:#93c5fd; font-size:13px; text-transform:uppercase; letter-spacing:1px;">${strings.discountDesc}</p>
      <p style="margin:0 0 12px; color:#ffffff; font-size:18px; font-weight:700;">${strings.discountTitle}</p>
      <div style="background-color:rgba(255,255,255,0.15); border:2px dashed rgba(255,255,255,0.4); border-radius:6px; padding:12px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
      </div>
      <p style="margin:12px 0 0; color:#bfdbfe; font-size:12px;">${strings.discountFooter}</p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://www.costabravarentaboat.com" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">${strings.bookAgain}</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      ${strings.seeYouSoon}
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `${strings.thankYouTitle}, ${booking.customerName}!`,
      html: emailWrapper(content),
    }));

    logger.info("Thank-you email sent", { to: booking.customerEmail, bookingId: booking.id, discountCode });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending thank-you email to ${booking.customerEmail}`, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Send pre-season promotional email with a discount code.
 */
export async function sendPreSeasonEmail(
  customerEmail: string,
  customerName: string,
  discountCode: string
): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping pre-season email");
    return { success: false, error: "SendGrid not configured" };
  }

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">La temporada empieza en abril</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${customerName},<br>
      La Costa Brava te espera. La nueva temporada de alquiler de barcos comienza en abril
      y queremos que seas de los primeros en disfrutarla.
    </p>

    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 12px; color:#1e3a5f; font-size:16px; font-weight:600;">Reserva con descuento exclusivo</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px; line-height:1.5;">
        Como cliente habitual, tienes un <strong>10% de descuento</strong> en tu próxima reserva.
      </p>
      <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:6px; padding:16px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${discountCode}</span>
      </div>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://www.costabravarentaboat.com" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:600;">Reservar ahora</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      No pierdas la oportunidad de vivir una experiencia unica en el Mediterraneo.
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: customerEmail,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: "La temporada empieza pronto - 10% descuento para ti",
      html: emailWrapper(content),
    }));

    logger.info("Pre-season email sent", { to: customerEmail });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending pre-season email to ${customerEmail}`, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Send welcome email after new SaaS tenant registration.
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string,
  companyName: string,
  trialEndsAt: Date
): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping welcome email");
    return { success: false, error: "SendGrid not configured" };
  }

  const trialEnd = trialEndsAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  const safeName = firstName?.trim() || "usuario";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Bienvenido/a a Costa Brava Rent a Boat</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${safeName},<br>
      Tu cuenta para <strong>${companyName}</strong> ha sido creada correctamente. Empieza a gestionar tu flota desde el panel de administracion.
    </p>

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:0 0 20px;">
      <p style="margin:0 0 6px; color:#1e3a5f; font-size:14px; font-weight:600;">Periodo de prueba gratuito</p>
      <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
        Tienes acceso completo hasta el <strong>${trialEnd}</strong>. Sin tarjeta de credito requerida.
      </p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://www.costabravarentaboat.com/crm" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">Ir a mi panel</a>
    </div>

    <p style="margin:0; color:#64748b; font-size:13px; line-height:1.6;">
      Si tienes cualquier duda, respondenos a este email o contactanos por WhatsApp.
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: email,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `Bienvenido/a a Costa Brava Rent a Boat — Tu prueba gratuita ha comenzado`,
      html: emailWrapper(content),
    }));

    logger.info("Welcome email sent", { to: email });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending welcome email to ${email}`, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Send password reset email for SaaS authentication.
 */
export async function sendPasswordResetEmail(
  email: string,
  customerName: string,
  resetUrl: string
): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping password reset email");
    return { success: false, error: "SendGrid not configured" };
  }

  const safeName = customerName?.trim() || "cliente";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">Restablecer contrasena</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${safeName},<br>
      Hemos recibido una solicitud para restablecer la contrasena de tu cuenta.
    </p>

    <div style="background-color:#eff6ff; border-left:4px solid #2563eb; border-radius:4px; padding:16px; margin:20px 0;">
      <p style="margin:0 0 10px; color:#1e3a5f; font-size:14px; font-weight:600;">Accion requerida</p>
      <p style="margin:0; color:#475569; font-size:14px; line-height:1.6;">
        Haz clic en el siguiente boton para crear una nueva contrasena.
        Este enlace caduca en <strong>1 hora</strong>.
      </p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="${resetUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">Restablecer contrasena</a>
    </div>

    <p style="margin:0; color:#64748b; font-size:13px; line-height:1.6;">
      Si no solicitaste este cambio, puedes ignorar este email. Tu contrasena actual seguira siendo valida.
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: email,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: "Restablece tu contrasena",
      html: emailWrapper(content),
    }));

    logger.info("Password reset email sent", { to: email });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending password reset email to ${email}`, { error: message });
    return { success: false, error: message };
  }
}

// ===== NEWSLETTER EMAIL =====

interface NewsletterPost {
  title: string;
  excerpt: string;
  slug: string;
  featuredImage: string | null;
}

const NEWSLETTER_STRINGS: Record<string, {
  subject: string;
  greeting: string;
  intro: string;
  readMore: string;
  unsubscribe: string;
  bookNow: string;
}> = {
  es: {
    subject: "Novedades de Costa Brava Rent a Boat",
    greeting: "Hola",
    intro: "Estas son las últimas novedades de nuestro blog. Descubre consejos, destinos y todo lo que necesitas para tu próxima aventura en barco por la Costa Brava.",
    readMore: "Leer artículo",
    unsubscribe: "Cancelar suscripción",
    bookNow: "Reservar ahora",
  },
  en: {
    subject: "News from Costa Brava Rent a Boat",
    greeting: "Hello",
    intro: "Here are the latest posts from our blog. Discover tips, destinations and everything you need for your next boat adventure on the Costa Brava.",
    readMore: "Read article",
    unsubscribe: "Unsubscribe",
    bookNow: "Book now",
  },
  fr: {
    subject: "Nouvelles de Costa Brava Rent a Boat",
    greeting: "Bonjour",
    intro: "Voici les derniers articles de notre blog. Decouvrez des conseils, des destinations et tout ce dont vous avez besoin pour votre prochaine aventure en bateau sur la Costa Brava.",
    readMore: "Lire l'article",
    unsubscribe: "Se desabonner",
    bookNow: "Reserver maintenant",
  },
  de: {
    subject: "Neuigkeiten von Costa Brava Rent a Boat",
    greeting: "Hallo",
    intro: "Hier sind die neuesten Beitrage aus unserem Blog. Entdecken Sie Tipps, Reiseziele und alles, was Sie fur Ihr nachstes Bootsabenteuer an der Costa Brava brauchen.",
    readMore: "Artikel lesen",
    unsubscribe: "Abmelden",
    bookNow: "Jetzt buchen",
  },
};

function getNewsletterStrings(lang: string) {
  return NEWSLETTER_STRINGS[lang] || NEWSLETTER_STRINGS.es;
}

/**
 * Send monthly newsletter with recent blog posts to a subscriber.
 */
export async function sendNewsletterEmail(
  email: string,
  language: string,
  posts: NewsletterPost[],
): Promise<EmailResult> {
  if (!initSendGrid()) {
    return { success: false, error: "SendGrid not configured" };
  }

  const strings = getNewsletterStrings(language);
  const appUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";
  const unsubToken = generateOpaqueUnsubToken(email);
  const unsubUrl = `${appUrl}/api/newsletter/unsubscribe?token=${unsubToken}`;

  const postsHtml = posts.map(post => {
    const imgBlock = post.featuredImage
      ? `<img src="${post.featuredImage}" alt="${post.title}" style="width:100%; max-height:180px; object-fit:cover; border-radius:6px 6px 0 0;">`
      : "";
    return `
      <div style="background:#f8fafc; border-radius:6px; overflow:hidden; margin:0 0 16px;">
        ${imgBlock}
        <div style="padding:16px;">
          <h3 style="margin:0 0 8px; color:#1e3a5f; font-size:16px;">${post.title}</h3>
          <p style="margin:0 0 12px; color:#475569; font-size:13px; line-height:1.5;">${post.excerpt}</p>
          <a href="${appUrl}/blog/${post.slug}" target="_blank" style="color:#2563eb; font-size:13px; font-weight:600; text-decoration:none;">${strings.readMore} &rarr;</a>
        </div>
      </div>
    `;
  }).join("");

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.subject}</h2>
    <p style="margin:0 0 24px; color:#475569; font-size:15px; line-height:1.6;">
      ${strings.greeting},<br>
      ${strings.intro}
    </p>

    ${postsHtml}

    <div style="text-align:center; margin:28px 0 16px;">
      <a href="${appUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:6px; font-size:16px; font-weight:700;">${strings.bookNow}</a>
    </div>

    <p style="margin:24px 0 0; text-align:center;">
      <a href="${unsubUrl}" style="color:#94a3b8; font-size:11px; text-decoration:underline;">${strings.unsubscribe}</a>
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: email,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: strings.subject,
      html: emailWrapper(content),
    }));
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Newsletter send error to ${email}`, { error: message });
    return { success: false, error: message };
  }
}

// ===== CANCELATION EMAIL =====

interface CancelationEmailData {
  booking: Booking;
  refundAmount: number;
  refundPercentage: number;
}

/**
 * Send cancelation confirmation email to customer and notification to owner.
 */
export async function sendCancelationEmail(data: CancelationEmailData): Promise<EmailResult> {
  if (!data.booking.customerEmail) {
    return { success: false, error: "No customer email" };
  }

  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping cancelation email");
    return { success: false, error: "SendGrid not configured" };
  }

  const { booking, refundAmount, refundPercentage } = data;
  const appUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";

  const refundBlock = refundAmount > 0
    ? `<p style="color:#16a34a; font-weight:bold;">Reembolso: ${refundAmount.toFixed(2)} EUR (${refundPercentage}%) — se procesará en los próximos días hábiles.</p>`
    : `<p style="color:#dc2626;">Sin reembolso según política de cancelación (menos de 24h de antelación).</p>`;

  const customerContent = `
    <h2 style="margin:0 0 16px; color:#1e3a5f; font-size:22px;">Reserva cancelada</h2>
    <p style="color:#475569; font-size:15px; margin:0 0 16px;">
      Hola ${booking.customerName}, hemos procesado la cancelación de tu reserva.
    </p>
    ${refundBlock}
    <p style="color:#64748b; font-size:13px; margin-top:24px;">
      Si tienes dudas, contactanos en <a href="mailto:costabravarentaboat@gmail.com" style="color:#2563eb;">costabravarentaboat@gmail.com</a> o al +34 611 500 372.
    </p>
    <p style="margin-top:16px;"><a href="${appUrl}" style="color:#2563eb; text-decoration:none;">Volver a costabravarentaboat.com</a></p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: `Cancelación confirmada — ${booking.customerName}`,
      html: emailWrapper(customerContent),
    }));

    logger.info("Cancelation email sent", { to: booking.customerEmail, bookingId: booking.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error(`[Email] Error sending cancelation email to ${booking.customerEmail}`, { error: message });
    return { success: false, error: message };
  }

  // Owner notification (fire-and-forget)
  const ownerEmail = process.env.OWNER_EMAIL || "costabravarentaboat@gmail.com";
  const ownerContent = `
    <h2 style="color:#dc2626;">Cancelación de reserva</h2>
    <p>Cliente: <strong>${booking.customerName} ${booking.customerSurname}</strong></p>
    <p>Email: ${booking.customerEmail}</p>
    <p>Teléfono: ${booking.customerPhone}</p>
    <p>Fecha: ${new Date(booking.startTime).toLocaleDateString("es-ES")}</p>
    <p>Total: ${booking.totalAmount} EUR</p>
    ${refundAmount > 0 ? `<p style="color:#dc2626;">Reembolso a procesar: ${refundAmount.toFixed(2)} EUR (${refundPercentage}%)</p>` : "<p>Sin reembolso.</p>"}
  `;

  sendgridBreaker.call(() => sgMail.send({
    to: ownerEmail,
    from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
    subject: `[CANCELACIÓN] ${booking.customerName} — ${new Date(booking.startTime).toLocaleDateString("es-ES")}`,
    html: emailWrapper(ownerContent),
  })).catch((err: unknown) => {
    logger.error("[Email] Error sending cancelation owner notification", { error: err instanceof Error ? err.message : String(err) });
  });

  return { success: true };
}

// ===== POST-RENTAL FLYWHEEL EMAILS =====

/**
 * Send referral code email (~3 days after trip).
 * Includes a friend code (15% off) and a personal code (10% off).
 */
export async function sendReferralEmail(
  booking: Booking,
  friendCode: string,
  referrerCode: string,
): Promise<EmailResult> {
  if (!initSendGrid()) {
    return { success: false, error: "SendGrid not configured" };
  }
  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const lang = (booking.language || "es") as EmailLang;
  const strings = REFERRAL_STRINGS[lang] || REFERRAL_STRINGS.es;

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.title}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName}, ${strings.intro}
    </p>

    <!-- Friend code -->
    <div style="background-color:#eff6ff; border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 4px; color:#1e3a5f; font-size:16px; font-weight:600;">${strings.friendTitle}</p>
      <p style="margin:0 0 16px; color:#475569; font-size:14px;">${strings.friendDesc}</p>
      <div style="background-color:#ffffff; border:2px dashed #2563eb; border-radius:6px; padding:12px; display:inline-block;">
        <span style="color:#2563eb; font-size:22px; font-weight:700; letter-spacing:2px;">${friendCode}</span>
      </div>
    </div>

    <!-- Referrer reward -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius:8px; padding:24px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 4px; color:#93c5fd; font-size:13px; text-transform:uppercase; letter-spacing:1px;">${strings.yourReward}</p>
      <p style="margin:0 0 12px; color:#ffffff; font-size:18px; font-weight:700;">${strings.yourRewardDesc}</p>
      <div style="background-color:rgba(255,255,255,0.15); border:2px dashed rgba(255,255,255,0.4); border-radius:6px; padding:12px; display:inline-block;">
        <span style="color:#ffffff; font-size:20px; font-weight:700; letter-spacing:2px;">${referrerCode}</span>
      </div>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://www.costabravarentaboat.com" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">${strings.bookNow}</a>
    </div>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: strings.subject.replace("{name}", booking.customerName),
      html: emailWrapper(content),
    }));

    logger.info("Referral email sent", { to: booking.customerEmail, bookingId: booking.id, friendCode, referrerCode });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Email] Error sending referral email", { to: booking.customerEmail, error: message });
    return { success: false, error: message };
  }
}

/**
 * Send early bird offer email (~7 days after trip).
 * Includes a 20% discount code for next season.
 */
export async function sendEarlyBirdEmail(
  booking: Booking,
  earlyBirdCode: string,
  expiresAt: Date,
): Promise<EmailResult> {
  if (!initSendGrid()) {
    return { success: false, error: "SendGrid not configured" };
  }
  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const lang = (booking.language || "es") as EmailLang;
  const strings = EARLY_BIRD_STRINGS[lang] || EARLY_BIRD_STRINGS.es;
  const expiresStr = expiresAt.toLocaleDateString(lang === "en" ? "en-GB" : `${lang}-ES`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:20px;">${strings.title}</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      ${booking.customerName}, ${strings.intro}
    </p>

    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius:8px; padding:28px; margin:20px 0; text-align:center;">
      <p style="margin:0 0 8px; color:#ffffff; font-size:14px; text-transform:uppercase; letter-spacing:1.5px; font-weight:600;">${strings.offerLabel}</p>
      <p style="margin:0 0 16px; color:#ffffff; font-size:28px; font-weight:700;">20% OFF</p>
      <div style="background-color:rgba(255,255,255,0.2); border:2px dashed rgba(255,255,255,0.5); border-radius:6px; padding:12px; display:inline-block;">
        <span style="color:#ffffff; font-size:22px; font-weight:700; letter-spacing:2px;">${earlyBirdCode}</span>
      </div>
      <p style="margin:12px 0 0; color:#fef3c7; font-size:13px;">${strings.validUntil} ${expiresStr}</p>
    </div>

    <div style="text-align:center; margin:24px 0;">
      <a href="https://www.costabravarentaboat.com" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-size:15px; font-weight:600;">${strings.bookNow}</a>
    </div>

    <p style="margin:20px 0 0; color:#475569; font-size:14px; line-height:1.5; text-align:center;">
      ${strings.footer}
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      subject: strings.subject.replace("{name}", booking.customerName),
      html: emailWrapper(content),
    }));

    logger.info("Early bird email sent", { to: booking.customerEmail, bookingId: booking.id, earlyBirdCode });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Email] Error sending early bird email", { to: booking.customerEmail, error: message });
    return { success: false, error: message };
  }
}

// ===== FLYWHEEL EMAIL STRINGS =====

interface ReferralStrings {
  subject: string;
  title: string;
  intro: string;
  friendTitle: string;
  friendDesc: string;
  yourReward: string;
  yourRewardDesc: string;
  bookNow: string;
}

const REFERRAL_STRINGS: Record<EmailLang, ReferralStrings> = {
  es: {
    subject: "{name}, comparte el mar con tus amigos",
    title: "Comparte el mar",
    intro: "nos encanta que hayas disfrutado de tu experiencia en la Costa Brava. Ahora puedes regalar esa experiencia a tus amigos.",
    friendTitle: "15% de descuento para tu amigo",
    friendDesc: "Comparte este codigo con alguien especial",
    yourReward: "Tu recompensa",
    yourRewardDesc: "10% en tu proxima reserva",
    bookNow: "Reservar ahora",
  },
  en: {
    subject: "{name}, share the sea with your friends",
    title: "Share the sea",
    intro: "we loved having you on the Costa Brava waters. Now you can give your friends the same experience.",
    friendTitle: "15% off for your friend",
    friendDesc: "Share this code with someone special",
    yourReward: "Your reward",
    yourRewardDesc: "10% off your next trip",
    bookNow: "Book now",
  },
  fr: {
    subject: "{name}, partagez la mer avec vos amis",
    title: "Partagez la mer",
    intro: "nous sommes ravis que vous ayez profite de votre experience sur la Costa Brava. Offrez la meme experience a vos amis.",
    friendTitle: "15% de reduction pour votre ami",
    friendDesc: "Partagez ce code avec quelqu'un de special",
    yourReward: "Votre recompense",
    yourRewardDesc: "10% sur votre prochaine reservation",
    bookNow: "Reservez maintenant",
  },
  de: {
    subject: "{name}, teilen Sie das Meer mit Ihren Freunden",
    title: "Teilen Sie das Meer",
    intro: "wir freuen uns, dass Sie Ihr Erlebnis an der Costa Brava genossen haben. Schenken Sie Ihren Freunden dasselbe Erlebnis.",
    friendTitle: "15% Rabatt fur Ihren Freund",
    friendDesc: "Teilen Sie diesen Code mit jemandem Besonderem",
    yourReward: "Ihre Belohnung",
    yourRewardDesc: "10% auf Ihre nachste Buchung",
    bookNow: "Jetzt buchen",
  },
  nl: {
    subject: "{name}, deel de zee met je vrienden",
    title: "Deel de zee",
    intro: "we vonden het geweldig dat je van je ervaring aan de Costa Brava hebt genoten. Geef je vrienden dezelfde ervaring.",
    friendTitle: "15% korting voor je vriend",
    friendDesc: "Deel deze code met iemand speciaal",
    yourReward: "Jouw beloning",
    yourRewardDesc: "10% korting op je volgende boeking",
    bookNow: "Nu boeken",
  },
  it: {
    subject: "{name}, condividi il mare con i tuoi amici",
    title: "Condividi il mare",
    intro: "siamo felici che tu abbia apprezzato la tua esperienza sulla Costa Brava. Ora puoi regalare la stessa esperienza ai tuoi amici.",
    friendTitle: "15% di sconto per il tuo amico",
    friendDesc: "Condividi questo codice con qualcuno di speciale",
    yourReward: "La tua ricompensa",
    yourRewardDesc: "10% sulla tua prossima prenotazione",
    bookNow: "Prenota ora",
  },
  ru: {
    subject: "{name}, podelites morem s druzyami",
    title: "Podelites morem",
    intro: "nam priyatno, chto vam ponravilos na Kosta Brave. Teper vy mozhete podarit eto zhe vpechatlenie svoim druzyam.",
    friendTitle: "Skidka 15% dlya vashego druga",
    friendDesc: "Podelites etim kodom s kem-to osobennym",
    yourReward: "Vasha nagrada",
    yourRewardDesc: "Skidka 10% na sleduyushchuyu bronirovaniyu",
    bookNow: "Zabronirovat",
  },
  ca: {
    subject: "{name}, comparteix el mar amb els teus amics",
    title: "Comparteix el mar",
    intro: "ens encanta que hagis gaudit de la teva experiència a la Costa Brava. Ara pots regalar aquesta experiència als teus amics.",
    friendTitle: "15% de descompte per al teu amic",
    friendDesc: "Comparteix aquest codi amb algú especial",
    yourReward: "La teva recompensa",
    yourRewardDesc: "10% en la teva propera reserva",
    bookNow: "Reservar ara",
  },
};

interface EarlyBirdStrings {
  subject: string;
  title: string;
  intro: string;
  offerLabel: string;
  validUntil: string;
  bookNow: string;
  footer: string;
}

const EARLY_BIRD_STRINGS: Record<EmailLang, EarlyBirdStrings> = {
  es: {
    subject: "{name}, reserva la proxima temporada con 20% de descuento",
    title: "Reserva anticipada",
    intro: "la temporada pasada fue increible. Asegura tu lugar para la proxima temporada con un descuento exclusivo.",
    offerLabel: "Oferta exclusiva",
    validUntil: "Valido hasta",
    bookNow: "Reservar temporada",
    footer: "Este descuento es exclusivo para ti como cliente. No es acumulable con otras ofertas.",
  },
  en: {
    subject: "{name}, book next season with 20% off",
    title: "Early bird offer",
    intro: "last season was amazing. Secure your spot for next season with an exclusive discount.",
    offerLabel: "Exclusive offer",
    validUntil: "Valid until",
    bookNow: "Book next season",
    footer: "This discount is exclusive to you as a customer. Cannot be combined with other offers.",
  },
  fr: {
    subject: "{name}, reservez la prochaine saison avec 20% de reduction",
    title: "Offre anticipee",
    intro: "la saison derniere etait incroyable. Assurez votre place pour la prochaine saison avec une reduction exclusive.",
    offerLabel: "Offre exclusive",
    validUntil: "Valable jusqu'au",
    bookNow: "Reservez la saison",
    footer: "Cette reduction vous est exclusivement reservee. Non cumulable avec d'autres offres.",
  },
  de: {
    subject: "{name}, buchen Sie nachste Saison mit 20% Rabatt",
    title: "Fruhbucher-Angebot",
    intro: "die letzte Saison war fantastisch. Sichern Sie sich Ihren Platz fur die nachste Saison mit einem exklusiven Rabatt.",
    offerLabel: "Exklusives Angebot",
    validUntil: "Gultig bis",
    bookNow: "Saison buchen",
    footer: "Dieser Rabatt ist exklusiv fur Sie als Kunde. Nicht mit anderen Angeboten kombinierbar.",
  },
  nl: {
    subject: "{name}, boek volgend seizoen met 20% korting",
    title: "Vroegboek-aanbieding",
    intro: "vorig seizoen was geweldig. Verzeker je plek voor volgend seizoen met een exclusieve korting.",
    offerLabel: "Exclusieve aanbieding",
    validUntil: "Geldig tot",
    bookNow: "Seizoen boeken",
    footer: "Deze korting is exclusief voor jou als klant. Niet te combineren met andere aanbiedingen.",
  },
  it: {
    subject: "{name}, prenota la prossima stagione con il 20% di sconto",
    title: "Offerta anticipata",
    intro: "la scorsa stagione e stata incredibile. Assicurati il tuo posto per la prossima stagione con uno sconto esclusivo.",
    offerLabel: "Offerta esclusiva",
    validUntil: "Valido fino al",
    bookNow: "Prenota la stagione",
    footer: "Questo sconto e esclusivo per te come cliente. Non cumulabile con altre offerte.",
  },
  ru: {
    subject: "{name}, zabroniruyte sleduyushchiy sezon so skidkoy 20%",
    title: "Ranneye bronirovanie",
    intro: "proshlyy sezon byl potryasayushchim. Obespechte sebe mesto na sleduyushchiy sezon s eksklyuzivnoy skidkoy.",
    offerLabel: "Eksklyuzivnoye predlozheniye",
    validUntil: "Deystvitelno do",
    bookNow: "Zabronirovat sezon",
    footer: "Eta skidka eksklyuzivna dlya vas kak klienta. Ne summiruyetsya s drugimi predlozheniyami.",
  },
  ca: {
    subject: "{name}, reserva la propera temporada amb un 20% de descompte",
    title: "Reserva anticipada",
    intro: "la temporada passada va ser increïble. Assegura el teu lloc per a la propera temporada amb un descompte exclusiu.",
    offerLabel: "Oferta exclusiva",
    validUntil: "Vàlid fins al",
    bookNow: "Reservar temporada",
    footer: "Aquest descompte és exclusiu per a tu com a client. No és acumulable amb altres ofertes.",
  },
};

// ===== PARTNERSHIP OUTREACH EMAIL =====

interface PartnershipEmailData {
  email: string;
  hotelName: string;
  contactName?: string;
  town: string;
  unsubscribeUrl: string;
}

const TOWN_NAMES: Record<string, string> = {
  blanes: "Blanes",
  lloret: "Lloret de Mar",
  tossa: "Tossa de Mar",
  malgrat: "Malgrat de Mar",
  "santa-susanna": "Santa Susanna",
  calella: "Calella",
};

export async function sendPartnershipProposal(data: PartnershipEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    return { success: false, error: "SendGrid not configured" };
  }

  const townName = TOWN_NAMES[data.town] || data.town;
  const greeting = data.contactName ? `Estimado/a ${data.contactName}` : `Estimado equipo de ${data.hotelName}`;

  const content = `
    <!-- 1. Saludo personal -->
    <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.7;">
      ${greeting},
    </p>

    <!-- 2. Pitch + social proof inline -->
    <p style="margin:0 0 16px; color:#334155; font-size:15px; line-height:1.7;">
      Soy Iv&aacute;n, de <strong>Costa Brava Rent a Boat</strong>, la empresa de alquiler de embarcaciones del <strong>Puerto de Blanes</strong> con <strong>4.8 estrellas en Google</strong>, m&aacute;s de <strong>5.000 clientes satisfechos</strong> y <strong>6 temporadas consecutivas</strong> operando en la Costa Brava.
    </p>

    <!-- 3. Puente contextual hotel -->
    <p style="margin:0 0 28px; color:#334155; font-size:15px; line-height:1.7;">
      Sabemos que los hu&eacute;spedes de <strong>${data.hotelName}</strong> en ${townName} buscan experiencias &uacute;nicas durante su estancia. Queremos que puedas ofrecerles la mejor actividad n&aacute;utica de la zona &mdash; y que tu equipo gane dinero por ello.
    </p>

    <!-- 4. Hero: 10% comision -->
    <div style="background:linear-gradient(135deg,#0d1a2d,#1a2a4a); border-radius:12px; padding:40px 32px; margin:0 0 28px; text-align:center; border:1px solid rgba(168,196,221,0.2);">
      <p style="margin:0 0 12px; color:#A8C4DD; font-size:12px; text-transform:uppercase; letter-spacing:2px; font-weight:600;">PROPUESTA DE COLABORACI&Oacute;N</p>
      <p style="margin:0 0 12px; color:#ffffff; font-size:32px; font-weight:700; font-family:'Clash Display',Arial,sans-serif; line-height:1.2;">10% de comisi&oacute;n por cada reserva</p>
      <p style="margin:0; color:#A8C4DD; font-size:16px; line-height:1.5;">Para ti o tu equipo de recepci&oacute;n.</p>
    </div>

    <!-- 5. Social Proof Strip -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
      <tr>
        <td width="33%" style="text-align:center; padding:16px 8px; border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 4px; color:#0d1a2d; font-size:24px; font-weight:700; font-family:'Clash Display',Arial,sans-serif;">4.8 <span style="color:#f59e0b;">&#9733;</span></p>
          <p style="margin:0; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Google Reviews</p>
        </td>
        <td width="33%" style="text-align:center; padding:16px 8px; border-right:1px solid #e2e8f0;">
          <p style="margin:0 0 4px; color:#0d1a2d; font-size:24px; font-weight:700; font-family:'Clash Display',Arial,sans-serif;">5.000+</p>
          <p style="margin:0; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Clientes</p>
        </td>
        <td width="33%" style="text-align:center; padding:16px 8px;">
          <p style="margin:0 0 4px; color:#0d1a2d; font-size:24px; font-weight:700; font-family:'Clash Display',Arial,sans-serif;">6+</p>
          <p style="margin:0; color:#64748b; font-size:11px; text-transform:uppercase; letter-spacing:1px;">Temporadas</p>
        </td>
      </tr>
    </table>

    <!-- 6. Como funciona (3 pasos) -->
    <div style="margin:0 0 28px;">
      <h3 style="margin:0 0 20px; color:#0d1a2d; font-size:17px; font-weight:700; font-family:'Clash Display', Arial, sans-serif;">C&oacute;mo funciona</h3>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 0 16px; vertical-align:top; width:48px;">
            <div style="width:36px; height:36px; background:linear-gradient(135deg,#0d1a2d,#1a2a4a); color:#A8C4DD; border-radius:50%; text-align:center; line-height:36px; font-size:15px; font-weight:700;">1</div>
          </td>
          <td style="padding:6px 0 16px 12px; color:#334155; font-size:14px; line-height:1.6; border-bottom:1px solid #e2e8f0;">Ll&aacute;manos para reservar la actividad para tu hu&eacute;sped</td>
        </tr>
        <tr>
          <td style="padding:16px 0 16px; vertical-align:top; width:48px;">
            <div style="width:36px; height:36px; background:linear-gradient(135deg,#0d1a2d,#1a2a4a); color:#A8C4DD; border-radius:50%; text-align:center; line-height:36px; font-size:15px; font-weight:700;">2</div>
          </td>
          <td style="padding:22px 0 16px 12px; color:#334155; font-size:14px; line-height:1.6; border-bottom:1px solid #e2e8f0;">El cliente paga la se&ntilde;al en tu recepci&oacute;n &mdash; cobras tu comisi&oacute;n al momento</td>
        </tr>
        <tr>
          <td style="padding:16px 0 0; vertical-align:top; width:48px;">
            <div style="width:36px; height:36px; background:linear-gradient(135deg,#0d1a2d,#1a2a4a); color:#A8C4DD; border-radius:50%; text-align:center; line-height:36px; font-size:15px; font-weight:700;">3</div>
          </td>
          <td style="padding:22px 0 0 12px; color:#334155; font-size:14px; line-height:1.6;">Enviamos la confirmaci&oacute;n de reserva por WhatsApp directamente al cliente</td>
        </tr>
      </table>
    </div>

    <!-- 7. Nuestra flota (checklist verde) -->
    <div style="background:rgba(168, 196, 221, 0.15); border-radius:12px; padding:24px; margin:0 0 28px;">
      <h3 style="margin:0 0 16px; color:#0d1a2d; font-size:17px; font-weight:700; font-family:'Clash Display', Arial, sans-serif;">Nuestra flota</h3>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;">8 barcos (con y sin licencia) para 4-7 personas</td></tr>
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;">Gasolina incluida en barcos sin licencia (desde 70 EUR/h)</td></tr>
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;">Excursiones a calas, Lloret de Mar, Tossa de Mar</td></tr>
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;">Reserva online inmediata o por WhatsApp</td></tr>
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;">Seguro a todo riesgo incluido</td></tr>
        <tr><td style="padding:0 8px 0 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0; color:#334155; font-size:14px; line-height:1.6;">Una experiencia n&aacute;utica premium para tus hu&eacute;spedes</td></tr>
      </table>
    </div>

    <!-- 8. Que ofrecemos a ${data.hotelName} -->
    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin:0 0 28px;">
      <h3 style="margin:0 0 16px; color:#0d1a2d; font-size:17px; font-weight:700; font-family:'Clash Display', Arial, sans-serif;">Qu&eacute; ofrecemos a ${data.hotelName}</h3>
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;"><strong>10% de comisi&oacute;n</strong> por cada reserva referida</td></tr>
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;"><strong>Flyers y c&oacute;digos QR gratis</strong> personalizados para recepci&oacute;n</td></tr>
        <tr><td style="padding:0 8px 8px 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0 0 8px; color:#334155; font-size:14px; line-height:1.6;"><strong>Reserva por tel&eacute;fono en 2 minutos</strong> &mdash; nos llamas y lo gestionamos todo</td></tr>
        <tr><td style="padding:0 8px 0 0; color:#22c55e; font-size:16px; vertical-align:top;">&#10003;</td><td style="padding:0; color:#334155; font-size:14px; line-height:1.6;"><strong>Empresa certificada</strong> &mdash; Centres N&agrave;utica y Cl&uacute;ster N&agrave;utic de Catalunya</td></tr>
      </table>
    </div>

    <!-- 9. Urgencia estacional -->
    <p style="margin:0 0 28px; color:#64748b; font-size:14px; font-style:italic; line-height:1.6; text-align:center;">
      La temporada n&aacute;utica comienza en abril. Aseg&uacute;rate de ofrecer esta experiencia a tus hu&eacute;spedes desde el primer d&iacute;a.
    </p>

    <!-- 10. CTA WhatsApp (principal) -->
    <div style="text-align:center; margin:0 0 16px;">
      <a href="https://wa.me/34611500372?text=${encodeURIComponent(`Hola, soy de ${data.hotelName} en ${townName}. Me interesa la propuesta de colaboración.`)}"
         target="_blank"
         style="display:block; background-color:#25d366; color:#ffffff; text-decoration:none; padding:16px 32px; border-radius:50px; font-size:17px; font-weight:700; text-align:center;">
        Contactar por WhatsApp
      </a>
    </div>

    <!-- 11. CTAs secundarios: Email + Llamar -->
    <div style="text-align:center; margin:0 0 12px;">
      <a href="mailto:costabravarentaboat@gmail.com"
         style="display:inline-block; background-color:#A8C4DD; color:#0d1a2d; text-decoration:none; padding:12px 28px; border-radius:50px; font-size:14px; font-weight:700;">
        Escr&iacute;benos por email
      </a>
      &nbsp;&nbsp;
      <a href="tel:+34611500372"
         style="display:inline-block; background-color:#A8C4DD; color:#0d1a2d; text-decoration:none; padding:12px 28px; border-radius:50px; font-size:14px; font-weight:700;">
        Llamar: +34 611 500 372
      </a>
    </div>

    <!-- 12. CTA Ghost: Ver web -->
    <div style="text-align:center; margin:12px 0 0;">
      <a href="https://www.costabravarentaboat.com" style="display:inline-block; border:2px solid #A8C4DD; color:#0d1a2d; padding:11px 24px; border-radius:50px; font-size:13px; font-weight:600; text-decoration:none;">
        Ver nuestra web &#8594;
      </a>
    </div>

    <!-- 13. Firma -->
    <div style="border-top:1px solid #e2e8f0; margin:28px 0 0; padding:24px 0 0;">
      <p style="margin:0; color:#334155; font-size:15px; line-height:1.7;">
        Un cordial saludo,<br>
        <strong>Iv&aacute;n</strong><br>
        <span style="color:#64748b; font-size:13px;">Costa Brava Rent a Boat &middot; Puerto de Blanes</span>
      </p>
    </div>

    <!-- 14. Unsubscribe -->
    <p style="margin:24px 0 0; text-align:center;">
      <a href="${data.unsubscribeUrl}" style="color:#94a3b8; font-size:11px; text-decoration:underline;">No deseo recibir m&aacute;s correos de este tipo</a>
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: data.email,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      replyTo: { email: "costabravarentaboat@gmail.com", name: "Ivan - Costa Brava Rent a Boat" },
      subject: `${data.hotelName} x Costa Brava Rent a Boat — 10% comisión por reserva`,
      html: emailWrapper(content),
    }));

    logger.info("[Email] Partnership proposal sent", { to: data.email, hotel: data.hotelName });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Email] Error sending partnership proposal", { to: data.email, error: message });
    return { success: false, error: message };
  }
}

// ============================================================================
// Booking REQUEST flow (no-payment / awaiting Ivan's manual confirmation)
// ============================================================================
//
// Used when the customer submits a reservation request through the website but
// no online payment is collected. Ivan reviews the request, contacts the
// customer to coordinate payment in person, and only then promotes the
// booking to "confirmed". Two emails fire:
//   - Customer: "we received your request, we'll be in touch within 24h"
//   - Admin (Ivan): "new booking request — full details, action needed"
//
// Copy is intentionally hardcoded in Spanish for v1. i18n added in next pass
// once the flow is validated in production.

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "costabravarentaboat@gmail.com";

/**
 * Customer-facing email after submitting a booking request.
 * Tone: warm, sets expectation of personal contact within 24h.
 */
export async function sendBookingRequestReceived(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping booking request email");
    return { success: false, error: "SendGrid not configured" };
  }
  const { booking, boat, extras } = data;
  if (!booking.customerEmail) {
    return { success: false, error: "No customer email address" };
  }

  const extrasLine = extras.length > 0
    ? `<tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Extras</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${extras.map(e => e.extraName).join(", ")}</td></tr>`
    : "";

  const content = `
    <h2 style="margin:0 0 8px; color:#1e3a5f; font-size:22px;">Hemos recibido tu solicitud</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
      Hola ${booking.customerName},<br>
      Gracias por tu inter&eacute;s en reservar con Costa Brava Rent a Boat.
      <strong>Te contactaremos en menos de 24h</strong> para confirmar disponibilidad
      y coordinar el pago.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:8px; overflow:hidden; margin:16px 0;">
      <tr>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; background-color:#eff6ff;">Barco</td>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; background-color:#eff6ff; text-align:right;">${boat.name}</td>
      </tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Fecha</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${formatDate(booking.startTime)}</td></tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Hora</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${formatTime(booking.startTime)} &mdash; ${formatTime(booking.endTime)}</td></tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Personas</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${booking.numberOfPeople}</td></tr>
      ${extrasLine}
      <tr>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:600; background-color:#eff6ff; border-top:2px solid #cbd5e1;">Importe estimado</td>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:600; background-color:#eff6ff; border-top:2px solid #cbd5e1; text-align:right;">${parseFloat(booking.totalAmount).toFixed(2)} EUR</td>
      </tr>
    </table>

    <div style="background-color:#fef3c7; border-left:4px solid #f59e0b; border-radius:4px; padding:14px 16px; margin:20px 0;">
      <p style="margin:0; color:#78350f; font-size:14px; line-height:1.5;">
        <strong>Importante:</strong> esta es una <strong>solicitud</strong>, no una reserva confirmada.
        Te contactaremos por WhatsApp o email para confirmar disponibilidad y coordinar el pago
        antes de garantizar tu plaza.
      </p>
    </div>

    <div style="background-color:#f0fdf4; border-left:4px solid #22c55e; border-radius:4px; padding:14px 16px; margin:20px 0;">
      <p style="margin:0 0 4px; color:#166534; font-size:14px; font-weight:600;">&iquest;Tienes prisa?</p>
      <p style="margin:0; color:#475569; font-size:14px;">Escr&iacute;benos directamente:</p>
      <p style="margin:6px 0 0; color:#475569; font-size:14px;">WhatsApp: <a href="https://wa.me/34611500372" style="color:#2563eb;">+34 611 500 372</a></p>
      <p style="margin:4px 0 0; color:#475569; font-size:14px;">Email: <a href="mailto:costabravarentaboat@gmail.com" style="color:#2563eb;">costabravarentaboat@gmail.com</a></p>
    </div>

    <p style="margin:24px 0 0; color:#475569; font-size:14px; line-height:1.5;">
      Un saludo,<br>
      <strong>Iv&aacute;n</strong> &mdash; Costa Brava Rent a Boat
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: booking.customerEmail!,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat" },
      replyTo: { email: ADMIN_NOTIFICATION_EMAIL, name: "Iv&aacute;n - Costa Brava Rent a Boat" },
      subject: `Hemos recibido tu solicitud - ${data.boat.name} - ${formatDate(booking.startTime)}`,
      html: emailWrapper(content),
    }));
    logger.info("[Email] Booking request received email sent", { to: booking.customerEmail, bookingId: booking.id });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Email] Error sending booking request email", { to: booking.customerEmail, error: message });
    return { success: false, error: message };
  }
}

/**
 * Admin-facing notification when a new booking request comes in.
 * Includes all customer contact info so Ivan can reach out directly.
 */
export async function sendBookingRequestAdminNotification(data: BookingEmailData): Promise<EmailResult> {
  if (!initSendGrid()) {
    logger.info("SendGrid not configured, skipping admin booking request notification");
    return { success: false, error: "SendGrid not configured" };
  }
  const { booking, boat, extras } = data;

  const appUrl = process.env.APP_URL || "https://www.costabravarentaboat.com";
  const adminUrl = `${appUrl}/crm/bookings`;
  const phoneFull = (booking.customerPhone || "").trim();
  const whatsappLink = phoneFull
    ? `https://wa.me/${phoneFull.replace(/\D/g, "")}`
    : null;

  const extrasLine = extras.length > 0
    ? `<tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Extras</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${extras.map(e => e.extraName).join(", ")}</td></tr>`
    : "";

  const content = `
    <h2 style="margin:0 0 8px; color:#dc2626; font-size:22px;">📩 Nueva solicitud de reserva</h2>
    <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.5;">
      Te ha llegado una solicitud por la web. Cont&aacute;ctale por WhatsApp o tel&eacute;fono
      para confirmar disponibilidad y coordinar el pago.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border-radius:8px; overflow:hidden; margin:16px 0;">
      <tr>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; background-color:#eff6ff;">Cliente</td>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; background-color:#eff6ff; text-align:right;">${booking.customerName} ${booking.customerSurname || ""}</td>
      </tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Email</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;"><a href="mailto:${booking.customerEmail}" style="color:#2563eb;">${booking.customerEmail || "(no proporcionado)"}</a></td></tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Tel&eacute;fono</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${phoneFull || "(no proporcionado)"} ${whatsappLink ? `&middot; <a href="${whatsappLink}" style="color:#22c55e;">WhatsApp</a>` : ""}</td></tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Idioma</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${booking.language || "es"}</td></tr>
      <tr>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; background-color:#eff6ff;">Barco</td>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:14px; font-weight:600; background-color:#eff6ff; text-align:right;">${boat.name}</td>
      </tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Fecha</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${formatDate(booking.startTime)}</td></tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Hora</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${formatTime(booking.startTime)} &mdash; ${formatTime(booking.endTime)}</td></tr>
      <tr><td style="padding:6px 12px; color:#475569; font-size:14px;">Personas</td><td style="padding:6px 12px; color:#475569; font-size:14px; text-align:right;">${booking.numberOfPeople}</td></tr>
      ${extrasLine}
      <tr>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:600; background-color:#eff6ff; border-top:2px solid #cbd5e1;">Importe</td>
        <td style="padding:10px 12px; color:#1e3a5f; font-size:15px; font-weight:600; background-color:#eff6ff; border-top:2px solid #cbd5e1; text-align:right;">${parseFloat(booking.totalAmount).toFixed(2)} EUR</td>
      </tr>
    </table>

    <div style="text-align:center; margin:24px 0;">
      ${whatsappLink ? `<a href="${whatsappLink}" style="display:inline-block; background-color:#22c55e; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px; margin:0 6px;">Contactar por WhatsApp</a>` : ""}
      <a href="${adminUrl}" style="display:inline-block; background-color:#1e3a5f; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; font-weight:600; font-size:14px; margin:0 6px;">Ver en panel admin</a>
    </div>

    <p style="margin:20px 0 0; color:#94a3b8; font-size:12px; line-height:1.5;">
      Booking ID: <code>${booking.id}</code> &middot; Estado actual: <code>${booking.bookingStatus}</code>
    </p>
  `;

  try {
    await sendgridBreaker.call(() => sgMail.send({
      to: ADMIN_NOTIFICATION_EMAIL,
      from: { email: getFromEmail(), name: "Costa Brava Rent a Boat - Solicitudes" },
      replyTo: booking.customerEmail
        ? { email: booking.customerEmail, name: `${booking.customerName} ${booking.customerSurname || ""}` }
        : undefined,
      subject: `🆕 Solicitud: ${boat.name} - ${formatDate(booking.startTime)} - ${booking.customerName}`,
      html: emailWrapper(content),
    }));
    logger.info("[Email] Booking request admin notification sent", { to: ADMIN_NOTIFICATION_EMAIL, bookingId: booking.id });
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("[Email] Error sending admin booking request notification", { error: message });
    return { success: false, error: message };
  }
}
