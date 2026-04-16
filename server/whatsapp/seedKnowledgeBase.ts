// Seed Knowledge Base with FAQs, Policies, and Routes
import { addKnowledgeEntry } from "./ragService";
import { logger } from "../lib/logger";

// FAQ entries in Spanish
const FAQS_ES = [
  {
    title: "Cómo reservar un barco",
    content: "Para reservar un barco, puedes contactarnos directamente por WhatsApp al +34 611 500 372, a través de nuestra web costabravarentaboat.com, o enviarnos un email a costabravarentaboat@gmail.com. Necesitaremos saber la fecha deseada, duración del alquiler, número de personas y el barco que te interesa.",
    category: "faq",
    keywords: ["reservar", "alquilar", "booking", "como"],
    priority: 10,
  },
  {
    title: "Se necesita licencia para alquilar un barco",
    content: "Tenemos barcos para todos. Ofrecemos barcos SIN licencia que cualquier persona mayor de 18 años puede conducir después de un breve briefing de seguridad. También tenemos barcos CON licencia para quienes tienen titulación náutica y buscan embarcaciones más potentes.",
    category: "faq",
    keywords: ["licencia", "carnet", "titulación", "sin licencia"],
    priority: 10,
  },
  {
    title: "Qué incluye el alquiler",
    content: "El alquiler incluye: equipo de seguridad obligatorio (chalecos, extintor, bengalas), ancla y cabo de fondeo, toldo o bimini para protección solar, nevera portátil, y un briefing de seguridad antes de salir. El combustible está incluido en algunos barcos, consulta las especificaciones de cada embarcación.",
    category: "faq",
    keywords: ["incluye", "incluido", "equipo", "seguridad"],
    priority: 9,
  },
  {
    title: "Política de depósito",
    content: "Se requiere un depósito que varía según el barco (entre 200 y 500 euros). El depósito se paga antes de salir y se devuelve íntegramente al entregar el barco en las mismas condiciones. Se puede pagar en efectivo o con tarjeta.",
    category: "policy",
    keywords: ["depósito", "fianza", "devolución"],
    priority: 9,
  },
  {
    title: "Horarios de salida y duración",
    content: "Ofrecemos alquileres de 2, 4, 6 u 8 horas. Los horarios habituales de salida son: mañana (10:00), mediodía (14:00) y tarde (18:00 en verano). Para alquileres de día completo, la salida es a las 10:00 y la devolución antes del atardecer.",
    category: "faq",
    keywords: ["horario", "horas", "duración", "salida"],
    priority: 8,
  },
  {
    title: "Temporadas y precios",
    content: "Tenemos tres temporadas: BAJA (abril, mayo, junio, septiembre, octubre) con los mejores precios; MEDIA (julio) con precios intermedios; y ALTA (agosto) que es la temporada de máxima demanda. Los precios varían según el barco y la duración del alquiler.",
    category: "faq",
    keywords: ["temporada", "precio", "tarifa", "coste"],
    priority: 8,
  },
  {
    title: "Política de cancelación",
    content: "El cambio de fecha es gratuito con un mínimo de 7 días de antelación, sujeto a disponibilidad. Todas las cancelaciones son no reembolsables (el importe pagado no se devuelve). En caso de mal tiempo, reprogramamos sin coste.",
    category: "policy",
    keywords: ["cancelación", "anular", "reembolso", "devolución"],
    priority: 9,
  },
  {
    title: "Mal tiempo",
    content: "Si hay mal tiempo (viento fuerte, tormenta, oleaje excesivo), la salida se pospone o se ofrece cambio de fecha sin coste adicional. La seguridad es nuestra prioridad. Nuestro equipo monitoriza las condiciones meteorológicas y te avisaremos con antelación si hay cambios.",
    category: "policy",
    keywords: ["tiempo", "tormenta", "viento", "seguridad", "meteorologia"],
    priority: 8,
  },
];

// Route recommendations
const ROUTES_ES = [
  {
    title: "Ruta a las Calas de Blanes",
    content: "Desde el puerto de Blanes, navega hacia el norte para descubrir calas vírgenes como Cala Sant Francesc, Sa Forcanera y Cala Bona. Son calas tranquilas con aguas cristalinas perfectas para bañarse y hacer snorkel. Tiempo estimado: 2-4 horas dependiendo de las paradas.",
    category: "route",
    keywords: ["cala", "blanes", "ruta", "snorkel", "playa"],
    priority: 7,
  },
  {
    title: "Excursión a Tossa de Mar",
    content: "Una de las rutas más populares. Navega desde Blanes hacia el norte costeando la bella Costa Brava hasta llegar a Tossa de Mar con su famoso recinto amurallado. El trayecto dura aproximadamente 45 minutos por sentido. Se recomienda alquiler de 4-6 horas para disfrutar de la ruta completa.",
    category: "route",
    keywords: ["tossa", "excursion", "costa", "muralla"],
    priority: 8,
  },
  {
    title: "Ruta hacia Lloret de Mar",
    content: "Hacia el sur desde Blanes, puedes explorar la costa de Lloret de Mar, pasando por Santa Cristina y su ermita. Es una ruta más corta, ideal para alquileres de 2-4 horas. Las playas de Lloret son más concurridas pero muy pintorescas.",
    category: "route",
    keywords: ["lloret", "santa cristina", "sur", "ermita"],
    priority: 7,
  },
  {
    title: "Fondeo y baño en calas",
    content: "Para fondear, busca calas con fondo de arena (mejor agarre) y protegidas del viento. Algunas recomendaciones: Cala Sant Francesc (arena, muy tranquila), Cala Treumal (mixto, cerca de Blanes), y Sa Forcanera (rocosa, aguas muy claras). Usa el ancla con al menos 3 veces la profundidad en cabo.",
    category: "route",
    keywords: ["fondeo", "ancla", "baño", "cala", "arena"],
    priority: 6,
  },
];

// General information
const GENERAL_ES = [
  {
    title: "Ubicación y cómo llegar",
    content: "Estamos ubicados en el Puerto de Blanes, Costa Brava, provincia de Girona. Blanes está a 60km de Barcelona y 35km de Girona. Puedes llegar en coche (parking disponible), tren (estación de Blanes a 10 minutos andando) o autobús. Te enviaremos la ubicación exacta al confirmar la reserva.",
    category: "general",
    keywords: ["ubicación", "dirección", "llegar", "puerto", "blanes"],
    priority: 7,
  },
  {
    title: "Qué llevar al barco",
    content: "Te recomendamos llevar: protección solar alta, gorra o sombrero, toallas, bañador, agua y comida si planeas paradas largas, gafas de sol, equipo de snorkel si tienes (también se puede alquilar), y ropa ligera. Lleva calzado que se pueda mojar para subir y bajar del barco.",
    category: "general",
    keywords: ["llevar", "equipaje", "preparar", "necesario"],
    priority: 6,
  },
  {
    title: "Capacidad de los barcos",
    content: "Nuestros barcos tienen capacidades desde 4 hasta 8 personas dependiendo del modelo. Es importante respetar la capacidad máxima por seguridad. Para grupos grandes, podemos organizar salidas con varios barcos. Contacta con nosotros para grupos especiales.",
    category: "general",
    keywords: ["capacidad", "personas", "grupo", "cuantos"],
    priority: 6,
  },
];

// FAQ entries in Catalan
const FAQS_CA = [
  {
    title: "Com reservar un vaixell",
    content: "Per reservar un vaixell, pots contactar-nos directament per WhatsApp al +34 611 500 372, a través del nostre web costabravarentaboat.com, o enviar-nos un email a costabravarentaboat@gmail.com. Necessitarem saber la data desitjada, la duració del lloguer, el nombre de persones i el vaixell que t'interessa.",
    category: "faq",
    keywords: ["reservar", "llogar", "reserva", "com"],
    priority: 10,
  },
  {
    title: "Cal llicencia per llogar un vaixell",
    content: "Tenim vaixells per a tothom. Oferim vaixells SENSE llicencia que qualsevol persona major de 18 anys pot conduir després d'un breu briefing de seguretat. També tenim vaixells AMB llicència per a qui té titulació nàutica i busca embarcacions més potents.",
    category: "faq",
    keywords: ["llicència", "carnet", "titulació", "sense llicència"],
    priority: 10,
  },
  {
    title: "Què inclou el lloguer",
    content: "El lloguer inclou: equip de seguretat obligatori (armilles salvavides, extintor, bengales), àncora i cap de fondeig, tendal o bimini per a la protecció solar, nevera portàtil, i un briefing de seguretat abans de sortir. El combustible està inclòs en alguns vaixells, consulta les especificacions de cada embarcació.",
    category: "faq",
    keywords: ["inclou", "inclòs", "equip", "seguretat"],
    priority: 9,
  },
  {
    title: "Política de dipòsit",
    content: "Es requereix un dipòsit que varia segons el vaixell (entre 200 i 500 euros). El dipòsit es paga abans de sortir i es retorna íntegrament en lliurar el vaixell en les mateixes condicions. Es pot pagar en efectiu o amb targeta.",
    category: "policy",
    keywords: ["dipòsit", "fiança", "retorn"],
    priority: 9,
  },
  {
    title: "Horaris de sortida i duració",
    content: "Oferim lloguers de 2, 4, 6 o 8 hores. Els horaris habituals de sortida són: matí (10:00), migdia (14:00) i tarda (18:00 a l'estiu). Per a lloguers de dia complet, la sortida és a les 10:00 i la devolució abans de la posta de sol.",
    category: "faq",
    keywords: ["horari", "hores", "duració", "sortida"],
    priority: 8,
  },
  {
    title: "Temporades i preus",
    content: "Tenim tres temporades: BAIXA (abril, maig, juny, setembre, octubre) amb els millors preus; MITJA (juliol) amb preus intermedis; i ALTA (agost) que és la temporada de màxima demanda. Els preus varien segons el vaixell i la duració del lloguer.",
    category: "faq",
    keywords: ["temporada", "preu", "tarifa", "cost"],
    priority: 8,
  },
  {
    title: "Política de cancel·lació",
    content: "El canvi de data és gratuït amb un mínim de 7 dies d'antelació, subjecte a disponibilitat. Totes les cancel·lacions no són reemborsables (l'import pagat no es retorna). En cas de mal temps, reprogramem sense cost.",
    category: "policy",
    keywords: ["cancel·lació", "anul·lar", "reemborsament", "devolució"],
    priority: 9,
  },
  {
    title: "Mal temps",
    content: "Si hi ha mal temps (vent fort, tempesta, onatge excessiu), la sortida es posposarà o s'oferirà canvi de data sense cost addicional. La seguretat és la nostra prioritat. El nostre equip monitoritza les condicions meteorològiques i t'avisarem amb antelació si hi ha canvis.",
    category: "policy",
    keywords: ["temps", "tempesta", "vent", "seguretat", "meteorologia"],
    priority: 8,
  },
];

// Route recommendations in Catalan
const ROUTES_CA = [
  {
    title: "Ruta a les Cales de Blanes",
    content: "Des del port de Blanes, navega cap al nord per descobrir cales verges com Cala Sant Francesc, Sa Forcanera i Cala Bona. Són cales tranquil·les amb aigües cristal·lines perfectes per banyar-se i fer snorkel. Temps estimat: 2-4 hores segons les parades.",
    category: "route",
    keywords: ["cala", "blanes", "ruta", "snorkel", "platja"],
    priority: 7,
  },
  {
    title: "Excursió a Tossa de Mar",
    content: "Una de les rutes més populars. Navega des de Blanes cap al nord costejant la bella Costa Brava fins arribar a Tossa de Mar amb el seu famós recinte emmurallat. El trajecte dura aproximadament 45 minuts per sentit. Es recomana lloguer de 4-6 hores per gaudir de la ruta completa.",
    category: "route",
    keywords: ["tossa", "excursió", "costa", "muralla"],
    priority: 8,
  },
  {
    title: "Ruta cap a Lloret de Mar",
    content: "Cap al sud des de Blanes, pots explorar la costa de Lloret de Mar, passant per Santa Cristina i la seva ermita. És una ruta més curta, ideal per a lloguers de 2-4 hores. Les platges de Lloret són més concorregudes però molt pintoresques.",
    category: "route",
    keywords: ["lloret", "santa cristina", "sud", "ermita"],
    priority: 7,
  },
  {
    title: "Fondeig i bany a les cales",
    content: "Per fondear, busca cales amb fons de sorra (millor agarre) i protegides del vent. Algunes recomanacions: Cala Sant Francesc (sorra, molt tranquilla), Cala Treumal (mixt, prop de Blanes), i Sa Forcanera (rocosa, aigües molt clares). Utilitza l'àncora amb almenys 3 vegades la profunditat en cap.",
    category: "route",
    keywords: ["fondeig", "àncora", "bany", "cala", "sorra"],
    priority: 6,
  },
];

// General information in Catalan
const GENERAL_CA = [
  {
    title: "Ubicació i com arribar",
    content: "Estem ubicats al Port de Blanes, Costa Brava, província de Girona. Blanes és a 60km de Barcelona i 35km de Girona. Pots arribar en cotxe (parking disponible), tren (estació de Blanes a 10 minuts a peu) o autobús. T'enviarem la ubicació exacta en confirmar la reserva.",
    category: "general",
    keywords: ["ubicació", "adreça", "arribar", "port", "blanes"],
    priority: 7,
  },
  {
    title: "Què portar al vaixell",
    content: "Et recomanem portar: protecció solar alta, gorra o barret, tovalloles, banyador, aigua i menjar si planegeu parades llargues, ulleres de sol, equip de snorkel si en teniu (també es pot llogar), i roba lleugera. Porta calçado que es pugui mullar per pujar i baixar del vaixell.",
    category: "general",
    keywords: ["portar", "equipatge", "preparar", "necessari"],
    priority: 6,
  },
  {
    title: "Capacitat dels vaixells",
    content: "Els nostres vaixells tenen capacitats des de 4 fins a 8 persones depenent del model. És important respectar la capacitat màxima per seguretat. Per a grups grans, podem organitzar sortides amb diversos vaixells. Contacta amb nosaltres per a grups especials.",
    category: "general",
    keywords: ["capacitat", "persones", "grup", "quants"],
    priority: 6,
  },
];

// FAQ entries in English
const FAQS_EN = [
  {
    title: "How to book a boat",
    content: "To book a boat, you can contact us directly via WhatsApp at +34 611 500 372, through our website costabravarentaboat.com, or send us an email at costabravarentaboat@gmail.com. We will need to know your preferred date, rental duration, number of people, and which boat you are interested in.",
    category: "faq",
    keywords: ["book", "hire", "reserve", "how to"],
    priority: 10,
  },
  {
    title: "Do I need a licence to hire a boat",
    content: "We have boats for everyone. We offer boats WITHOUT a licence that any person over 18 years old can operate after a brief safety briefing. We also have boats WITH a licence for those who hold a nautical qualification and are looking for more powerful vessels.",
    category: "faq",
    keywords: ["licence", "license", "qualification", "no licence"],
    priority: 10,
  },
  {
    title: "What is included in the rental",
    content: "The rental includes: mandatory safety equipment (life jackets, fire extinguisher, flares), anchor and mooring line, sun canopy or bimini for sun protection, portable cool box, and a safety briefing before departure. Fuel is included on some boats; please check the specifications of each vessel.",
    category: "faq",
    keywords: ["included", "equipment", "safety", "what is included"],
    priority: 9,
  },
  {
    title: "Deposit policy",
    content: "A security deposit is required, which varies depending on the boat (between 200 and 500 euros). The deposit is paid before departure and is fully refunded upon returning the boat in the same condition. Payment can be made in cash or by card.",
    category: "policy",
    keywords: ["deposit", "security deposit", "refund"],
    priority: 9,
  },
  {
    title: "Departure times and duration",
    content: "We offer rentals of 2, 4, 6, or 8 hours. Usual departure times are: morning (10:00), midday (14:00), and afternoon (18:00 in summer). For full-day rentals, departure is at 10:00 and the boat must be returned before sunset.",
    category: "faq",
    keywords: ["schedule", "hours", "duration", "departure time"],
    priority: 8,
  },
  {
    title: "Seasons and prices",
    content: "We have three seasons: LOW (April, May, June, September, October) with the best prices; MID (July) with intermediate prices; and HIGH (August), which is peak season. Prices vary depending on the boat and rental duration.",
    category: "faq",
    keywords: ["season", "price", "rate", "cost"],
    priority: 8,
  },
  {
    title: "Cancellation policy",
    content: "Date changes are free with at least 7 days notice, subject to availability. All cancellations are non-refundable (the amount paid is not returned). In the event of bad weather, we reschedule at no cost.",
    category: "policy",
    keywords: ["cancellation", "cancel", "refund", "reschedule"],
    priority: 9,
  },
  {
    title: "Bad weather",
    content: "If there is bad weather (strong winds, storm, excessive swell), the departure will be postponed or a date change will be offered at no additional cost. Safety is our top priority. Our team monitors weather conditions and will notify you in advance if there are any changes.",
    category: "policy",
    keywords: ["weather", "storm", "wind", "safety", "forecast"],
    priority: 8,
  },
];

// Route recommendations in English
const ROUTES_EN = [
  {
    title: "Route to the Coves of Blanes",
    content: "From Blanes harbour, head north to discover unspoilt coves such as Cala Sant Francesc, Sa Forcanera, and Cala Bona. These are peaceful coves with crystal-clear waters, perfect for swimming and snorkelling. Estimated time: 2 to 4 hours depending on stops.",
    category: "route",
    keywords: ["cove", "blanes", "route", "snorkel", "beach"],
    priority: 7,
  },
  {
    title: "Trip to Tossa de Mar",
    content: "One of the most popular routes. Sail from Blanes northward along the beautiful Costa Brava coastline to reach Tossa de Mar with its famous walled old town. The journey takes approximately 45 minutes each way. A 4 to 6 hour rental is recommended to fully enjoy the route.",
    category: "route",
    keywords: ["tossa", "trip", "coast", "walled town"],
    priority: 8,
  },
  {
    title: "Route towards Lloret de Mar",
    content: "Heading south from Blanes, you can explore the coastline of Lloret de Mar, passing by Santa Cristina and its hermitage. This is a shorter route, ideal for 2 to 4 hour rentals. The beaches of Lloret are busier but very picturesque.",
    category: "route",
    keywords: ["lloret", "santa cristina", "south", "hermitage"],
    priority: 7,
  },
  {
    title: "Anchoring and swimming in coves",
    content: "When anchoring, look for coves with sandy bottoms (better grip) and sheltered from the wind. Some recommendations: Cala Sant Francesc (sandy, very calm), Cala Treumal (mixed, close to Blanes), and Sa Forcanera (rocky, very clear water). Use the anchor with at least 3 times the depth of chain or rope.",
    category: "route",
    keywords: ["anchor", "anchoring", "swimming", "cove", "sandy"],
    priority: 6,
  },
];

// General information in English
const GENERAL_EN = [
  {
    title: "Location and how to get here",
    content: "We are located at Blanes Harbour, Costa Brava, in the province of Girona. Blanes is 60 km from Barcelona and 35 km from Girona. You can arrive by car (parking available), train (Blanes station is a 10-minute walk away), or by bus. We will send you the exact location when your booking is confirmed.",
    category: "general",
    keywords: ["location", "address", "directions", "harbour", "blanes"],
    priority: 7,
  },
  {
    title: "What to bring on the boat",
    content: "We recommend bringing: high-factor sun cream, a cap or hat, towels, swimwear, water and food if you plan longer stops, sunglasses, snorkelling gear if you have it (also available to hire), and light clothing. Bring footwear that can get wet for boarding and disembarking.",
    category: "general",
    keywords: ["bring", "pack", "prepare", "essentials"],
    priority: 6,
  },
  {
    title: "Boat capacity",
    content: "Our boats have capacities ranging from 4 to 8 people depending on the model. It is important to respect the maximum capacity for safety reasons. For larger groups, we can arrange trips with multiple boats. Contact us for special group bookings.",
    category: "general",
    keywords: ["capacity", "people", "group", "how many"],
    priority: 6,
  },
];

// FAQ entries in French
const FAQS_FR = [
  {
    title: "Comment réserver un bateau",
    content: "Pour réserver un bateau, vous pouvez nous contacter directement par WhatsApp au +34 611 500 372, via notre site web costabravarentaboat.com, ou nous envoyer un email à costabravarentaboat@gmail.com. Nous aurons besoin de connaître la date souhaitée, la durée de la location, le nombre de personnes et le bateau qui vous intéresse.",
    category: "faq",
    keywords: ["réserver", "louer", "réservation", "comment"],
    priority: 10,
  },
  {
    title: "Faut-il un permis pour louer un bateau",
    content: "Nous avons des bateaux pour tout le monde. Nous proposons des bateaux SANS permis que toute personne de plus de 18 ans peut conduire après un bref briefing de sécurité. Nous avons également des bateaux AVEC permis pour ceux qui possèdent un titre nautique et recherchent des embarcations plus puissantes.",
    category: "faq",
    keywords: ["permis", "carte", "qualification", "sans permis"],
    priority: 10,
  },
  {
    title: "Qu'est-ce qui est inclus dans la location",
    content: "La location comprend: équipement de sécurité obligatoire (gilets de sauvetage, extincteur, fusées éclairantes), ancre et corde de mouillage, taud ou bimini pour la protection solaire, glacière portable, et un briefing de sécurité avant le départ. Le carburant est inclus sur certains bateaux, veuillez consulter les spécifications de chaque embarcation.",
    category: "faq",
    keywords: ["inclus", "équipement", "sécurité", "ce qui est inclus"],
    priority: 9,
  },
  {
    title: "Politique de caution",
    content: "Une caution est requise et varie selon le bateau (entre 200 et 500 euros). La caution est payée avant le départ et est intégralement remboursée lors de la restitution du bateau dans les mêmes conditions. Le paiement peut être effectué en espèces ou par carte.",
    category: "policy",
    keywords: ["caution", "dépôt", "remboursement"],
    priority: 9,
  },
  {
    title: "Horaires de départ et durée",
    content: "Nous proposons des locations de 2, 4, 6 ou 8 heures. Les horaires habituels de départ sont: le matin (10h00), le midi (14h00) et l'après-midi (18h00 en été). Pour les locations à la journée, le départ est à 10h00 et le retour avant le coucher du soleil.",
    category: "faq",
    keywords: ["horaire", "heures", "durée", "départ"],
    priority: 8,
  },
  {
    title: "Saisons et tarifs",
    content: "Nous avons trois saisons: BASSE (avril, mai, juin, septembre, octobre) avec les meilleurs tarifs; MOYENNE (juillet) avec des tarifs intermédiaires; et HAUTE (août) qui est la saison de plus forte demande. Les tarifs varient selon le bateau et la durée de la location.",
    category: "faq",
    keywords: ["saison", "prix", "tarif", "coût"],
    priority: 8,
  },
  {
    title: "Politique d'annulation",
    content: "Le changement de date est gratuit avec un minimum de 7 jours de préavis, sous réserve de disponibilité. Toutes les annulations sont non remboursables (le montant payé n'est pas restitué). En cas de mauvais temps, nous reprogrammons sans frais.",
    category: "policy",
    keywords: ["annulation", "annuler", "remboursement", "reprogrammer"],
    priority: 9,
  },
  {
    title: "Mauvais temps",
    content: "En cas de mauvais temps (vent fort, tempête, houle excessive), le départ sera reporté ou un changement de date sera proposé sans frais supplémentaires. La sécurité est notre priorité absolue. Notre équipe surveille les conditions météorologiques et vous avertira à l'avance en cas de changement.",
    category: "policy",
    keywords: ["météo", "tempête", "vent", "sécurité", "prévisions"],
    priority: 8,
  },
];

// Route recommendations in French
const ROUTES_FR = [
  {
    title: "Route vers les Criques de Blanes",
    content: "Depuis le port de Blanes, naviguez vers le nord pour découvrir des criques sauvages telles que Cala Sant Francesc, Sa Forcanera et Cala Bona. Ce sont des criques tranquilles aux eaux cristallines, parfaites pour se baigner et faire du snorkeling. Durée estimée: 2 à 4 heures selon les arrêts.",
    category: "route",
    keywords: ["crique", "blanes", "route", "snorkeling", "plage"],
    priority: 7,
  },
  {
    title: "Excursion à Tossa de Mar",
    content: "L'une des routes les plus populaires. Naviguez depuis Blanes vers le nord en longeant la belle Costa Brava jusqu'à Tossa de Mar avec sa célèbre ville médiévale fortifiée. Le trajet dure environ 45 minutes dans chaque sens. Une location de 4 à 6 heures est recommandée pour profiter pleinement de la route.",
    category: "route",
    keywords: ["tossa", "excursion", "côte", "remparts"],
    priority: 8,
  },
  {
    title: "Route vers Lloret de Mar",
    content: "En direction du sud depuis Blanes, vous pouvez explorer la côte de Lloret de Mar, en passant par Santa Cristina et son ermitage. C'est une route plus courte, idéale pour des locations de 2 à 4 heures. Les plages de Lloret sont plus fréquentées mais très pittoresques.",
    category: "route",
    keywords: ["lloret", "santa cristina", "sud", "ermitage"],
    priority: 7,
  },
  {
    title: "Mouillage et baignade dans les criques",
    content: "Pour mouiller, cherchez des criques avec un fond de sable (meilleure tenue) et à l'abri du vent. Quelques recommandations: Cala Sant Francesc (sableux, très calme), Cala Treumal (mixte, près de Blanes), et Sa Forcanera (rocheux, eau très claire). Utilisez l'ancre avec au moins 3 fois la profondeur en chaîne ou en corde.",
    category: "route",
    keywords: ["mouillage", "ancre", "baignade", "crique", "sable"],
    priority: 6,
  },
];

// General information in French
const GENERAL_FR = [
  {
    title: "Localisation et comment nous trouver",
    content: "Nous sommes situés au Port de Blanes, Costa Brava, dans la province de Girona. Blanes se trouve à 60 km de Barcelone et à 35 km de Girona. Vous pouvez venir en voiture (parking disponible), en train (la gare de Blanes est à 10 minutes à pied) ou en bus. Nous vous enverrons la localisation exacte lors de la confirmation de votre réservation.",
    category: "general",
    keywords: ["localisation", "adresse", "accès", "port", "blanes"],
    priority: 7,
  },
  {
    title: "Que apporter sur le bateau",
    content: "Nous vous recommandons d'apporter: une protection solaire à indice élevé, une casquette ou un chapeau, des serviettes, un maillot de bain, de l'eau et de la nourriture si vous prévoyez de longues escales, des lunettes de soleil, du matériel de snorkeling si vous en avez (également disponible à la location), et des vêtements légers. Apportez des chaussures qui peuvent se mouiller pour monter et descendre du bateau.",
    category: "general",
    keywords: ["apporter", "bagages", "préparer", "nécessaire"],
    priority: 6,
  },
  {
    title: "Capacité des bateaux",
    content: "Nos bateaux ont des capacités allant de 4 à 8 personnes selon le modèle. Il est important de respecter la capacité maximale pour des raisons de sécurité. Pour les grands groupes, nous pouvons organiser des sorties avec plusieurs bateaux. Contactez-nous pour les groupes spéciaux.",
    category: "general",
    keywords: ["capacité", "personnes", "groupe", "combien"],
    priority: 6,
  },
];

// FAQ entries in German
const FAQS_DE = [
  {
    title: "Wie man ein Boot bucht",
    content: "Um ein Boot zu buchen, können Sie uns direkt per WhatsApp unter +34 611 500 372 kontaktieren, über unsere Website costabravarentaboat.com oder uns eine E-Mail an costabravarentaboat@gmail.com senden. Wir benötigen das gewünschte Datum, die Mietdauer, die Personenzahl und das gewünschte Boot.",
    category: "faq",
    keywords: ["buchen", "mieten", "reservieren", "wie"],
    priority: 10,
  },
  {
    title: "Benötigt man einen Führerschein für die Bootsmiete",
    content: "Wir haben Boote für jeden. Wir bieten Boote OHNE Führerschein an, die jede Person über 18 Jahre nach einer kurzen Sicherheitseinweisung fahren kann. Wir haben auch Boote MIT Führerschein für diejenigen, die einen Bootsschein besitzen und nach leistungsstärkeren Fahrzeugen suchen.",
    category: "faq",
    keywords: ["führerschein", "bootsschein", "lizenz", "ohne führerschein"],
    priority: 10,
  },
  {
    title: "Was ist im Mietpreis enthalten",
    content: "Die Miete umfasst: obligatorische Sicherheitsausrüstung (Schwimmwesten, Feuerlöscher, Leuchtraketen), Anker und Mooring-Leine, Sonnensegel oder Bimini zum Sonnenschutz, portable Kühlbox und eine Sicherheitseinweisung vor der Abfahrt. Der Kraftstoff ist bei einigen Booten enthalten; bitte prüfen Sie die Spezifikationen des jeweiligen Fahrzeugs.",
    category: "faq",
    keywords: ["enthalten", "ausrüstung", "sicherheit", "inklusive"],
    priority: 9,
  },
  {
    title: "Kaution",
    content: "Es wird eine Kaution verlangt, die je nach Boot variiert (zwischen 200 und 500 Euro). Die Kaution wird vor der Abfahrt bezahlt und bei Rückgabe des Bootes im selben Zustand vollständig zurückerstattet. Die Zahlung kann in bar oder mit Karte erfolgen.",
    category: "policy",
    keywords: ["kaution", "pfand", "rückerstattung"],
    priority: 9,
  },
  {
    title: "Abfahrtzeiten und Dauer",
    content: "Wir bieten Vermietungen von 2, 4, 6 oder 8 Stunden an. Übliche Abfahrtzeiten sind: morgens (10:00 Uhr), mittags (14:00 Uhr) und nachmittags (18:00 Uhr im Sommer). Für Ganztagsvermietungen ist die Abfahrt um 10:00 Uhr und die Rückgabe vor Sonnenuntergang.",
    category: "faq",
    keywords: ["abfahrtzeit", "stunden", "dauer", "zeitplan"],
    priority: 8,
  },
  {
    title: "Saisons und Preise",
    content: "Wir haben drei Saisons: NEBENSAISON (April, Mai, Juni, September, Oktober) mit den besten Preisen; MITTELSAISON (Juli) mit mittleren Preisen; und HOCHSAISON (August), die Saison mit der höchsten Nachfrage. Die Preise variieren je nach Boot und Mietdauer.",
    category: "faq",
    keywords: ["saison", "preis", "tarif", "kosten"],
    priority: 8,
  },
  {
    title: "Stornierungsbedingungen",
    content: "Kostenlose Umbuchung mit mindestens 7 Tagen Vorlauf, vorbehaltlich Verfügbarkeit. Alle Stornierungen sind nicht erstattungsfähig (der gezahlte Betrag wird nicht zurückerstattet). Bei schlechtem Wetter wird kostenlos umgebucht.",
    category: "policy",
    keywords: ["stornierung", "stornieren", "erstattung", "umbuchung"],
    priority: 9,
  },
  {
    title: "Schlechtes Wetter",
    content: "Bei schlechtem Wetter (starker Wind, Sturm, übermäßiger Wellengang) wird die Abfahrt verschoben oder ein kostenloser Datumswechsel angeboten. Sicherheit hat für uns höchste Priorität. Unser Team beobachtet die Wetterbedingungen und informiert Sie rechtzeitig, wenn sich Änderungen ergeben.",
    category: "policy",
    keywords: ["wetter", "sturm", "wind", "sicherheit", "wettervorhersage"],
    priority: 8,
  },
];

// Route recommendations in German
const ROUTES_DE = [
  {
    title: "Route zu den Buchten von Blanes",
    content: "Vom Hafen von Blanes aus navigieren Sie nach Norden, um unberührte Buchten wie Cala Sant Francesc, Sa Forcanera und Cala Bona zu entdecken. Es sind ruhige Buchten mit kristallklarem Wasser, ideal zum Schwimmen und Schnorcheln. Geschätzte Zeit: 2 bis 4 Stunden je nach Stopps.",
    category: "route",
    keywords: ["bucht", "blanes", "route", "schnorcheln", "strand"],
    priority: 7,
  },
  {
    title: "Ausflug nach Tossa de Mar",
    content: "Eine der beliebtesten Routen. Fahren Sie von Blanes nach Norden entlang der wunderschönen Costa Brava bis nach Tossa de Mar mit seiner berühmten mittelalterlichen Stadtmauer. Die Fahrt dauert ca. 45 Minuten je Richtung. Eine Miete von 4 bis 6 Stunden wird empfohlen, um die gesamte Route zu genießen.",
    category: "route",
    keywords: ["tossa", "ausflug", "küste", "stadtmauer"],
    priority: 8,
  },
  {
    title: "Route nach Lloret de Mar",
    content: "Südlich von Blanes können Sie die Küste von Lloret de Mar erkunden und dabei an Santa Cristina und seiner Einsiedelei vorbeikommen. Dies ist eine kürzere Route, ideal für Vermietungen von 2 bis 4 Stunden. Die Strände von Lloret sind belebter, aber sehr malerisch.",
    category: "route",
    keywords: ["lloret", "santa cristina", "süd", "einsiedelei"],
    priority: 7,
  },
  {
    title: "Ankern und Baden in Buchten",
    content: "Beim Ankern suchen Sie Buchten mit Sandboden (besserer Halt) und Windschutz. Einige Empfehlungen: Cala Sant Francesc (Sandgrund, sehr ruhig), Cala Treumal (gemischt, in der Nähe von Blanes), und Sa Forcanera (felsig, sehr klares Wasser). Verwenden Sie den Anker mit mindestens der 3-fachen Tiefe an Kette oder Tau.",
    category: "route",
    keywords: ["ankern", "anker", "baden", "bucht", "sandgrund"],
    priority: 6,
  },
];

// General information in German
const GENERAL_DE = [
  {
    title: "Lage und Anfahrt",
    content: "Wir befinden uns im Hafen von Blanes, Costa Brava, in der Provinz Girona. Blanes liegt 60 km von Barcelona und 35 km von Girona entfernt. Sie können mit dem Auto (Parkplatz vorhanden), mit dem Zug (Bahnhof Blanes ist 10 Minuten zu Fuß entfernt) oder mit dem Bus anreisen. Wir senden Ihnen den genauen Standort bei der Buchungsbestätigung.",
    category: "general",
    keywords: ["lage", "adresse", "anfahrt", "hafen", "blanes"],
    priority: 7,
  },
  {
    title: "Was man zum Boot mitbringen sollte",
    content: "Wir empfehlen mitzubringen: Sonnenschutz mit hohem Lichtschutzfaktor, Mütze oder Hut, Handtücher, Badeanzug oder Badehose, Wasser und Essen für längere Stopps, Sonnenbrille, Schnorchelausrüstung falls vorhanden (auch zum Mieten erhältlich) und leichte Kleidung. Bringen Sie Schuhe mit, die nass werden können, um das Boot betreten und verlassen zu können.",
    category: "general",
    keywords: ["mitbringen", "gepack", "vorbereitung", "notwendig"],
    priority: 6,
  },
  {
    title: "Kapazität der Boote",
    content: "Unsere Boote haben je nach Modell eine Kapazität von 4 bis 8 Personen. Es ist wichtig, die Höchstkapazität aus Sicherheitsgründen einzuhalten. Für größere Gruppen können wir Ausflugsfahrten mit mehreren Booten arrangieren. Kontaktieren Sie uns für Sondergruppen.",
    category: "general",
    keywords: ["kapazität", "personen", "gruppe", "wie viele"],
    priority: 6,
  },
];

// FAQ entries in Dutch
const FAQS_NL = [
  {
    title: "Hoe een boot reserveren",
    content: "Om een boot te reserveren, kunt u ons rechtstreeks contacteren via WhatsApp op +34 611 500 372, via onze website costabravarentaboat.com, of ons een e-mail sturen naar costabravarentaboat@gmail.com. We hebben de gewenste datum, de huurduur, het aantal personen en de gewenste boot nodig.",
    category: "faq",
    keywords: ["reserveren", "huren", "boeken", "hoe"],
    priority: 10,
  },
  {
    title: "Heb je een vaarbewijs nodig om een boot te huren",
    content: "We hebben boten voor iedereen. We bieden boten ZONDER vaarbewijs aan die elke persoon ouder dan 18 jaar kan besturen na een korte veiligheidsuitleg. We hebben ook boten MET vaarbewijs voor degenen die een nautisch diploma hebben en op zoek zijn naar krachtigere vaartuigen.",
    category: "faq",
    keywords: ["vaarbewijs", "rijbewijs", "diploma", "zonder vaarbewijs"],
    priority: 10,
  },
  {
    title: "Wat is inbegrepen in de huur",
    content: "De huur omvat: verplichte veiligheidsuitrusting (zwemvesten, brandblusser, noodraketten), anker en meeringslijnen, zonnedak of bimini voor bescherming tegen de zon, draagbare koelbox en een veiligheidsuitleg voor vertrek. Brandstof is bij sommige boten inbegrepen; raadpleeg de specificaties van elk vaartuig.",
    category: "faq",
    keywords: ["inbegrepen", "uitrusting", "veiligheid", "inclusief"],
    priority: 9,
  },
  {
    title: "Borg beleid",
    content: "Er is een borg vereist die varieert per boot (tussen 200 en 500 euro). De borg wordt voor vertrek betaald en wordt volledig terugbetaald bij teruggave van de boot in dezelfde staat. Betaling kan contant of met kaart.",
    category: "policy",
    keywords: ["borg", "deposito", "terugbetaling"],
    priority: 9,
  },
  {
    title: "Vertrektijden en duur",
    content: "We bieden huurperiodes aan van 2, 4, 6 of 8 uur. Gebruikelijke vertrektijden zijn: ochtend (10:00), middag (14:00) en namiddag (18:00 in de zomer). Voor daghuur is het vertrek om 10:00 en de terugkeer voor zonsondergang.",
    category: "faq",
    keywords: ["vertrektijd", "uren", "duur", "schema"],
    priority: 8,
  },
  {
    title: "Seizoenen en prijzen",
    content: "We hebben drie seizoenen: LAAG (april, mei, juni, september, oktober) met de beste prijzen; MIDDEN (juli) met tussenliggende prijzen; en HOOG (augustus), het hoogseizoen. De prijzen varieren per boot en huurduur.",
    category: "faq",
    keywords: ["seizoen", "prijs", "tarief", "kosten"],
    priority: 8,
  },
  {
    title: "Annuleringsbeleid",
    content: "Gratis datumwijziging met minimaal 7 dagen van tevoren, onder voorbehoud van beschikbaarheid. Alle annuleringen zijn niet restitueerbaar (het betaalde bedrag wordt niet teruggestort). Bij slecht weer plannen we kosteloos opnieuw in.",
    category: "policy",
    keywords: ["annulering", "annuleren", "terugbetaling", "verplaatsen"],
    priority: 9,
  },
  {
    title: "Slecht weer",
    content: "Bij slecht weer (harde wind, storm, overmatige golfslag) wordt het vertrek uitgesteld of wordt een datumwijziging aangeboden zonder extra kosten. Veiligheid is onze topprioriteit. Ons team houdt de weersomstandigheden in de gaten en zal u tijdig informeren als er wijzigingen zijn.",
    category: "policy",
    keywords: ["weer", "storm", "wind", "veiligheid", "weersvoorspelling"],
    priority: 8,
  },
];

// Route recommendations in Dutch
const ROUTES_NL = [
  {
    title: "Route naar de Baaien van Blanes",
    content: "Vaar vanuit de haven van Blanes naar het noorden om ongerepte baaien te ontdekken zoals Cala Sant Francesc, Sa Forcanera en Cala Bona. Het zijn rustige baaien met kristalhelder water, perfect om in te zwemmen en te snorkelen. Geschatte tijd: 2 tot 4 uur afhankelijk van de tussenstops.",
    category: "route",
    keywords: ["baai", "blanes", "route", "snorkelen", "strand"],
    priority: 7,
  },
  {
    title: "Uitstap naar Tossa de Mar",
    content: "Een van de populairste routes. Vaar vanuit Blanes naar het noorden langs de prachtige Costa Brava tot Tossa de Mar met zijn beroemde middeleeuwse stadsmuren. De tocht duurt ongeveer 45 minuten per richting. Een huur van 4 tot 6 uur wordt aanbevolen om de volledige route te genieten.",
    category: "route",
    keywords: ["tossa", "uitstap", "kust", "stadsmuren"],
    priority: 8,
  },
  {
    title: "Route naar Lloret de Mar",
    content: "Richting het zuiden vanuit Blanes kunt u de kust van Lloret de Mar verkennen, langs Santa Cristina en haar kapel. Dit is een kortere route, ideaal voor huurperiodes van 2 tot 4 uur. De stranden van Lloret zijn drukker maar zeer schilderachtig.",
    category: "route",
    keywords: ["lloret", "santa cristina", "zuiden", "kapel"],
    priority: 7,
  },
  {
    title: "Ankeren en zwemmen in baaien",
    content: "Zoek bij het ankeren naar baaien met een zandbodem (betere grip) en beschut tegen de wind. Enkele aanbevelingen: Cala Sant Francesc (zand, zeer rustig), Cala Treumal (gemengd, dicht bij Blanes), en Sa Forcanera (rotsachtig, zeer helder water). Gebruik het anker met minimaal 3 keer de diepte aan ketting of lijn.",
    category: "route",
    keywords: ["ankeren", "anker", "zwemmen", "baai", "zandbodem"],
    priority: 6,
  },
];

// General information in Dutch
const GENERAL_NL = [
  {
    title: "Locatie en hoe te bereiken",
    content: "We bevinden ons in de haven van Blanes, Costa Brava, in de provincie Girona. Blanes ligt op 60 km van Barcelona en 35 km van Girona. U kunt er komen met de auto (parkeerplaats beschikbaar), de trein (station Blanes is 10 minuten lopen) of de bus. We sturen u de exacte locatie bij bevestiging van uw boeking.",
    category: "general",
    keywords: ["locatie", "adres", "bereiken", "haven", "blanes"],
    priority: 7,
  },
  {
    title: "Wat mee te nemen op de boot",
    content: "We raden aan mee te nemen: hoge zonnebrandcrème, een pet of hoed, handdoeken, zwemkleding, water en eten als u langere stops plant, een zonnebril, snorkeluitrusting als u die heeft (ook te huur), en lichte kleding. Neem schoenen mee die nat mogen worden om het schip op en af te stappen.",
    category: "general",
    keywords: ["meenemen", "bagage", "voorbereiden", "noodzakelijk"],
    priority: 6,
  },
  {
    title: "Capaciteit van de boten",
    content: "Onze boten hebben capaciteiten van 4 tot 8 personen afhankelijk van het model. Het is belangrijk de maximale capaciteit te respecteren uit veiligheidsoverwegingen. Voor grotere groepen kunnen we uitstappen met meerdere boten organiseren. Neem contact met ons op voor speciale groepen.",
    category: "general",
    keywords: ["capaciteit", "personen", "groep", "hoeveel"],
    priority: 6,
  },
];

// FAQ entries in Italian
const FAQS_IT = [
  {
    title: "Come prenotare una barca",
    content: "Per prenotare una barca, puoi contattarci direttamente via WhatsApp al +34 611 500 372, tramite il nostro sito web costabravarentaboat.com, o inviarci un'email a costabravarentaboat@gmail.com. Avremo bisogno di conoscere la data desiderata, la durata del noleggio, il numero di persone e la barca che ti interessa.",
    category: "faq",
    keywords: ["prenotare", "noleggiare", "prenotazione", "come"],
    priority: 10,
  },
  {
    title: "È necessaria la patente per noleggiare una barca",
    content: "Abbiamo barche per tutti. Offriamo barche SENZA patente che qualsiasi persona maggiore di 18 anni può guidare dopo un breve briefing di sicurezza. Abbiamo anche barche CON patente per chi possiede una qualifica nautica e cerca imbarcazioni più potenti.",
    category: "faq",
    keywords: ["patente", "licenza", "qualifica", "senza patente"],
    priority: 10,
  },
  {
    title: "Cosa è incluso nel noleggio",
    content: "Il noleggio include: attrezzatura di sicurezza obbligatoria (giubbotti salvagente, estintore, razzi), ancora e cima di ormeggio, tenda o bimini per la protezione solare, frigo portatile e un briefing di sicurezza prima della partenza. Il carburante è incluso in alcune barche; consultare le specifiche di ciascuna imbarcazione.",
    category: "faq",
    keywords: ["incluso", "attrezzatura", "sicurezza", "cosa include"],
    priority: 9,
  },
  {
    title: "Politica di deposito",
    content: "È richiesto un deposito cauzionale che varia a seconda della barca (tra 200 e 500 euro). Il deposito viene pagato prima della partenza e restituito integralmente al momento della riconsegna della barca nelle stesse condizioni. Il pagamento può essere effettuato in contanti o con carta.",
    category: "policy",
    keywords: ["deposito", "cauzione", "rimborso"],
    priority: 9,
  },
  {
    title: "Orari di partenza e durata",
    content: "Offriamo noleggi di 2, 4, 6 o 8 ore. Gli orari abituali di partenza sono: mattino (10:00), mezzogiorno (14:00) e pomeriggio (18:00 in estate). Per i noleggi giornalieri, la partenza è alle 10:00 e la restituzione prima del tramonto.",
    category: "faq",
    keywords: ["orario", "ore", "durata", "partenza"],
    priority: 8,
  },
  {
    title: "Stagioni e prezzi",
    content: "Abbiamo tre stagioni: BASSA (aprile, maggio, giugno, settembre, ottobre) con i prezzi migliori; MEDIA (luglio) con prezzi intermedi; e ALTA (agosto), la stagione di massima domanda. I prezzi variano a seconda della barca e della durata del noleggio.",
    category: "faq",
    keywords: ["stagione", "prezzo", "tariffa", "costo"],
    priority: 8,
  },
  {
    title: "Politica di cancellazione",
    content: "Il cambio data è gratuito con un minimo di 7 giorni di preavviso, soggetto a disponibilità. Tutte le cancellazioni non sono rimborsabili (l'importo pagato non viene restituito). In caso di maltempo, riprogrammiamo senza costi.",
    category: "policy",
    keywords: ["cancellazione", "annullare", "rimborso", "riprogrammare"],
    priority: 9,
  },
  {
    title: "Maltempo",
    content: "In caso di maltempo (vento forte, tempesta, mare agitato), la partenza verrà posticipata o verrà offerto un cambio di data senza costi aggiuntivi. La sicurezza è la nostra massima priorità. Il nostro team monitora le condizioni meteorologiche e ti avviserà in anticipo in caso di cambiamenti.",
    category: "policy",
    keywords: ["tempo", "tempesta", "vento", "sicurezza", "meteo"],
    priority: 8,
  },
];

// Route recommendations in Italian
const ROUTES_IT = [
  {
    title: "Rotta verso le Calette di Blanes",
    content: "Dal porto di Blanes, naviga verso nord per scoprire calette incontaminate come Cala Sant Francesc, Sa Forcanera e Cala Bona. Sono calette tranquille con acque cristalline, perfette per nuotare e fare snorkeling. Tempo stimato: da 2 a 4 ore a seconda delle soste.",
    category: "route",
    keywords: ["caletta", "blanes", "rotta", "snorkeling", "spiaggia"],
    priority: 7,
  },
  {
    title: "Escursione a Tossa de Mar",
    content: "Una delle rotte più popolari. Naviga da Blanes verso nord costeggiando la bellissima Costa Brava fino a Tossa de Mar con il suo famoso borgo medievale murato. Il tragitto dura circa 45 minuti per ogni direzione. Si consiglia un noleggio di 4-6 ore per godersi appieno il percorso.",
    category: "route",
    keywords: ["tossa", "escursione", "costa", "mura"],
    priority: 8,
  },
  {
    title: "Rotta verso Lloret de Mar",
    content: "In direzione sud da Blanes, puoi esplorare la costa di Lloret de Mar, passando per Santa Cristina e il suo eremo. È una rotta più breve, ideale per noleggi di 2-4 ore. Le spiagge di Lloret sono più frequentate ma molto pittoresche.",
    category: "route",
    keywords: ["lloret", "santa cristina", "sud", "eremo"],
    priority: 7,
  },
  {
    title: "Ormeggio e bagno nelle calette",
    content: "Per ormeggiare, cerca calette con fondale sabbioso (miglior tenuta) e riparate dal vento. Alcune raccomandazioni: Cala Sant Francesc (sabbia, molto tranquilla), Cala Treumal (mista, vicino a Blanes) e Sa Forcanera (rocciosa, acque molto chiare). Usa l'ancora con almeno 3 volte la profondità in catena o cima.",
    category: "route",
    keywords: ["ormeggio", "ancora", "bagno", "caletta", "sabbia"],
    priority: 6,
  },
];

// General information in Italian
const GENERAL_IT = [
  {
    title: "Posizione e come arrivare",
    content: "Siamo situati nel Porto di Blanes, Costa Brava, nella provincia di Girona. Blanes si trova a 60 km da Barcellona e a 35 km da Girona. Puoi arrivare in auto (parcheggio disponibile), in treno (la stazione di Blanes si trova a 10 minuti a piedi) o in autobus. Ti invieremo la posizione esatta alla conferma della prenotazione.",
    category: "general",
    keywords: ["posizione", "indirizzo", "arrivare", "porto", "blanes"],
    priority: 7,
  },
  {
    title: "Cosa portare in barca",
    content: "Ti consigliamo di portare: protezione solare ad alto fattore, cappello o berretto, asciugamani, costume da bagno, acqua e cibo se prevedi soste lunghe, occhiali da sole, attrezzatura da snorkeling se ce l'hai (disponibile anche a noleggio) e abiti leggeri. Porta calzature che possano bagnarsi per salire e scendere dalla barca.",
    category: "general",
    keywords: ["portare", "bagaglio", "preparare", "necessario"],
    priority: 6,
  },
  {
    title: "Capacita delle barche",
    content: "Le nostre barche hanno capacità da 4 a 8 persone a seconda del modello. È importante rispettare la capacità massima per motivi di sicurezza. Per gruppi numerosi possiamo organizzare uscite con più barche. Contattaci per gruppi speciali.",
    category: "general",
    keywords: ["capacità", "persone", "gruppo", "quanti"],
    priority: 6,
  },
];

// FAQ entries in Russian
const FAQS_RU = [
  {
    title: "Kak zabronirovat lodku",
    content: "Chtoby zabronirovat lodku, vy mozhete svyazatsya s nami cherez WhatsApp po nomeru +34 611 500 372, cherez nash sayt costabravarentaboat.com ili otpravit nam pismo na costabravarentaboat@gmail.com. Nam nuzhno znat zhelaemую datu, prodolzhitelnost arendy, kolichestvo chelovek i interesuyushuyu vas lodku.",
    category: "faq",
    keywords: ["забронировать", "арендовать", "бронирование", "как"],
    priority: 10,
  },
  {
    title: "Nuzhen li prava dlya arendy lodki",
    content: "U nas est lodki dlya vsekh. My predlagaem lodki BEZ prav, kotoruyu lyuboe litso starshe 18 let mozhet upravlyat posle kratkogo instruktazha po bezopasnosti. U nas takzhe est lodki S pravami dlya tekh, kto imeet nauticheskuyu kvalifikatsiyu i ishchet bolee moshchnye sudna.",
    category: "faq",
    keywords: ["права", "удостоверение", "квалификация", "без прав"],
    priority: 10,
  },
  {
    title: "Chto vklyucheno v arendu",
    content: "Arenda vklyuchaet: obyazatelnoye oborudovaniye bezopasnosti (spasatelnyye zhilety, ognetushitel, signalnyye rakety), yakor i shvartovoye oborudovaniye, navesy ili bimini dlya zashchity ot solntsa, perenosnoy kholodilnik i instruktazh po bezopasnosti pered otplytiiem. Toplivo vklyucheno v stoimost nekotorykh lodok; proverite spetsifikatsii kazhdogo sudna.",
    category: "faq",
    keywords: ["включено", "оборудование", "безопасность", "что входит"],
    priority: 9,
  },
  {
    title: "Politika zaloga",
    content: "Trebuyetsya zalog, kotoryy vary varies v zavisimosti ot lodki (ot 200 do 500 evro). Zalog plateetsya pered otplytiiem i vozvrashaetsya v polnom obeme pri vozvrate lodki v tom zhe sostoyanii. Oplata vozmozhna nalichnymi ili kartoy.",
    category: "policy",
    keywords: ["залог", "депозит", "возврат"],
    priority: 9,
  },
  {
    title: "Vremya otpravleniya i prodolzhitelnost",
    content: "My predlagaem arendu na 2, 4, 6 ili 8 chasov. Obychnoye vremya otpravleniya: utro (10:00), polden (14:00) i vecher (18:00 letom). Dlya sutochnoy arendy otpravleniye v 10:00 i vozvrat do zakata.",
    category: "faq",
    keywords: ["расписание", "часы", "продолжительность", "отправление"],
    priority: 8,
  },
  {
    title: "Sezony i tseny",
    content: "U nas tri sezona: NIZKIY (aprel, may, iyun, sentyabr, oktyabr) s luchshimi tsenami; SREDNIY (iyul) so srednimi tsenami; i VYSOKIY (avgust), sezon maksimalnogo sprosa. Tseny vary varies v zavisimosti ot lodki i prodolzhitelnosti arendy.",
    category: "faq",
    keywords: ["сезон", "цена", "тариф", "стоимость"],
    priority: 8,
  },
  {
    title: "Politika otmeny",
    content: "Besplatnoe izmenenie daty pri uvedomlenii za 7 dnej, pri nalichii mest. Vse otmeny ne podlezhat vozvratu (uplachennaya summa ne vozvrashchaetsya). V sluchaye plokhoy pogody my perenosim besplatno.",
    category: "policy",
    keywords: ["отмена", "аннулировать", "возврат", "перенос"],
    priority: 9,
  },
  {
    title: "Plokhaya pogoda",
    content: "Esli stoit plokhaya pogoda (silnyy veter, shtorm, silnoye volneniye), otpravleniye budet pereneseno ili predlozhena smena daty bez dopolnitelnykh raskhodov. Bezopasnost — nash glavnyy prioritet. Nasha komanda sledit za pogodnymi usloviyami i zaranee predupredит vas ob izmeneniyakh.",
    category: "policy",
    keywords: ["погода", "шторм", "ветер", "безопасность", "прогноз"],
    priority: 8,
  },
];

// Route recommendations in Russian
const ROUTES_RU = [
  {
    title: "Marshrut k bukhтам Blanes",
    content: "Iz porta Blanes otpravlyaytes na sever, chtoby otkryt dlya sebya netronutye buhty, takiye kak Cala Sant Francesc, Sa Forcanera i Cala Bona. Eto spokoynyye buhty s prozrachnoy vodoy, idealnыye dlya plavaniya i snorkeling. Primernoe vremya: 2-4 chasa v zavisimosti ot ostanovok.",
    category: "route",
    keywords: ["бухта", "blanes", "маршрут", "снорклинг", "пляж"],
    priority: 7,
  },
  {
    title: "Ekskursiya v Tossa de Mar",
    content: "Odin iz samykh populyarnykh marshrutov. Plavte iz Blanes na sever vdol krasivogo poberezya Costa Brava do Tossa de Mar s ego znamenitym srednevekovym zamokom. Put zanimaet okolo 45 minut v kazhduyu storonu. Rekomenduyetsya arenda na 4-6 chasov dlya polnogo naslazhdenniya marshrutom.",
    category: "route",
    keywords: ["тосса", "экскурсия", "побережье", "крепость"],
    priority: 8,
  },
  {
    title: "Marshrut k Lloret de Mar",
    content: "Na yug ot Blanes mozhno issledovat poberezhye Lloret de Mar, proezzaya cherez Santa Cristina i eyo ermitazh. Eto boleye korotkiy marshrut, idealnyy dlya arendy na 2-4 chasa. Plyazhi Lloret bolee mnogolyudny, no ochen zhivopisny.",
    category: "route",
    keywords: ["льорет", "santa cristina", "юг", "эрмитаж"],
    priority: 7,
  },
  {
    title: "Yakorenie i kupaniye v bukhtakh",
    content: "Pri yakorenii ishchite buhty s peschanym dnom (luchshe derzhit) i zashchishchennyye ot vetra. Nekotoryye rekomendatsii: Cala Sant Francesc (pesok, ochen spokoynyy), Cala Treumal (smeshannyy, ryadom s Blanes) i Sa Forcanera (skalistyy, ochen prozrachnaya voda). Ispolzuyte yakor s dlinnoy tsepи ne meneye 3 glubin.",
    category: "route",
    keywords: ["якорение", "якорь", "купание", "бухта", "песок"],
    priority: 6,
  },
];

// General information in Russian
const GENERAL_RU = [
  {
    title: "Mestopolozheniye i kak dobratsya",
    content: "My nakhodimсya v portu Blanes, Costa Brava, v provintsii Girona. Blanes nakhoditsya v 60 km ot Barselony i 35 km ot Zhirony. Mozhno priyekhat na avtomobile (parking imeyetsya), na poyezde (stantsiya Blanes v 10 minutakh khodb) ili na avtobuse. My prishlem vam tochnoye mestopolozheniye pri podtverzhdenii bronirovaniya.",
    category: "general",
    keywords: ["местоположение", "адрес", "добраться", "порт", "blanes"],
    priority: 7,
  },
  {
    title: "Chto vzyat s soboy na lodku",
    content: "My rekomenduyem vzyat: solntsezashchitnyy krem s vysokim SPF, kepku ili shlyapu, polotentsa, kupalnyk, vodu i edu esli planiruete dlitelnyye ostanovki, solntsezashchitnyye ochki, snorkelingovoye oborudovaniye esli yest (mozh no vzyat naprokat) i legkuyu odezhdu. Vozmite obuv, kotoraya mozhet promoknut dlya posadki i vysadki.",
    category: "general",
    keywords: ["взять", "багаж", "подготовить", "необходимое"],
    priority: 6,
  },
  {
    title: "Vmestimost lodok",
    content: "Nashi lodki rассчitany ot 4 do 8 chelovek v zavisimosti ot modeli. Vazhno soblyudat maksimalnuyu vmestimost iz soobrazheniy bezopasnosti. Dlya bolshikh grupp my mozhem organizovat vykhodы na neskolkikh lodkakh. Svyazhites s nami dlya spetsialnykh grupp.",
    category: "general",
    keywords: ["вместимость", "люди", "группа", "сколько человек"],
    priority: 6,
  },
];

// Blog article recommendations in Spanish
const BLOG_ES = [
  {
    title: "Blog: mejores calas de la Costa Brava en barco",
    content: "Si quieres descubrir las calas más bonitas de la Costa Brava, te recomendamos leer nuestro artículo 'Las 10 Mejores Calas de la Costa Brava para Visitar en Barco'. Incluye calas secretas, consejos de fondeo y fotos. Puedes leerlo en: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["calas", "cala", "playa", "costa brava", "mejores calas", "cala secreta", "fondeo", "baño"],
    priority: 7,
  },
  {
    title: "Blog: guía alquiler barco sin licencia en Blanes",
    content: "Tenemos una guía completa sobre cómo alquilar un barco sin licencia en Blanes. Explica los requisitos, tipos de barco disponibles, normativa y consejos para principiantes. Léela aquí: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["sin licencia", "licencia", "requisitos", "normativa", "principiante", "primera vez", "guía"],
    priority: 8,
  },
  {
    title: "Blog: rutas en barco desde Blanes",
    content: "Descubre las mejores rutas en barco desde Blanes en nuestro artículo 'Rutas en Barco desde Blanes: De Calas Secretas a Pueblos Medievales'. Incluye rutas hacia Tossa de Mar, Lloret, calas escondidas y pueblos costeros con tiempos estimados y recomendaciones. Léelo en: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["ruta", "rutas", "itinerario", "recorrido", "tossa", "lloret", "excursion", "donde ir"],
    priority: 7,
  },
  {
    title: "Blog: qué hacer en Blanes en verano",
    content: "Si quieres saber qué hacer en Blanes además de alquilar un barco, tenemos un artículo con 15 planes imprescindibles para el verano: restaurantes, playas, actividades, vida nocturna y más. Léelo en: https://www.costabravarentaboat.com/blog/que-hacer-en-blanes-verano",
    category: "blog",
    keywords: ["blanes", "verano", "planes", "qué hacer", "actividades", "restaurante", "chiringuito", "gastronomía"],
    priority: 6,
  },
  {
    title: "Blog: consejos primera vez alquilando barco",
    content: "Si es tu primera vez alquilando un barco, tenemos una guía con consejos prácticos para que disfrutes al máximo sin experiencia previa. Cubre seguridad, navegación básica, que llevar y errores comunes a evitar. Léela en: https://www.costabravarentaboat.com/blog/consejos-primera-vez-alquilar-barco",
    category: "blog",
    keywords: ["primera vez", "principiante", "consejo", "experiencia", "novato", "seguridad", "básico"],
    priority: 7,
  },
  {
    title: "Blog: temporadas y cuando reservar",
    content: "Para información detallada sobre las temporadas de navegación en la Costa Brava y cuándo es el mejor momento para reservar, consulta nuestro blog. Temporada baja (abril-junio, septiembre-octubre) ofrece mejores precios y menos gente. Temporada alta (agosto) requiere reservar con antelación. Más info en nuestro blog: https://www.costabravarentaboat.com/blog",
    category: "blog",
    keywords: ["temporada", "cuándo", "reservar", "mejor momento", "temporada alta", "temporada baja", "agosto", "verano"],
    priority: 6,
  },
];

// Blog article recommendations in English
const BLOG_EN = [
  {
    title: "Blog: complete guide to boat rental in Costa Brava",
    content: "We have a comprehensive English guide to boat rental in Costa Brava. It covers everything you need to know: boat types, licensing requirements, prices, routes and practical tips. Read it here: https://www.costabravarentaboat.com/blog/boat-rental-costa-brava-english-guide",
    category: "blog",
    keywords: ["guide", "rental", "costa brava", "english", "information", "how to", "tips"],
    priority: 8,
  },
  {
    title: "Blog: best coves in Costa Brava by boat",
    content: "Discover the 10 best coves in Costa Brava accessible by boat in our blog article. It includes hidden coves, anchoring tips and photos. Read it here: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["coves", "cove", "beach", "costa brava", "best coves", "hidden", "anchoring", "swimming"],
    priority: 7,
  },
  {
    title: "Blog: boat routes from Blanes",
    content: "Check out our article on the best boat routes from Blanes, including routes to Tossa de Mar, Lloret de Mar, hidden coves and coastal villages with estimated times and recommendations. Read it here: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["route", "routes", "itinerary", "tossa", "lloret", "excursion", "where to go"],
    priority: 7,
  },
  {
    title: "Blog: things to do in Blanes",
    content: "Want to know what to do in Blanes beyond boat rental? Our blog has 15 essential summer plans: restaurants, beaches, activities, nightlife and more. Read it here: https://www.costabravarentaboat.com/blog/que-hacer-en-blanes-verano",
    category: "blog",
    keywords: ["blanes", "summer", "plans", "things to do", "activities", "restaurant", "gastronomy"],
    priority: 6,
  },
  {
    title: "Blog: first time boat rental tips",
    content: "Renting a boat for the first time? Our blog has practical tips to enjoy your experience with no prior boating experience. Covers safety, basic navigation, what to bring and common mistakes to avoid. Read it here: https://www.costabravarentaboat.com/blog/consejos-primera-vez-alquilar-barco",
    category: "blog",
    keywords: ["first time", "beginner", "tips", "experience", "safety", "basic", "no experience"],
    priority: 7,
  },
];

// Blog article recommendations in Catalan
const BLOG_CA = [
  {
    title: "Blog: millors cales de la Costa Brava en vaixell",
    content: "Si vols descobrir les cales mes boniques de la Costa Brava, et recomanem llegir el nostre article 'Les 10 Millors Cales de la Costa Brava per Visitar en Vaixell'. Inclou cales secretes, consells de fondeig i fotos. Llegeix-lo a: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["cales", "cala", "platja", "costa brava", "millors cales", "cala secreta", "fondeig", "bany"],
    priority: 7,
  },
  {
    title: "Blog: guia lloguer vaixell sense llicència a Blanes",
    content: "Tenim una guia completa sobre com llogar un vaixell sense llicència a Blanes. Explica els requisits, tipus de vaixell disponibles, normativa i consells per a principiants. Llegeix-la aquí: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["sense llicència", "llicència", "requisits", "normativa", "principiant", "primera vegada", "guia"],
    priority: 8,
  },
  {
    title: "Blog: rutes en vaixell des de Blanes",
    content: "Descobreix les millors rutes en vaixell des de Blanes al nostre article. Inclou rutes cap a Tossa de Mar, Lloret, cales amagades i pobles costaners amb temps estimats i recomanacions. Llegeix-lo a: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["ruta", "rutes", "itinerari", "recorregut", "tossa", "lloret", "excursio", "on anar"],
    priority: 7,
  },
];

// Blog article recommendations in French
const BLOG_FR = [
  {
    title: "Blog: meilleures criques de la Costa Brava en bateau",
    content: "Découvrez les 10 meilleures criques de la Costa Brava accessibles en bateau dans notre article de blog. Il comprend des criques cachées, des conseils de mouillage et des photos. Lisez-le ici: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["crique", "plage", "costa brava", "meilleures criques", "cachée", "mouillage", "baignade"],
    priority: 7,
  },
  {
    title: "Blog: guide location bateau sans permis à Blanes",
    content: "Nous avons un guide complet sur la location de bateaux sans permis à Blanes. Il explique les conditions, les types de bateaux disponibles, la réglementation et les conseils pour les débutants. Lisez-le ici: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["sans permis", "permis", "conditions", "réglementation", "débutant", "première fois", "guide"],
    priority: 8,
  },
  {
    title: "Blog: itinéraires en bateau depuis Blanes",
    content: "Découvrez les meilleurs itinéraires en bateau depuis Blanes dans notre article, y compris des routes vers Tossa de Mar, Lloret, des criques cachées et des villages côtiers. Lisez-le ici: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["itinéraire", "route", "tossa", "lloret", "excursion", "où aller"],
    priority: 7,
  },
];

// Blog article recommendations in German
const BLOG_DE = [
  {
    title: "Blog: beste Buchten der Costa Brava mit dem Boot",
    content: "Entdecken Sie die 10 besten Buchten der Costa Brava, die mit dem Boot erreichbar sind, in unserem Blogartikel. Er enthält versteckte Buchten, Ankertipps und Fotos. Lesen Sie ihn hier: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["bucht", "strand", "costa brava", "beste buchten", "versteckt", "ankern", "schwimmen"],
    priority: 7,
  },
  {
    title: "Blog: Ratgeber Bootsmiete ohne Führerschein in Blanes",
    content: "Wir haben einen umfassenden Ratgeber zur Bootsmiete ohne Führerschein in Blanes. Er erklärt die Voraussetzungen, verfügbare Bootstypen, Vorschriften und Tipps für Anfänger. Lesen Sie ihn hier: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["ohne führerschein", "führerschein", "voraussetzungen", "vorschriften", "anfänger", "erstes mal", "ratgeber"],
    priority: 8,
  },
  {
    title: "Blog: Bootsrouten ab Blanes",
    content: "Entdecken Sie die besten Bootsrouten ab Blanes in unserem Artikel, einschließlich Routen nach Tossa de Mar, Lloret, versteckten Buchten und Küstendörfern. Lesen Sie ihn hier: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["route", "routen", "tossa", "lloret", "ausflug", "wohin"],
    priority: 7,
  },
];

// Blog article recommendations in Dutch
const BLOG_NL = [
  {
    title: "Blog: beste baaien van de Costa Brava per boot",
    content: "Ontdek de 10 beste baaien van de Costa Brava die per boot bereikbaar zijn in ons blogartikel. Het bevat verborgen baaien, ankertips en foto's. Lees het hier: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["baai", "strand", "costa brava", "beste baaien", "verborgen", "ankeren", "zwemmen"],
    priority: 7,
  },
  {
    title: "Blog: gids bootverhuur zonder vaarbewijs in Blanes",
    content: "We hebben een uitgebreide gids over bootverhuur zonder vaarbewijs in Blanes. Het legt de vereisten uit, beschikbare boottypes, regelgeving en tips voor beginners. Lees het hier: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["zonder vaarbewijs", "vaarbewijs", "vereisten", "regelgeving", "beginner", "eerste keer", "gids"],
    priority: 8,
  },
  {
    title: "Blog: bootroutes vanuit Blanes",
    content: "Ontdek de beste bootroutes vanuit Blanes in ons artikel, inclusief routes naar Tossa de Mar, Lloret, verborgen baaien en kustdorpen. Lees het hier: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["route", "routes", "tossa", "lloret", "uitstap", "waar naartoe"],
    priority: 7,
  },
];

// Blog article recommendations in Italian
const BLOG_IT = [
  {
    title: "Blog: migliori calette della Costa Brava in barca",
    content: "Scopri le 10 migliori calette della Costa Brava raggiungibili in barca nel nostro articolo del blog. Include calette nascoste, consigli di ormeggio e foto. Leggilo qui: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["caletta", "spiaggia", "costa brava", "migliori calette", "nascosta", "ormeggio", "bagno"],
    priority: 7,
  },
  {
    title: "Blog: guida noleggio barca senza patente a Blanes",
    content: "Abbiamo una guida completa sul noleggio di barche senza patente a Blanes. Spiega i requisiti, i tipi di barca disponibili, la normativa e i consigli per i principianti. Leggila qui: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["senza patente", "patente", "requisiti", "normativa", "principiante", "prima volta", "guida"],
    priority: 8,
  },
  {
    title: "Blog: itinerari in barca da Blanes",
    content: "Scopri i migliori itinerari in barca da Blanes nel nostro articolo, inclusi percorsi verso Tossa de Mar, Lloret, calette nascoste e villaggi costieri. Leggilo qui: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["itinerario", "percorso", "tossa", "lloret", "escursione", "dove andare"],
    priority: 7,
  },
];

// Blog article recommendations in Russian
const BLOG_RU = [
  {
    title: "Blog: luchshiye bukhty Costa Brava na lodke",
    content: "Otkroyte dlya sebya 10 luchshikh bukht Costa Brava, dostupnykh na lodke, v nashem bloge. Vklyuchaet skrytyye bukhty, sovety po yakoreniyu i foto. Chitayte zdes: https://www.costabravarentaboat.com/blog/mejores-calas-costa-brava-en-barco",
    category: "blog",
    keywords: ["бухта", "пляж", "costa brava", "лучшие бухты", "скрытая", "якорение", "купание"],
    priority: 7,
  },
  {
    title: "Blog: gid po arende lodki bez prav v Blanes",
    content: "U nas est polnoye rukovodstvo po arende lodok bez prav v Blanes. Ono ob'yasnyaet trebovaniya, dostupnyye tipy lodok, pravila i sovety dlya nachinayushchikh. Chitayte zdes: https://www.costabravarentaboat.com/blog/alquiler-barco-sin-licencia-blanes-guia",
    category: "blog",
    keywords: ["без прав", "права", "требования", "правила", "начинающий", "первый раз", "руководство"],
    priority: 8,
  },
  {
    title: "Blog: marshruty na lodke iz Blanes",
    content: "Otkroyte luchshiye marshruty na lodke iz Blanes v nashey statie, vklyuchaya marshruty do Tossa de Mar, Lloret, skrytyye bukhty i pribrezhnyye derevni. Chitayte zdes: https://www.costabravarentaboat.com/blog/rutas-barco-desde-blanes",
    category: "blog",
    keywords: ["маршрут", "маршруты", "тосса", "льорет", "экскурсия", "куда поехать"],
    priority: 7,
  },
];

// Seed function
export async function seedKnowledgeBase(): Promise<void> {
  logger.info("Starting to seed knowledge base");

  const entriesByLanguage: Record<string, typeof FAQS_ES> = {
    es: [...FAQS_ES, ...ROUTES_ES, ...GENERAL_ES, ...BLOG_ES],
    ca: [...FAQS_CA, ...ROUTES_CA, ...GENERAL_CA, ...BLOG_CA],
    en: [...FAQS_EN, ...ROUTES_EN, ...GENERAL_EN, ...BLOG_EN],
    fr: [...FAQS_FR, ...ROUTES_FR, ...GENERAL_FR, ...BLOG_FR],
    de: [...FAQS_DE, ...ROUTES_DE, ...GENERAL_DE, ...BLOG_DE],
    nl: [...FAQS_NL, ...ROUTES_NL, ...GENERAL_NL, ...BLOG_NL],
    it: [...FAQS_IT, ...ROUTES_IT, ...GENERAL_IT, ...BLOG_IT],
    ru: [...FAQS_RU, ...ROUTES_RU, ...GENERAL_RU, ...BLOG_RU],
  };

  let added = 0;
  let failed = 0;

  for (const [lang, entries] of Object.entries(entriesByLanguage)) {
    for (const entry of entries) {
      const success = await addKnowledgeEntry(
        entry.title,
        entry.content,
        entry.category,
        lang,
        entry.keywords,
        entry.priority
      );
      if (success) added++;
      else failed++;
    }
  }

  logger.info("Knowledge base seeding complete", { added, failed, languages: 8 });
}

// Check if already seeded
export async function isKnowledgeBaseSeeded(): Promise<boolean> {
  const { hasKnowledgeEntries } = await import("./ragService");
  return await hasKnowledgeEntries();
}
