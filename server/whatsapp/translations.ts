// WhatsApp Chatbot Translations - ES, EN, FR, CA

export type SupportedLanguage = "es" | "en" | "fr" | "ca";

export interface ChatbotTranslations {
  // Welcome & Menu
  welcome: string;
  welcomeBack: string;
  mainMenuTitle: string;
  mainMenuOptions: string[];
  unknownCommand: string;
  backToMenu: string;

  // Boats
  ourBoats: string;
  boatListHeader: string;
  boatDetails: string;
  selectBoatPrompt: string;
  noLicenseRequired: string;
  licenseRequired: string;
  capacity: string;
  fromPrice: string;
  boatNotFound: string;

  // Availability
  checkAvailabilityTitle: string;
  enterDatePrompt: string;
  invalidDateFormat: string;
  outOfSeason: string;
  availabilityResult: string;
  available: string;
  occupied: string;
  selectBoatForAvailability: string;
  noBoatsAvailable: string;
  allBoatsAvailable: string;

  // Booking Flow
  startBookingTitle: string;
  bookingDatePrompt: string;
  bookingBoatPrompt: string;
  bookingTimePrompt: string;
  bookingDurationPrompt: string;
  bookingPeoplePrompt: string;
  bookingExtrasPrompt: string;
  bookingContactNamePrompt: string;
  bookingContactEmailPrompt: string;
  bookingConfirmTitle: string;
  bookingConfirmDetails: string;
  bookingConfirmPrompt: string;
  bookingCreated: string;
  bookingPaymentLink: string;
  invalidPeopleCount: string;
  capacityExceeded: string;

  // Extras
  extrasTitle: string;
  extrasList: string[];
  noExtras: string;
  extrasSelected: string;

  // Prices
  pricesTitle: string;
  seasonLow: string;
  seasonMid: string;
  seasonHigh: string;
  depositRequired: string;
  fuelIncluded: string;
  fuelNotIncluded: string;

  // Agent
  agentHandoff: string;
  agentNotified: string;

  // General
  yes: string;
  no: string;
  confirm: string;
  cancel: string;
  thanks: string;
  goodbye: string;
  error: string;
  invalidOption: string;
  typeMenuToReturn: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, ChatbotTranslations> = {
  es: {
    // Welcome & Menu
    welcome:
      "¡Hola! 👋 Bienvenido a *Costa Brava Rent a Boat*\n\nSomos especialistas en alquiler de barcos en Blanes. ¿En qué podemos ayudarte?",
    welcomeBack: "¡Hola de nuevo! 👋 ¿En qué podemos ayudarte?",
    mainMenuTitle: "📋 *Menú Principal*",
    mainMenuOptions: [
      "1️⃣ Ver nuestros barcos",
      "2️⃣ Consultar disponibilidad",
      "3️⃣ Ver precios",
      "4️⃣ Hacer una reserva",
      "5️⃣ Hablar con un agente",
    ],
    unknownCommand:
      "No he entendido tu mensaje. Escribe *menú* para ver las opciones disponibles.",
    backToMenu: "\n\n_Escribe *menú* para volver al inicio_",

    // Boats
    ourBoats: "🚤 *Nuestra Flota*",
    boatListHeader:
      "Disponemos de barcos con y sin licencia para disfrutar de la Costa Brava:",
    boatDetails: "📋 *Detalles del Barco*",
    selectBoatPrompt: "\n_Responde con el número del barco para más info_",
    noLicenseRequired: "Sin licencia",
    licenseRequired: "Requiere licencia",
    capacity: "personas",
    fromPrice: "desde",
    boatNotFound: "❌ Barco no encontrado. Por favor, selecciona una opción válida.",

    // Availability
    checkAvailabilityTitle: "📅 *Consultar Disponibilidad*",
    enterDatePrompt:
      "¿Para qué fecha quieres consultar?\n\n_Escribe la fecha en formato DD/MM/AAAA (ej: 15/07/2025)_",
    invalidDateFormat:
      "❌ Formato de fecha incorrecto. Por favor usa DD/MM/AAAA (ej: 15/07/2025)",
    outOfSeason:
      "⚠️ Esa fecha está fuera de temporada. Operamos de *abril a octubre*.",
    availabilityResult: "📅 *Disponibilidad para {date}*",
    available: "✅ Disponible",
    occupied: "❌ Ocupado",
    selectBoatForAvailability: "\n_Responde con el número para reservar_",
    noBoatsAvailable:
      "😔 Lo sentimos, no hay barcos disponibles para esa fecha.",
    allBoatsAvailable: "🎉 ¡Todos los barcos están disponibles!",

    // Booking Flow
    startBookingTitle: "🎯 *Nueva Reserva*",
    bookingDatePrompt:
      "¡Perfecto! Vamos a crear tu reserva.\n\n¿Para qué fecha? _DD/MM/AAAA_",
    bookingBoatPrompt: "¿Qué barco te gustaría reservar?\n\n",
    bookingTimePrompt:
      "¿A qué hora quieres empezar?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "¿Cuántas horas?\n\n1️⃣ 1 hora\n2️⃣ 2 horas\n3️⃣ 3 horas\n4️⃣ 4 horas\n5️⃣ 6 horas\n6️⃣ 8 horas (día completo)",
    bookingPeoplePrompt:
      "¿Cuántas personas seréis? _(máximo {max} para este barco)_",
    bookingExtrasPrompt:
      "¿Quieres añadir algún extra?\n\n1️⃣ Parking (10€)\n2️⃣ Nevera (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Sin extras\n\n_Puedes seleccionar varios separados por coma (ej: 1,3,4)_",
    bookingContactNamePrompt: "¿Cuál es tu nombre completo?",
    bookingContactEmailPrompt:
      "¿Tu email? _(para enviarte la confirmación)_",
    bookingConfirmTitle: "📋 *Resumen de tu Reserva*",
    bookingConfirmDetails:
      "🚤 *Barco:* {boat}\n📅 *Fecha:* {date}\n⏰ *Hora:* {time} - {endTime}\n👥 *Personas:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* {total}€ _(+ {deposit}€ fianza)_",
    bookingConfirmPrompt:
      "\n¿Confirmamos la reserva?\n\n1️⃣ Sí, confirmar\n2️⃣ No, cancelar",
    bookingCreated:
      "✅ *¡Reserva creada!*\n\nTu reserva está pendiente de pago. Tienes 30 minutos para completar el pago.",
    bookingPaymentLink:
      "💳 *Enlace de pago:*\n{link}\n\nUna vez realizado el pago, recibirás la confirmación por WhatsApp.",
    invalidPeopleCount:
      "❌ Por favor, introduce un número válido de personas.",
    capacityExceeded:
      "❌ El número de personas ({people}) excede la capacidad del barco ({max}).",

    // Extras
    extrasTitle: "🎒 *Extras Disponibles*",
    extrasList: [
      "🅿️ Parking dentro del puerto - 10€",
      "❄️ Nevera - 5€",
      "🤿 Equipo snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Sin extras",
    extrasSelected: "Extras seleccionados: {extras}",

    // Prices
    pricesTitle: "💰 *Precios {boat}*",
    seasonLow: "🌸 *Temporada Baja* (Abr-Jun, Sep-Oct)",
    seasonMid: "☀️ *Temporada Media* (Julio)",
    seasonHigh: "🔥 *Temporada Alta* (Agosto)",
    depositRequired: "💳 Fianza: {deposit}€",
    fuelIncluded: "⛽ Gasolina incluida",
    fuelNotIncluded: "⛽ Gasolina NO incluida",

    // Agent
    agentHandoff:
      "👤 *Conectando con un agente*\n\nUn miembro de nuestro equipo se pondrá en contacto contigo lo antes posible.",
    agentNotified:
      "✅ Hemos notificado a nuestro equipo. Te responderemos pronto.",

    // General
    yes: "Sí",
    no: "No",
    confirm: "Confirmar",
    cancel: "Cancelar",
    thanks: "¡Gracias por contactar con Costa Brava Rent a Boat! 🚤",
    goodbye: "¡Hasta pronto! Si necesitas algo más, escríbenos. 👋",
    error:
      "😔 Ha ocurrido un error. Por favor, inténtalo de nuevo o escribe *agente* para hablar con nosotros.",
    invalidOption: "❌ Opción no válida. Por favor, selecciona una de las opciones mostradas.",
    typeMenuToReturn: "_Escribe *menú* para volver al inicio_",
  },

  en: {
    // Welcome & Menu
    welcome:
      "Hello! 👋 Welcome to *Costa Brava Rent a Boat*\n\nWe specialize in boat rentals in Blanes. How can we help you?",
    welcomeBack: "Hello again! 👋 How can we help you?",
    mainMenuTitle: "📋 *Main Menu*",
    mainMenuOptions: [
      "1️⃣ See our boats",
      "2️⃣ Check availability",
      "3️⃣ View prices",
      "4️⃣ Make a reservation",
      "5️⃣ Talk to an agent",
    ],
    unknownCommand:
      "I didn't understand your message. Type *menu* to see available options.",
    backToMenu: "\n\n_Type *menu* to go back_",

    // Boats
    ourBoats: "🚤 *Our Fleet*",
    boatListHeader:
      "We have boats with and without license to enjoy the Costa Brava:",
    boatDetails: "📋 *Boat Details*",
    selectBoatPrompt: "\n_Reply with the boat number for more info_",
    noLicenseRequired: "No license required",
    licenseRequired: "License required",
    capacity: "people",
    fromPrice: "from",
    boatNotFound: "❌ Boat not found. Please select a valid option.",

    // Availability
    checkAvailabilityTitle: "📅 *Check Availability*",
    enterDatePrompt:
      "What date would you like to check?\n\n_Enter date as DD/MM/YYYY (e.g., 15/07/2025)_",
    invalidDateFormat:
      "❌ Invalid date format. Please use DD/MM/YYYY (e.g., 15/07/2025)",
    outOfSeason:
      "⚠️ That date is out of season. We operate from *April to October*.",
    availabilityResult: "📅 *Availability for {date}*",
    available: "✅ Available",
    occupied: "❌ Occupied",
    selectBoatForAvailability: "\n_Reply with the number to book_",
    noBoatsAvailable:
      "😔 Sorry, no boats are available for that date.",
    allBoatsAvailable: "🎉 All boats are available!",

    // Booking Flow
    startBookingTitle: "🎯 *New Reservation*",
    bookingDatePrompt:
      "Perfect! Let's create your booking.\n\nWhat date? _DD/MM/YYYY_",
    bookingBoatPrompt: "Which boat would you like to reserve?\n\n",
    bookingTimePrompt:
      "What time do you want to start?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "How many hours?\n\n1️⃣ 1 hour\n2️⃣ 2 hours\n3️⃣ 3 hours\n4️⃣ 4 hours\n5️⃣ 6 hours\n6️⃣ 8 hours (full day)",
    bookingPeoplePrompt:
      "How many people? _(maximum {max} for this boat)_",
    bookingExtrasPrompt:
      "Would you like to add any extras?\n\n1️⃣ Parking (€10)\n2️⃣ Cooler (€5)\n3️⃣ Snorkel (€7.50)\n4️⃣ Paddle Surf (€25)\n5️⃣ Seascooter (€50)\n0️⃣ No extras\n\n_You can select multiple separated by comma (e.g., 1,3,4)_",
    bookingContactNamePrompt: "What is your full name?",
    bookingContactEmailPrompt:
      "Your email? _(for the confirmation)_",
    bookingConfirmTitle: "📋 *Booking Summary*",
    bookingConfirmDetails:
      "🚤 *Boat:* {boat}\n📅 *Date:* {date}\n⏰ *Time:* {time} - {endTime}\n👥 *People:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* €{total} _(+ €{deposit} deposit)_",
    bookingConfirmPrompt:
      "\nConfirm the booking?\n\n1️⃣ Yes, confirm\n2️⃣ No, cancel",
    bookingCreated:
      "✅ *Booking created!*\n\nYour booking is pending payment. You have 30 minutes to complete the payment.",
    bookingPaymentLink:
      "💳 *Payment link:*\n{link}\n\nOnce payment is made, you'll receive confirmation via WhatsApp.",
    invalidPeopleCount:
      "❌ Please enter a valid number of people.",
    capacityExceeded:
      "❌ The number of people ({people}) exceeds the boat capacity ({max}).",

    // Extras
    extrasTitle: "🎒 *Available Extras*",
    extrasList: [
      "🅿️ Port parking - €10",
      "❄️ Cooler - €5",
      "🤿 Snorkel equipment - €7.50",
      "🏄 Paddle Surf - €25",
      "⚡ Seascooter - €50",
    ],
    noExtras: "No extras",
    extrasSelected: "Selected extras: {extras}",

    // Prices
    pricesTitle: "💰 *Prices {boat}*",
    seasonLow: "🌸 *Low Season* (Apr-Jun, Sep-Oct)",
    seasonMid: "☀️ *Mid Season* (July)",
    seasonHigh: "🔥 *High Season* (August)",
    depositRequired: "💳 Deposit: €{deposit}",
    fuelIncluded: "⛽ Fuel included",
    fuelNotIncluded: "⛽ Fuel NOT included",

    // Agent
    agentHandoff:
      "👤 *Connecting to an agent*\n\nA team member will contact you as soon as possible.",
    agentNotified:
      "✅ We've notified our team. We'll respond soon.",

    // General
    yes: "Yes",
    no: "No",
    confirm: "Confirm",
    cancel: "Cancel",
    thanks: "Thank you for contacting Costa Brava Rent a Boat! 🚤",
    goodbye: "See you soon! If you need anything else, write to us. 👋",
    error:
      "😔 An error occurred. Please try again or type *agent* to talk to us.",
    invalidOption: "❌ Invalid option. Please select one of the options shown.",
    typeMenuToReturn: "_Type *menu* to go back_",
  },

  fr: {
    // Welcome & Menu
    welcome:
      "Bonjour! 👋 Bienvenue chez *Costa Brava Rent a Boat*\n\nNous sommes spécialisés dans la location de bateaux à Blanes. Comment pouvons-nous vous aider?",
    welcomeBack: "Bonjour à nouveau! 👋 Comment pouvons-nous vous aider?",
    mainMenuTitle: "📋 *Menu Principal*",
    mainMenuOptions: [
      "1️⃣ Voir nos bateaux",
      "2️⃣ Vérifier disponibilité",
      "3️⃣ Voir les prix",
      "4️⃣ Faire une réservation",
      "5️⃣ Parler à un agent",
    ],
    unknownCommand:
      "Je n'ai pas compris votre message. Tapez *menu* pour voir les options disponibles.",
    backToMenu: "\n\n_Tapez *menu* pour revenir_",

    // Boats
    ourBoats: "🚤 *Notre Flotte*",
    boatListHeader:
      "Nous avons des bateaux avec et sans permis pour profiter de la Costa Brava:",
    boatDetails: "📋 *Détails du Bateau*",
    selectBoatPrompt: "\n_Répondez avec le numéro du bateau pour plus d'infos_",
    noLicenseRequired: "Sans permis",
    licenseRequired: "Permis requis",
    capacity: "personnes",
    fromPrice: "à partir de",
    boatNotFound: "❌ Bateau non trouvé. Veuillez sélectionner une option valide.",

    // Availability
    checkAvailabilityTitle: "📅 *Vérifier Disponibilité*",
    enterDatePrompt:
      "Pour quelle date souhaitez-vous vérifier?\n\n_Entrez la date au format JJ/MM/AAAA (ex: 15/07/2025)_",
    invalidDateFormat:
      "❌ Format de date incorrect. Utilisez JJ/MM/AAAA (ex: 15/07/2025)",
    outOfSeason:
      "⚠️ Cette date est hors saison. Nous opérons d'*avril à octobre*.",
    availabilityResult: "📅 *Disponibilité pour {date}*",
    available: "✅ Disponible",
    occupied: "❌ Occupé",
    selectBoatForAvailability: "\n_Répondez avec le numéro pour réserver_",
    noBoatsAvailable:
      "😔 Désolé, aucun bateau n'est disponible pour cette date.",
    allBoatsAvailable: "🎉 Tous les bateaux sont disponibles!",

    // Booking Flow
    startBookingTitle: "🎯 *Nouvelle Réservation*",
    bookingDatePrompt:
      "Parfait! Créons votre réservation.\n\nQuelle date? _JJ/MM/AAAA_",
    bookingBoatPrompt: "Quel bateau souhaitez-vous réserver?\n\n",
    bookingTimePrompt:
      "À quelle heure voulez-vous commencer?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Combien d'heures?\n\n1️⃣ 1 heure\n2️⃣ 2 heures\n3️⃣ 3 heures\n4️⃣ 4 heures\n5️⃣ 6 heures\n6️⃣ 8 heures (journée complète)",
    bookingPeoplePrompt:
      "Combien de personnes? _(maximum {max} pour ce bateau)_",
    bookingExtrasPrompt:
      "Souhaitez-vous ajouter des extras?\n\n1️⃣ Parking (10€)\n2️⃣ Glacière (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Sans extras\n\n_Vous pouvez en sélectionner plusieurs séparés par virgule (ex: 1,3,4)_",
    bookingContactNamePrompt: "Quel est votre nom complet?",
    bookingContactEmailPrompt:
      "Votre email? _(pour la confirmation)_",
    bookingConfirmTitle: "📋 *Résumé de Réservation*",
    bookingConfirmDetails:
      "🚤 *Bateau:* {boat}\n📅 *Date:* {date}\n⏰ *Heure:* {time} - {endTime}\n👥 *Personnes:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* {total}€ _(+ {deposit}€ caution)_",
    bookingConfirmPrompt:
      "\nConfirmer la réservation?\n\n1️⃣ Oui, confirmer\n2️⃣ Non, annuler",
    bookingCreated:
      "✅ *Réservation créée!*\n\nVotre réservation est en attente de paiement. Vous avez 30 minutes pour effectuer le paiement.",
    bookingPaymentLink:
      "💳 *Lien de paiement:*\n{link}\n\nUne fois le paiement effectué, vous recevrez la confirmation par WhatsApp.",
    invalidPeopleCount:
      "❌ Veuillez entrer un nombre valide de personnes.",
    capacityExceeded:
      "❌ Le nombre de personnes ({people}) dépasse la capacité du bateau ({max}).",

    // Extras
    extrasTitle: "🎒 *Extras Disponibles*",
    extrasList: [
      "🅿️ Parking au port - 10€",
      "❄️ Glacière - 5€",
      "🤿 Équipement snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Sans extras",
    extrasSelected: "Extras sélectionnés: {extras}",

    // Prices
    pricesTitle: "💰 *Prix {boat}*",
    seasonLow: "🌸 *Basse Saison* (Avr-Juin, Sep-Oct)",
    seasonMid: "☀️ *Moyenne Saison* (Juillet)",
    seasonHigh: "🔥 *Haute Saison* (Août)",
    depositRequired: "💳 Caution: {deposit}€",
    fuelIncluded: "⛽ Carburant inclus",
    fuelNotIncluded: "⛽ Carburant NON inclus",

    // Agent
    agentHandoff:
      "👤 *Connexion à un agent*\n\nUn membre de notre équipe vous contactera dès que possible.",
    agentNotified:
      "✅ Nous avons notifié notre équipe. Nous vous répondrons bientôt.",

    // General
    yes: "Oui",
    no: "Non",
    confirm: "Confirmer",
    cancel: "Annuler",
    thanks: "Merci d'avoir contacté Costa Brava Rent a Boat! 🚤",
    goodbye: "À bientôt! Si vous avez besoin d'autre chose, écrivez-nous. 👋",
    error:
      "😔 Une erreur s'est produite. Veuillez réessayer ou tapez *agent* pour nous parler.",
    invalidOption: "❌ Option invalide. Veuillez sélectionner une des options affichées.",
    typeMenuToReturn: "_Tapez *menu* pour revenir_",
  },

  ca: {
    // Welcome & Menu
    welcome:
      "Hola! 👋 Benvingut a *Costa Brava Rent a Boat*\n\nSom especialistes en lloguer de vaixells a Blanes. En què podem ajudar-te?",
    welcomeBack: "Hola de nou! 👋 En què podem ajudar-te?",
    mainMenuTitle: "📋 *Menú Principal*",
    mainMenuOptions: [
      "1️⃣ Veure els nostres vaixells",
      "2️⃣ Consultar disponibilitat",
      "3️⃣ Veure preus",
      "4️⃣ Fer una reserva",
      "5️⃣ Parlar amb un agent",
    ],
    unknownCommand:
      "No he entès el teu missatge. Escriu *menú* per veure les opcions disponibles.",
    backToMenu: "\n\n_Escriu *menú* per tornar a l'inici_",

    // Boats
    ourBoats: "🚤 *La Nostra Flota*",
    boatListHeader:
      "Disposem de vaixells amb i sense llicència per gaudir de la Costa Brava:",
    boatDetails: "📋 *Detalls del Vaixell*",
    selectBoatPrompt: "\n_Respon amb el número del vaixell per més info_",
    noLicenseRequired: "Sense llicència",
    licenseRequired: "Requereix llicència",
    capacity: "persones",
    fromPrice: "des de",
    boatNotFound: "❌ Vaixell no trobat. Si us plau, selecciona una opció vàlida.",

    // Availability
    checkAvailabilityTitle: "📅 *Consultar Disponibilitat*",
    enterDatePrompt:
      "Per a quina data vols consultar?\n\n_Escriu la data en format DD/MM/AAAA (ex: 15/07/2025)_",
    invalidDateFormat:
      "❌ Format de data incorrecte. Si us plau utilitza DD/MM/AAAA (ex: 15/07/2025)",
    outOfSeason:
      "⚠️ Aquesta data és fora de temporada. Operem d'*abril a octubre*.",
    availabilityResult: "📅 *Disponibilitat per {date}*",
    available: "✅ Disponible",
    occupied: "❌ Ocupat",
    selectBoatForAvailability: "\n_Respon amb el número per reservar_",
    noBoatsAvailable:
      "😔 Ho sentim, no hi ha vaixells disponibles per a aquesta data.",
    allBoatsAvailable: "🎉 Tots els vaixells estan disponibles!",

    // Booking Flow
    startBookingTitle: "🎯 *Nova Reserva*",
    bookingDatePrompt:
      "Perfecte! Creem la teva reserva.\n\nPer a quina data? _DD/MM/AAAA_",
    bookingBoatPrompt: "Quin vaixell t'agradaria reservar?\n\n",
    bookingTimePrompt:
      "A quina hora vols començar?\n\n1️⃣ 10:00\n2️⃣ 11:00\n3️⃣ 12:00\n4️⃣ 13:00\n5️⃣ 14:00\n6️⃣ 15:00\n7️⃣ 16:00",
    bookingDurationPrompt:
      "Quantes hores?\n\n1️⃣ 1 hora\n2️⃣ 2 hores\n3️⃣ 3 hores\n4️⃣ 4 hores\n5️⃣ 6 hores\n6️⃣ 8 hores (dia complet)",
    bookingPeoplePrompt:
      "Quantes persones sereu? _(màxim {max} per aquest vaixell)_",
    bookingExtrasPrompt:
      "Vols afegir algun extra?\n\n1️⃣ Parking (10€)\n2️⃣ Nevera (5€)\n3️⃣ Snorkel (7,50€)\n4️⃣ Paddle Surf (25€)\n5️⃣ Seascooter (50€)\n0️⃣ Sense extras\n\n_Pots seleccionar diversos separats per coma (ex: 1,3,4)_",
    bookingContactNamePrompt: "Quin és el teu nom complet?",
    bookingContactEmailPrompt:
      "El teu email? _(per enviar-te la confirmació)_",
    bookingConfirmTitle: "📋 *Resum de la Reserva*",
    bookingConfirmDetails:
      "🚤 *Vaixell:* {boat}\n📅 *Data:* {date}\n⏰ *Hora:* {time} - {endTime}\n👥 *Persones:* {people}\n🎒 *Extras:* {extras}\n\n💰 *Total:* {total}€ _(+ {deposit}€ fiança)_",
    bookingConfirmPrompt:
      "\nConfirmem la reserva?\n\n1️⃣ Sí, confirmar\n2️⃣ No, cancel·lar",
    bookingCreated:
      "✅ *Reserva creada!*\n\nLa teva reserva està pendent de pagament. Tens 30 minuts per completar el pagament.",
    bookingPaymentLink:
      "💳 *Enllaç de pagament:*\n{link}\n\nUn cop realitzat el pagament, rebràs la confirmació per WhatsApp.",
    invalidPeopleCount:
      "❌ Si us plau, introdueix un número vàlid de persones.",
    capacityExceeded:
      "❌ El nombre de persones ({people}) excedeix la capacitat del vaixell ({max}).",

    // Extras
    extrasTitle: "🎒 *Extras Disponibles*",
    extrasList: [
      "🅿️ Parking dins del port - 10€",
      "❄️ Nevera - 5€",
      "🤿 Equip snorkel - 7,50€",
      "🏄 Paddle Surf - 25€",
      "⚡ Seascooter - 50€",
    ],
    noExtras: "Sense extras",
    extrasSelected: "Extras seleccionats: {extras}",

    // Prices
    pricesTitle: "💰 *Preus {boat}*",
    seasonLow: "🌸 *Temporada Baixa* (Abr-Jun, Sep-Oct)",
    seasonMid: "☀️ *Temporada Mitjana* (Juliol)",
    seasonHigh: "🔥 *Temporada Alta* (Agost)",
    depositRequired: "💳 Fiança: {deposit}€",
    fuelIncluded: "⛽ Gasolina inclosa",
    fuelNotIncluded: "⛽ Gasolina NO inclosa",

    // Agent
    agentHandoff:
      "👤 *Connectant amb un agent*\n\nUn membre del nostre equip es posarà en contacte amb tu el més aviat possible.",
    agentNotified:
      "✅ Hem notificat al nostre equip. Et respondrem aviat.",

    // General
    yes: "Sí",
    no: "No",
    confirm: "Confirmar",
    cancel: "Cancel·lar",
    thanks: "Gràcies per contactar amb Costa Brava Rent a Boat! 🚤",
    goodbye: "Fins aviat! Si necessites res més, escriu-nos. 👋",
    error:
      "😔 Hi ha hagut un error. Si us plau, torna-ho a provar o escriu *agent* per parlar amb nosaltres.",
    invalidOption: "❌ Opció no vàlida. Si us plau, selecciona una de les opcions mostrades.",
    typeMenuToReturn: "_Escriu *menú* per tornar a l'inici_",
  },
};

/**
 * Get translation for a specific language
 */
export function getTranslation(language: SupportedLanguage): ChatbotTranslations {
  return TRANSLATIONS[language] || TRANSLATIONS.es;
}

/**
 * Replace placeholders in a translation string
 * e.g., "Hello {name}" with { name: "John" } => "Hello John"
 */
export function formatMessage(
  message: string,
  params: Record<string, string | number>
): string {
  let result = message;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return result;
}
