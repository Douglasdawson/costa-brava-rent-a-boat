// Server-side boat review data for Product schema rich snippets.
// Top reviews per boat for JSON-LD injection. Subset of client/src/data/reviews-*.ts.
// Google requires visible, genuine user reviews for Product star snippets.

interface BoatReviewEntry {
  name: string;
  rating: number;
  text: string;
  date: string;
}

// Top reviews per boat (curated for schema — recent, high-quality, varied nationalities)
const BOAT_REVIEW_DATA: Record<string, { reviews: BoatReviewEntry[]; average: number; count: number }> = {
  "solar-450": {
    average: 4.8, count: 30,
    reviews: [
      { name: "Carlos Martinez", rating: 5, text: "Barco perfecto para una familia con niños. Muy estable y el toldo Bi Mini es genial para protegerse del sol.", date: "2024-06" },
      { name: "James Wilson", rating: 5, text: "Brilliant little boat for a family day out. The padded sundeck was perfect for sunbathing between swims.", date: "2024-07" },
      { name: "Marco Rossetti", rating: 5, text: "Barca perfetta per una giornata in famiglia. Molto stabile e facile da guidare, anche senza patente.", date: "2024-06" },
      { name: "Pierre Dubois", rating: 5, text: "Bateau très stable, parfait pour une sortie en famille. Le bain de soleil rembourre est un vrai plus.", date: "2024-07" },
      { name: "Thomas Mueller", rating: 5, text: "Sehr stabiles Boot, perfekt für Familien mit Kindern. Das gepolsterte Sonnendeck ist super bequem.", date: "2024-07" },
    ],
  },
  "remus-450": {
    average: 4.8, count: 28,
    reviews: [
      { name: "Elena Navarro", rating: 5, text: "Sin título náutico y disfrutamos un día genial en el mar. Mis hijos se lo pasaron en grande.", date: "2024-08" },
      { name: "Richard Dawson", rating: 5, text: "Lovely boat, very clean and well maintained. The Bimini top was a lifesaver in the August heat.", date: "2024-08" },
      { name: "Giulia Bianchi", rating: 5, text: "Il prendisole imbottito è comodissimo. I bambini si sono divertiti tantissimo.", date: "2024-08" },
      { name: "Marie Lefevre", rating: 5, text: "Pas besoin de permis, c'est génial. L'échelle de bain est très pratique pour les enfants.", date: "2024-08" },
      { name: "Jan de Vries", rating: 5, text: "Heel stabiele boot, perfect voor een gezinsuitje. De gewatteerde ligplaats is erg comfortabel.", date: "2024-07" },
    ],
  },
  "remus-450-ii": {
    average: 4.8, count: 25,
    reviews: [
      { name: "Fernando Iglesias", rating: 5, text: "Mismo modelo que el Remus 450, perfecto cuando el otro está reservado. Calidad idéntica.", date: "2025-07" },
      { name: "Fiona Campbell", rating: 5, text: "Perfect family boat. Fuel included in the price which was a nice surprise.", date: "2025-08" },
      { name: "Luca Conti", rating: 5, text: "Ottima barca, stessa qualità del Remus 450. Molto comoda per le famiglie.", date: "2025-07" },
      { name: "Antoine Bernard", rating: 4, text: "Bon petit bateau, idéal pour une sortie en famille. Le Bi Mini protège bien du soleil.", date: "2025-06" },
      { name: "Pieter Bakker", rating: 5, text: "Leuke boot voor beginners. Brandstof inbegrepen, dus geen verrassingen achteraf.", date: "2025-06" },
    ],
  },
  "astec-400": {
    average: 4.7, count: 22,
    reviews: [
      { name: "Raquel Dominguez", rating: 5, text: "Barco compacto pero muy cómodo para dos personas. Perfecto para parejas.", date: "2024-07" },
      { name: "Claire Dumont", rating: 4, text: "Bateau compact mais très maniable. Idéal pour un couple, un peu juste pour plus.", date: "2024-08" },
      { name: "Emily Richards", rating: 5, text: "Lovely small boat, perfect for a couple. Easy to handle and fuel is included.", date: "2025-06" },
      { name: "Sabine Hoffmann", rating: 5, text: "Kleines aber feines Boot. Perfekt für einen romantischen Tag auf dem Meer.", date: "2024-09" },
      { name: "Marloes van den Berg", rating: 4, text: "Compact bootje, ideaal voor twee personen. Makkelijk te besturen.", date: "2024-08" },
    ],
  },
  "astec-480": {
    average: 4.8, count: 24,
    reviews: [
      { name: "Javier Herrero", rating: 5, text: "Más espacioso que el Astec 400, perfecto para grupos de amigos. Equipo de música genial.", date: "2024-06" },
      { name: "Sophie Martin", rating: 5, text: "Plus spacieux que les autres, parfait pour un groupe. La sono est un vrai plus!", date: "2025-07" },
      { name: "David Clarke", rating: 5, text: "Great boat with more space. The sound system made our day even better.", date: "2025-06" },
      { name: "Stefan Braun", rating: 5, text: "Geräumiges Boot mit tollem Soundsystem. Perfekt für eine Gruppe von Freunden.", date: "2025-07" },
      { name: "Femke Jansen", rating: 4, text: "Ruime boot met muziekinstallatie. Leuk voor een dagje uit met vrienden.", date: "2025-08" },
    ],
  },
  "mingolla-brava-19": {
    average: 4.9, count: 18,
    reviews: [
      { name: "Miguel Angel Ruiz", rating: 5, text: "Barco con licencia pero vale la pena. Potente y cómodo, llegamos hasta Tossa de Mar.", date: "2024-08" },
      { name: "Tom Barker", rating: 5, text: "Powerful boat, reached Tossa de Mar easily. GPS and fish finder were very handy.", date: "2025-07" },
      { name: "Alessandra Moretti", rating: 5, text: "Barca potente e comoda. Siamo arrivati fino a Tossa de Mar senza problemi.", date: "2025-08" },
      { name: "Hans Schneider", rating: 5, text: "Leistungsstarkes Boot. GPS und Echolot sind sehr nützlich. Tossa de Mar war wunderbar.", date: "2025-08" },
      { name: "Monika Weber", rating: 5, text: "Tolles Boot mit viel Leistung. Der GPS ist sehr praktisch für die Navigation.", date: "2025-07" },
    ],
  },
  "trimarchi-57s": {
    average: 4.9, count: 16,
    reviews: [
      { name: "Pedro Sanchez Vidal", rating: 5, text: "El Trimarchi es una pasada. Potente, cómodo y con un GPS excelente. Llegamos a Tossa sin problemas.", date: "2025-06" },
      { name: "Sarah Thompson", rating: 5, text: "Fantastic boat with great power. The Bluetooth radio was a lovely touch. Best day of our holiday.", date: "2025-06" },
      { name: "Ana Belen Torres", rating: 5, text: "Barco premium, se nota la diferencia. Muy cómodo y con equipamiento completo.", date: "2025-07" },
      { name: "Klaus Fischer", rating: 5, text: "Premium-Boot mit toller Ausstattung. Bluetooth-Radio, GPS, alles dabei. Sehr empfehlenswert.", date: "2025-06" },
      { name: "Laura Garcia", rating: 5, text: "El mejor barco de la flota. Potente, espacioso y con todo el equipamiento necesario.", date: "2025-08" },
    ],
  },
  "pacific-craft-625": {
    average: 4.9, count: 14,
    reviews: [
      { name: "Marta Fernandez", rating: 5, text: "El Pacific Craft es impresionante. Con la potencia que tiene, llegamos hasta calas inaccesibles.", date: "2025-07" },
      { name: "Philippe Moreau", rating: 5, text: "Magnifique bateau, très puissant. Nous sommes allés jusqu'à Tossa de Mar et au-delà.", date: "2025-07" },
      { name: "Richard Dawson", rating: 5, text: "Top-class boat. Very powerful, reached hidden coves easily. Worth every penny.", date: "2025-08" },
      { name: "Marco Rossetti", rating: 5, text: "La barca più bella della flotta. Molto potente e comoda per escursioni lunghe.", date: "2025-08" },
      { name: "Thomas Mueller", rating: 5, text: "Erstklassiges Boot für längere Ausflüge. Sehr leistungsstark und komfortabel.", date: "2025-07" },
    ],
  },
  "excursion-privada": {
    average: 5.0, count: 12,
    reviews: [
      { name: "Ana Belen Torres", rating: 5, text: "Experiencia única. El patrón nos llevó a calas secretas que jamás habríamos encontrado solos.", date: "2025-07" },
      { name: "James Wilson", rating: 5, text: "Incredible experience. The captain knew every hidden cove. Perfect for our anniversary.", date: "2025-08" },
      { name: "Sophie Martin", rating: 5, text: "Expérience inoubliable. Le capitaine connaît chaque crique secrète. Parfait pour les célébrations.", date: "2025-08" },
      { name: "Giulia Bianchi", rating: 5, text: "Esperienza fantastica. Il capitano ci ha portato in calette segrete bellissime.", date: "2025-07" },
      { name: "Sabine Hoffmann", rating: 5, text: "Unvergessliches Erlebnis. Der Kapitän kennt jede versteckte Bucht. Perfekt für Feiern.", date: "2025-08" },
    ],
  },
};

export function getBoatReviewStats(boatId: string): { average: number; count: number; reviews: BoatReviewEntry[] } | null {
  return BOAT_REVIEW_DATA[boatId] || null;
}
