export interface BoatReview {
  name: string;
  nationality: string;
  flag: string;
  rating: number;
  text: string;
  date: string;
}

// Reviews per boat, tailored to each boat's characteristics and target audience
const BOAT_REVIEWS: Record<string, BoatReview[]> = {
  "solar-450": [
    { name: "Laura M.", nationality: "ES", flag: "ES", rating: 5, text: "Alquilamos el Solar 450 para pasar el dia en familia y fue una experiencia increible. El solárium acolchado es genial para que los ninos descansen entre cala y cala. En 15 minutos ya navegábamos solos.", date: "2025-08" },
    { name: "James T.", nationality: "GB", flag: "GB", rating: 5, text: "Perfect boat for a family of four. No license needed and the staff explained everything clearly. We visited three coves and the kids loved jumping off the ladder into the water.", date: "2025-07" },
    { name: "Sophie D.", nationality: "FR", flag: "FR", rating: 4, text: "Tres bonne journee en mer avec le Solar 450. Facile a conduire, essence incluse, et le bimini protege bien du soleil. Ideal pour decouvrir les criques de Blanes sans permis bateau.", date: "2025-08" },
    { name: "Marco P.", nationality: "IT", flag: "IT", rating: 5, text: "Abbiamo noleggiato il Solar 450 per una giornata a Blanes. Barca stabile, facile da manovrare e il prendisole e molto comodo. Perfetto per famiglie con bambini.", date: "2025-07" },
  ],
  "remus-450": [
    { name: "Carlos y Ana", nationality: "ES", flag: "ES", rating: 5, text: "El Remus 450 es el barco perfecto para quienes nunca han navegado. La capota Bi Mini protege del sol todo el dia y el barco es muy estable. Fuimos con nuestros hijos de 6 y 9 anos y se lo pasaron genial.", date: "2025-08" },
    { name: "Emma W.", nationality: "GB", flag: "GB", rating: 5, text: "We chose the Remus 450 as first-time boaters and it was brilliant. Very stable even with small waves, the canopy kept us cool all day. Fuel included in the price was a nice surprise.", date: "2025-07" },
    { name: "Hans K.", nationality: "DE", flag: "DE", rating: 5, text: "Das beliebteste Boot zu Recht! Das Bi-Mini-Verdeck ist perfekt fur einen ganzen Tag auf dem Wasser. Sehr stabil, ideal fur Familien. Die Crew in Blanes war sehr freundlich.", date: "2025-08" },
    { name: "Lucia R.", nationality: "ES", flag: "ES", rating: 4, text: "Repetimos con el Remus 450 por segunda vez. Es el mas fiable de la flota para familias. La proa es amplia para tomar el sol y la escalera de bano facilita mucho el acceso al agua.", date: "2025-09" },
  ],
  "remus-450-ii": [
    { name: "Familia Rodriguez", nationality: "ES", flag: "ES", rating: 5, text: "El Remus 450 estaba reservado pero nos ofrecieron el Remus 450 II, identico en todo. Mismo confort, misma estabilidad. Pasamos un dia estupendo en las calas de la Costa Brava.", date: "2025-08" },
    { name: "Sarah L.", nationality: "GB", flag: "GB", rating: 5, text: "Same great boat as the Remus 450. We had an amazing day exploring hidden coves near Blanes. Easy to handle, comfortable for five people, and fuel included.", date: "2025-07" },
    { name: "Pierre et Marie", nationality: "FR", flag: "FR", rating: 5, text: "Meme qualite que le Remus 450 original. Nous avons passe une journee magnifique en famille. Le bateau est tres stable et facile a manoeuvrer, parfait pour les debutants.", date: "2025-08" },
    { name: "David S.", nationality: "NL", flag: "NL", rating: 4, text: "Goede boot voor een dagje op zee. Stabiel, ruim genoeg voor vijf personen en de Bi Mini kap is ideaal tegen de zon. Brandstof inbegrepen, geen vaarbewijs nodig.", date: "2025-07" },
  ],
  "astec-400": [
    { name: "Marta y Javi", nationality: "ES", flag: "ES", rating: 5, text: "El Astec 400 es ideal para parejas. Compacto pero comodo, con solárium acolchado y toldo. Navegamos 4 horas por las calas de Blanes a un precio muy bueno. Relacion calidad-precio inmejorable.", date: "2025-06" },
    { name: "Tom & Lisa", nationality: "GB", flag: "GB", rating: 5, text: "Best value boat rental on the Costa Brava. Just the two of us, no license needed, fuel included. We found a secluded cove and had it all to ourselves. Absolutely magical.", date: "2025-07" },
    { name: "Katrin M.", nationality: "DE", flag: "DE", rating: 4, text: "Perfekt fur zwei Personen oder kleine Familien. Wir hatten einen wunderschonen Tag auf dem Mittelmeer. Der Preis ab 70 Euro fur ein paar Stunden ist sehr fair.", date: "2025-08" },
    { name: "Elena V.", nationality: "IT", flag: "IT", rating: 5, text: "Barca compatta ma perfetta per una coppia. Abbiamo esplorato le calette vicino a Blanes, pranzo a bordo e bagno in acque cristalline. L'opzione piu economica e comunque eccellente.", date: "2025-09" },
  ],
  "astec-480": [
    { name: "Pablo G.", nationality: "ES", flag: "ES", rating: 5, text: "El Astec 480 es el mejor barco sin licencia de la flota. La musica Bluetooth hace la experiencia mucho mejor. Solárium amplio, 4.80m de eslora y espacio de sobra para 5 personas.", date: "2025-08" },
    { name: "Charlotte B.", nationality: "FR", flag: "FR", rating: 5, text: "Le meilleur bateau sans permis! Le systeme Bluetooth est genial pour mettre de la musique en mer. Tres confortable, spacieux et bien equipe. Notre journee preferee a Blanes.", date: "2025-07" },
    { name: "Mike & Jenny", nationality: "GB", flag: "GB", rating: 5, text: "The Bluetooth speakers made our day! Great boat, very comfortable for five of us. The premium option without needing a license. Worth every euro for a full-day rental.", date: "2025-08" },
    { name: "Andrea F.", nationality: "IT", flag: "IT", rating: 4, text: "Barca top di gamma senza patente. Bluetooth, prendisole, spazio per 5 persone. Abbiamo passato 6 ore navigando lungo la costa, fermandoci in calette nascoste. Consigliatissimo.", date: "2025-07" },
  ],
  "mingolla-brava-19": [
    { name: "Alejandro R.", nationality: "ES", flag: "ES", rating: 5, text: "La Mingolla es una autentica maquina. 80cv que te plantan en Lloret en 15 minutos. Diseno italiano deportivo y a la vez elegante. GPS y sonda incluidos. Imprescindible tener licencia.", date: "2025-08" },
    { name: "Richard H.", nationality: "GB", flag: "GB", rating: 5, text: "Stunning boat. 80hp gets you to Tossa de Mar in 30 minutes. GPS and fish finder included. The Italian design turns heads in every port. Best boat I've rented in Spain.", date: "2025-07" },
    { name: "Thomas W.", nationality: "DE", flag: "DE", rating: 5, text: "Sportliches italienisches Design mit 80 PS. In 15 Minuten in Lloret de Mar. GPS, Echolot und Susswasserdusche an Bord. Perfekt fur erfahrene Bootsfahrer an der Costa Brava.", date: "2025-08" },
    { name: "Isabel y Miguel", nationality: "ES", flag: "ES", rating: 4, text: "Alquilamos la Mingolla para explorar la costa desde Blanes hasta Tossa. La velocidad es impresionante y el equipamiento completo. Ducha de agua dulce genial despues de cada bano.", date: "2025-09" },
  ],
  "trimarchi-57s": [
    { name: "Daniel C.", nationality: "ES", flag: "ES", rating: 5, text: "110cv de pura adrenalina. El Trimarchi 57S es para los que quieren sentir la velocidad en el agua. Mesa central para comer en una cala, soláriums a proa y popa. Espectacular para 7 personas.", date: "2025-08" },
    { name: "Oliver & Friends", nationality: "GB", flag: "GB", rating: 5, text: "We were a group of 7 and the Trimarchi was perfect. 110hp engine is thrilling, but also stable enough for lunch in a cove. The sundeck at the bow is amazing for sunbathing.", date: "2025-07" },
    { name: "Jan van D.", nationality: "NL", flag: "NL", rating: 5, text: "Fantastische boot! 110 pk zorgt voor een geweldige ervaring. We hebben de hele kust verkend van Blanes tot Tossa de Mar. Ruimte voor 7 personen, tafel om te lunchen op zee.", date: "2025-08" },
    { name: "Familia Martinez", nationality: "ES", flag: "ES", rating: 5, text: "Alquilamos el Trimarchi para celebrar un cumpleanos. 7 personas comodamente, mesa para comer fondeados en cala, y la velocidad para movernos rapido entre calas. Dia perfecto.", date: "2025-07" },
  ],
  "pacific-craft-625": [
    { name: "Roberto y Clara", nationality: "ES", flag: "ES", rating: 5, text: "El Pacific Craft 625 es otra liga. 6.24 metros, Yamaha 115cv, soláriums a proa y popa, mesa para comer. La mejor experiencia nautica que hemos tenido en la Costa Brava. Vale cada euro.", date: "2025-08" },
    { name: "The Hendersons", nationality: "GB", flag: "GB", rating: 5, text: "The flagship boat lives up to its name. Spacious, powerful, beautifully maintained. We spent 8 hours exploring from Blanes to Tossa de Mar. Fresh water shower on board was a luxury.", date: "2025-07" },
    { name: "Philippe L.", nationality: "FR", flag: "FR", rating: 5, text: "Le meilleur bateau de la flotte, sans aucun doute. Yamaha 115cv, espace pour 7 personnes, douche eau douce, tables pour dejeuner. Une experience premium sur la Costa Brava.", date: "2025-08" },
    { name: "Stefan B.", nationality: "DE", flag: "DE", rating: 5, text: "Das Flaggschiff der Flotte. 6,24 Meter, Yamaha 115 PS, Sonnendeck vorne und hinten. Perfekt fur einen ganzen Tag auf dem Mittelmeer. Erstklassige Ausstattung und Wartung.", date: "2025-07" },
  ],
  "excursion-privada": [
    { name: "Ana y Pedro", nationality: "ES", flag: "ES", rating: 5, text: "La excursion con capitan fue la mejor decision. Nos llevo a calas secretas que jamas habriamos encontrado solos. Fondeamos en la cala perfecta del dia, nos banamos y disfrutamos sin preocupaciones.", date: "2025-08" },
    { name: "Sarah & Mark", nationality: "GB", flag: "GB", rating: 5, text: "Having a captain was the best choice. He took us to hidden caves and secret coves between Blanes and Tossa. Perfect for our anniversary. We just relaxed while he handled everything.", date: "2025-07" },
    { name: "Famille Dupont", nationality: "FR", flag: "FR", rating: 5, text: "Excursion privee parfaite. Le capitaine connait chaque recoin de la cote. Il nous a emmenes dans des criques accessibles uniquement par la mer. Experience exclusive et inoubliable.", date: "2025-08" },
    { name: "Familia Rossi", nationality: "IT", flag: "IT", rating: 5, text: "Escursione privata con capitano: la scelta migliore per chi vuole godersi il mare senza pensieri. Il capitano ci ha portato in calette segrete. Perfetto per celebrazioni e coppie.", date: "2025-07" },
  ],
};

export function getBoatReviews(boatId: string): BoatReview[] {
  return BOAT_REVIEWS[boatId] || [];
}

export function getBoatAverageRating(boatId: string): { average: number; count: number } {
  const reviews = BOAT_REVIEWS[boatId] || [];
  if (reviews.length === 0) return { average: 0, count: 0 };
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}
