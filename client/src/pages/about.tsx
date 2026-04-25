import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Anchor,
  Shield,
  Star,
  MapPin,
  Phone,
  Mail,
  Clock,
  Users,
  Ship,
  MessageCircle,
  ChevronRight,
  Globe,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { SEO } from "@/components/SEO";
import { generateBreadcrumbSchema } from "@/utils/seo-config";
import { useLanguage, type Language } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { openWhatsApp, createBookingMessage } from "@/utils/whatsapp";
import { trackPhoneClick } from "@/utils/analytics";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
} from "@shared/businessProfile";

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-[opacity,transform,filter] duration-700 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-6 blur-[2px]"} ${className}`}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline translations (8 languages)
// ---------------------------------------------------------------------------
const t: Record<Language, {
  title: string;
  metaTitle: string;
  metaDescription: string;
  heroHeading: string;
  heroSubheading: string;
  badgeFamily: string;
  badgeFleet: string;
  badgeReviews: string;
  whoWeAreTitle: string;
  whoWeAreP1: string;
  whoWeAreP2: string;
  whoWeAreP3: string;
  fleetTitle: string;
  fleetIntro: string;
  fleetLicenseFree: string;
  fleetLicenseFreeDesc: string;
  fleetLicensed: string;
  fleetLicensedDesc: string;
  fleetExcursion: string;
  fleetExcursionDesc: string;
  fleetIncluded: string;
  whyTitle: string;
  whySafety: string;
  whySafetyDesc: string;
  whyLanguages: string;
  whyLanguagesDesc: string;
  whyTransparency: string;
  whyTransparencyDesc: string;
  whyExperience: string;
  whyExperienceDesc: string;
  whyReviews: string;
  whyReviewsDesc: string;
  whyLocal: string;
  whyLocalDesc: string;
  locationTitle: string;
  locationP1: string;
  locationP2: string;
  locationAddress: string;
  locationCoords: string;
  locationSeason: string;
  locationHours: string;
  contactTitle: string;
  contactP1: string;
  ctaHeading: string;
  ctaText: string;
  ctaWhatsApp: string;
  ctaFleet: string;
  linksTitle: string;
  linkFleet: string;
  linkPricing: string;
  linkFaq: string;
  linkTestimonials: string;
  linkRoutes: string;
}> = {
  es: {
    title: "Sobre Nosotros",
    metaTitle: "Sobre Nosotros - Costa Brava Rent a Boat | Alquiler de Barcos en Blanes",
    metaDescription: "Costa Brava Rent a Boat es una empresa familiar de alquiler de barcos en el Puerto de Blanes, Girona. La flota m\u00e1s grande de Blanes con 9 barcos, 4.8 estrellas en Google Maps y m\u00e1s de 300 rese\u00f1as. Temporada de abril a octubre.",
    heroHeading: "Sobre Costa Brava Rent a Boat",
    heroSubheading: "Empresa familiar de alquiler de barcos en el Puerto de Blanes, Costa Brava. La flota m\u00e1s grande de Blanes con 9 embarcaciones y m\u00e1s de 300 rese\u00f1as positivas en Google Maps.",
    badgeFamily: "Empresa familiar",
    badgeFleet: "9 barcos - la flota m\u00e1s grande de Blanes",
    badgeReviews: "4.8 estrellas - 300+ rese\u00f1as en Google",
    whoWeAreTitle: "Quienes somos",
    whoWeAreP1: "Costa Brava Rent a Boat es una empresa familiar con base en el Puerto de Blanes, en la comarca de la Selva, provincia de Girona, Catalu\u00f1a, Espa\u00f1a. Operamos la flota de alquiler de barcos m\u00e1s grande de Blanes, con un total de 9 embarcaciones preparadas para que cualquier persona pueda disfrutar del mar Mediterr\u00e1neo en la Costa Brava.",
    whoWeAreP2: "Nuestra misi\u00f3n es hacer accesible la experiencia de navegar por la Costa Brava a todo el mundo, sin necesidad de experiencia previa ni licencia n\u00e1utica. Creemos que descubrir calas escondidas, ba\u00f1arse en aguas cristalinas y explorar la costa desde el mar deber\u00eda ser algo al alcance de cualquier familia, pareja o grupo de amigos.",
    whoWeAreP3: "Cada temporada, de abril a octubre, recibimos clientes de toda Europa y del mundo. Nuestro equipo habla 8 idiomas (espa\u00f1ol, ingl\u00e9s, catal\u00e1n, franc\u00e9s, alem\u00e1n, holand\u00e9s, italiano y ruso), lo que nos permite ofrecer un servicio personalizado a cada cliente, empezando por la sesi\u00f3n de seguridad de 15 minutos en su idioma antes de cada salida.",
    fleetTitle: "Nuestra flota",
    fleetIntro: "Con 9 barcos, somos la empresa de alquiler de embarcaciones m\u00e1s grande de Blanes. Nuestra flota est\u00e1 dise\u00f1ada para cubrir todas las necesidades: desde salidas familiares sin licencia hasta navegaci\u00f3n deportiva con barcos de hasta 150 CV.",
    fleetLicenseFree: "5 barcos sin licencia",
    fleetLicenseFreeDesc: "No necesitas ning\u00fan t\u00edtulo n\u00e1utico. Barcos de hasta 15 CV, f\u00e1ciles de manejar y seguros. Ideales para familias, parejas y principiantes. Todos los alquileres sin licencia incluyen gasolina, seguro, IVA, amarre, limpieza y equipo de seguridad. Antes de salir, te damos una sesi\u00f3n de formaci\u00f3n de 15 minutos en tu idioma.",
    fleetLicensed: "3 barcos con licencia",
    fleetLicensedDesc: "Para navegantes con t\u00edtulo n\u00e1utico que buscan m\u00e1s potencia y autonom\u00eda. Barcos de hasta 150 CV para explorar la costa m\u00e1s all\u00e1 de las calas cercanas. Incluyen seguro, amarre y equipo de seguridad. El combustible no est\u00e1 incluido en los barcos con licencia.",
    fleetExcursion: "1 excursi\u00f3n privada con capit\u00e1n",
    fleetExcursionDesc: "Para quienes prefieren relajarse y dejarse llevar. Un patr\u00f3n profesional os lleva por las mejores calas de la Costa Brava mientras vosotros disfrut\u00e1is del paseo, el ba\u00f1o y el sol. Ideal para celebraciones, parejas o grupos que quieren una experiencia sin preocupaciones.",
    fleetIncluded: "Incluido en barcos sin licencia: gasolina, seguro, IVA, amarre, limpieza, chalecos salvavidas y equipo de seguridad.",
    whyTitle: "Por qu\u00e9 elegir Costa Brava Rent a Boat",
    whySafety: "Seguridad como prioridad",
    whySafetyDesc: "Antes de cada salida, dedicamos 15 minutos a explicarte el manejo del barco, las zonas de navegaci\u00f3n, las normas de seguridad y a resolver todas tus dudas. Todos los barcos llevan chalecos salvavidas homologados, incluidos tallas infantiles, escalera de ba\u00f1o y equipo de emergencia.",
    whyLanguages: "8 idiomas",
    whyLanguagesDesc: "Nuestro equipo habla espa\u00f1ol, ingl\u00e9s, catal\u00e1n, franc\u00e9s, alem\u00e1n, holand\u00e9s, italiano y ruso. La sesi\u00f3n de seguridad y toda la atenci\u00f3n al cliente se realizan en tu idioma.",
    whyTransparency: "Precios transparentes",
    whyTransparencyDesc: "En los barcos sin licencia, el precio que ves es el precio final. Incluye gasolina, seguro, IVA, amarre, limpieza y equipo de seguridad. Sin costes ocultos ni sorpresas al volver al puerto.",
    whyExperience: "F\u00e1cil para principiantes",
    whyExperienceDesc: "No necesitas experiencia previa para alquilar un barco sin licencia. Los barcos son estables, f\u00e1ciles de manejar y tienen velocidad limitada. Miles de familias con ni\u00f1os navegan con nosotros cada temporada sin ning\u00fan problema.",
    whyReviews: "4.8 estrellas en Google Maps",
    whyReviewsDesc: "Contamos con m\u00e1s de 300 rese\u00f1as en Google Maps con una valoraci\u00f3n media de 4.8 sobre 5. Nuestros clientes destacan la amabilidad del equipo, la calidad de los barcos y la experiencia en general. Puedes leer las rese\u00f1as directamente en Google Maps.",
    whyLocal: "Conocimiento local",
    whyLocalDesc: "Conocemos cada cala, cada rinc\u00f3n y cada corriente de la costa entre Blanes, Lloret de Mar y Tossa de Mar. Te recomendamos las mejores rutas seg\u00fan las condiciones del d\u00eda, la duraci\u00f3n de tu alquiler y tus preferencias.",
    locationTitle: "Nuestra ubicaci\u00f3n",
    locationP1: "Estamos ubicados en el Puerto de Blanes, un puerto pesquero y deportivo en la localidad de Blanes, el municipio m\u00e1s meridional de la Costa Brava. Blanes se encuentra a 60 km al norte de Barcelona y es f\u00e1cilmente accesible por la autopista AP-7 y por la l\u00ednea de tren Rodalies (R1).",
    locationP2: "El puerto est\u00e1 junto al centro de Blanes, a 5 minutos a pie del paseo mar\u00edtimo y de la playa principal. Hay aparcamiento gratuito y de pago cerca del puerto. La oficina est\u00e1 en el mismo muelle donde se encuentran los barcos.",
    locationAddress: "Puerto de Blanes, Blanes, Girona, Espa\u00f1a",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Temporada: abril a octubre, todos los d\u00edas",
    locationHours: "Horario: 09:00 - 20:00",
    contactTitle: "Contacto",
    contactP1: "Puedes contactarnos por tel\u00e9fono, WhatsApp o email. Respondemos en tu idioma y normalmente contestamos en menos de una hora durante la temporada.",
    ctaHeading: "Ven a navegar con nosotros",
    ctaText: "Reserva tu barco en el Puerto de Blanes y descubre la Costa Brava desde el mar. Salidas de abril a octubre, todos los d\u00edas de 09:00 a 20:00.",
    ctaWhatsApp: "Reservar por WhatsApp",
    ctaFleet: "Ver nuestra flota",
    linksTitle: "Descubre m\u00e1s",
    linkFleet: "Barcos sin licencia",
    linkPricing: "Precios y tarifas",
    linkFaq: "Preguntas frecuentes",
    linkTestimonials: "Opiniones de clientes",
    linkRoutes: "Rutas mar\u00edtimas",
  },
  en: {
    title: "About Us",
    metaTitle: "About Us - Costa Brava Rent a Boat | Boat Rental in Blanes",
    metaDescription: "Costa Brava Rent a Boat is a family-run boat rental business in the Port of Blanes, Girona. The largest fleet in Blanes with 9 boats, 4.8 stars on Google Maps and 300+ reviews. Season from April to October.",
    heroHeading: "About Costa Brava Rent a Boat",
    heroSubheading: "Family-run boat rental business in the Port of Blanes, Costa Brava. The largest fleet in Blanes with 9 boats and over 300 positive reviews on Google Maps.",
    badgeFamily: "Family business",
    badgeFleet: "9 boats - the largest fleet in Blanes",
    badgeReviews: "4.8 stars - 300+ reviews on Google",
    whoWeAreTitle: "Who we are",
    whoWeAreP1: "Costa Brava Rent a Boat is a family-run business based in the Port of Blanes, in the Selva county, province of Girona, Catalonia, Spain. We operate the largest boat rental fleet in Blanes, with a total of 9 vessels ready for anyone to enjoy the Mediterranean Sea on the Costa Brava.",
    whoWeAreP2: "Our mission is to make the experience of sailing along the Costa Brava accessible to everyone, without prior experience or a boating licence. We believe that discovering hidden coves, swimming in crystal-clear waters and exploring the coastline from the sea should be within reach of any family, couple or group of friends.",
    whoWeAreP3: "Every season, from April to October, we welcome clients from all over Europe and beyond. Our team speaks 8 languages (Spanish, English, Catalan, French, German, Dutch, Italian and Russian), allowing us to provide personalised service to every client, starting with the 15-minute safety briefing in your language before every departure.",
    fleetTitle: "Our fleet",
    fleetIntro: "With 9 boats, we are the largest boat rental company in Blanes. Our fleet is designed to cover every need: from family outings without a licence to sport boating with boats up to 150 HP.",
    fleetLicenseFree: "5 licence-free boats",
    fleetLicenseFreeDesc: "No boating licence needed. Boats up to 15 HP, easy to handle and safe. Ideal for families, couples and beginners. All licence-free rentals include fuel, insurance, VAT, mooring, cleaning and safety equipment. Before departure, we provide a 15-minute training session in your language.",
    fleetLicensed: "3 licensed motorboats",
    fleetLicensedDesc: "For experienced sailors with a boating licence who want more power and autonomy. Boats up to 150 HP to explore the coast beyond nearby coves. Includes insurance, mooring and safety equipment. Fuel is not included for licensed boats.",
    fleetExcursion: "1 private excursion with captain",
    fleetExcursionDesc: "For those who prefer to sit back and relax. A professional skipper takes you to the best coves of the Costa Brava while you enjoy the ride, swim and sunshine. Perfect for celebrations, couples or groups who want a worry-free experience.",
    fleetIncluded: "Included with licence-free boats: fuel, insurance, VAT, mooring, cleaning, life jackets and safety equipment.",
    whyTitle: "Why choose Costa Brava Rent a Boat",
    whySafety: "Safety first",
    whySafetyDesc: "Before every departure, we spend 15 minutes explaining how to operate the boat, the navigation zones, safety rules and answering all your questions. All boats carry certified life jackets, including children's sizes, a swim ladder and emergency equipment.",
    whyLanguages: "8 languages",
    whyLanguagesDesc: "Our team speaks Spanish, English, Catalan, French, German, Dutch, Italian and Russian. The safety briefing and all customer service is provided in your language.",
    whyTransparency: "Transparent pricing",
    whyTransparencyDesc: "For licence-free boats, the price you see is the final price. It includes fuel, insurance, VAT, mooring, cleaning and safety equipment. No hidden costs or surprises when you return to port.",
    whyExperience: "Easy for beginners",
    whyExperienceDesc: "No prior experience needed to rent a licence-free boat. The boats are stable, easy to handle and speed-limited. Thousands of families with children sail with us every season without any issues.",
    whyReviews: "4.8 stars on Google Maps",
    whyReviewsDesc: "We have over 300 reviews on Google Maps with an average rating of 4.8 out of 5. Our clients highlight the friendliness of the team, the quality of the boats and the overall experience. You can read the reviews directly on Google Maps.",
    whyLocal: "Local knowledge",
    whyLocalDesc: "We know every cove, every corner and every current along the coast between Blanes, Lloret de Mar and Tossa de Mar. We recommend the best routes based on the day's conditions, the duration of your rental and your preferences.",
    locationTitle: "Our location",
    locationP1: "We are located in the Port of Blanes, a fishing and marina port in the town of Blanes, the southernmost municipality of the Costa Brava. Blanes is 60 km north of Barcelona and easily accessible via the AP-7 motorway and the Rodalies commuter train line (R1).",
    locationP2: "The port is next to the town centre of Blanes, a 5-minute walk from the promenade and the main beach. Free and paid parking is available near the port. Our office is on the same dock where the boats are moored.",
    locationAddress: "Port of Blanes, Blanes, Girona, Spain",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Season: April to October, every day",
    locationHours: "Hours: 09:00 - 20:00",
    contactTitle: "Contact",
    contactP1: "You can reach us by phone, WhatsApp or email. We reply in your language and typically respond within one hour during the season.",
    ctaHeading: "Come sail with us",
    ctaText: "Book your boat in the Port of Blanes and discover the Costa Brava from the sea. Departures from April to October, every day from 09:00 to 20:00.",
    ctaWhatsApp: "Book via WhatsApp",
    ctaFleet: "See our fleet",
    linksTitle: "Discover more",
    linkFleet: "Licence-free boats",
    linkPricing: "Prices and rates",
    linkFaq: "Frequently asked questions",
    linkTestimonials: "Customer reviews",
    linkRoutes: "Maritime routes",
  },
  ca: {
    title: "Sobre Nosaltres",
    metaTitle: "Sobre Nosaltres - Costa Brava Rent a Boat | Lloguer de Vaixells a Blanes",
    metaDescription: "Costa Brava Rent a Boat \u00e9s una empresa familiar de lloguer de vaixells al Port de Blanes, Girona. La flota m\u00e9s gran de Blanes amb 9 vaixells, 4.8 estrelles a Google Maps i m\u00e9s de 300 ressenyes.",
    heroHeading: "Sobre Costa Brava Rent a Boat",
    heroSubheading: "Empresa familiar de lloguer de vaixells al Port de Blanes, Costa Brava. La flota m\u00e9s gran de Blanes amb 9 embarcacions i m\u00e9s de 300 ressenyes positives a Google Maps.",
    badgeFamily: "Empresa familiar",
    badgeFleet: "9 vaixells - la flota m\u00e9s gran de Blanes",
    badgeReviews: "4.8 estrelles - 300+ ressenyes a Google",
    whoWeAreTitle: "Qui som",
    whoWeAreP1: "Costa Brava Rent a Boat \u00e9s una empresa familiar amb base al Port de Blanes, a la comarca de la Selva, prov\u00edncia de Girona, Catalunya, Espanya. Operem la flota de lloguer de vaixells m\u00e9s gran de Blanes, amb un total de 9 embarcacions preparades perqu\u00e8 qualsevol persona pugui gaudir del mar Mediterrani a la Costa Brava.",
    whoWeAreP2: "La nostra missi\u00f3 \u00e9s fer accessible l'experi\u00e8ncia de navegar per la Costa Brava a tothom, sense necessitat d'experi\u00e8ncia pr\u00e8via ni llic\u00e8ncia n\u00e0utica.",
    whoWeAreP3: "Cada temporada, d'abril a octubre, rebem clients de tota Europa i del m\u00f3n. El nostre equip parla 8 idiomes (castell\u00e0, angl\u00e8s, catal\u00e0, franc\u00e8s, alemany, holand\u00e8s, itali\u00e0 i rus).",
    fleetTitle: "La nostra flota",
    fleetIntro: "Amb 9 vaixells, som l'empresa de lloguer d'embarcacions m\u00e9s gran de Blanes.",
    fleetLicenseFree: "5 vaixells sense llic\u00e8ncia",
    fleetLicenseFreeDesc: "No necessites cap t\u00edtol n\u00e0utic. Vaixells de fins a 15 CV, f\u00e0cils de manejar i segurs. Tots els lloguers sense llic\u00e8ncia inclouen gasolina, asseguran\u00e7a, IVA, amarratge, neteja i equip de seguretat.",
    fleetLicensed: "3 vaixells amb llic\u00e8ncia",
    fleetLicensedDesc: "Per a navegants amb t\u00edtol n\u00e0utic que busquen m\u00e9s pot\u00e8ncia i autonomia. Vaixells de fins a 150 CV. El combustible no est\u00e0 incl\u00f2s.",
    fleetExcursion: "1 excursi\u00f3 privada amb patr\u00f3",
    fleetExcursionDesc: "Un patr\u00f3 professional us porta per les millors cales de la Costa Brava mentre gaudiu del passeig.",
    fleetIncluded: "Incl\u00f2s en vaixells sense llic\u00e8ncia: gasolina, asseguran\u00e7a, IVA, amarratge, neteja, armilles salvavides i equip de seguretat.",
    whyTitle: "Per qu\u00e8 triar Costa Brava Rent a Boat",
    whySafety: "Seguretat com a prioritat",
    whySafetyDesc: "Abans de cada sortida, dediquem 15 minuts a explicar-te el maneig del vaixell i les normes de seguretat.",
    whyLanguages: "8 idiomes",
    whyLanguagesDesc: "El nostre equip parla castell\u00e0, angl\u00e8s, catal\u00e0, franc\u00e8s, alemany, holand\u00e8s, itali\u00e0 i rus.",
    whyTransparency: "Preus transparents",
    whyTransparencyDesc: "En els vaixells sense llic\u00e8ncia, el preu que veus \u00e9s el preu final. Sense costos ocults.",
    whyExperience: "F\u00e0cil per a principiants",
    whyExperienceDesc: "No necessites experi\u00e8ncia pr\u00e8via per llogar un vaixell sense llic\u00e8ncia.",
    whyReviews: "4.8 estrelles a Google Maps",
    whyReviewsDesc: "M\u00e9s de 300 ressenyes a Google Maps amb una valoraci\u00f3 mitjana de 4.8 sobre 5.",
    whyLocal: "Coneixement local",
    whyLocalDesc: "Coneixem cada cala i cada rac\u00f3 de la costa entre Blanes, Lloret de Mar i Tossa de Mar.",
    locationTitle: "La nostra ubicaci\u00f3",
    locationP1: "Estem al Port de Blanes, a 60 km al nord de Barcelona, f\u00e0cilment accessible per l'autopista AP-7 i la l\u00ednia de tren Rodalies (R1).",
    locationP2: "El port \u00e9s al costat del centre de Blanes, a 5 minuts a peu del passeig mar\u00edtim.",
    locationAddress: "Port de Blanes, Blanes, Girona, Espanya",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Temporada: abril a octubre, cada dia",
    locationHours: "Horari: 09:00 - 20:00",
    contactTitle: "Contacte",
    contactP1: "Pots contactar-nos per tel\u00e8fon, WhatsApp o correu electr\u00f2nic. Responem en el teu idioma.",
    ctaHeading: "Vine a navegar amb nosaltres",
    ctaText: "Reserva el teu vaixell al Port de Blanes i descobreix la Costa Brava des del mar.",
    ctaWhatsApp: "Reservar per WhatsApp",
    ctaFleet: "Veure la nostra flota",
    linksTitle: "Descobreix m\u00e9s",
    linkFleet: "Vaixells sense llic\u00e8ncia",
    linkPricing: "Preus i tarifes",
    linkFaq: "Preguntes freq\u00fcents",
    linkTestimonials: "Opinions de clients",
    linkRoutes: "Rutes mar\u00edtimes",
  },
  fr: {
    title: "\u00c0 propos de nous",
    metaTitle: "\u00c0 propos - Costa Brava Rent a Boat | Location de Bateaux \u00e0 Blanes",
    metaDescription: "Costa Brava Rent a Boat est une entreprise familiale de location de bateaux au Port de Blanes, Girona. La plus grande flotte de Blanes avec 9 bateaux, 4.8 \u00e9toiles sur Google Maps et plus de 300 avis.",
    heroHeading: "\u00c0 propos de Costa Brava Rent a Boat",
    heroSubheading: "Entreprise familiale de location de bateaux au Port de Blanes, Costa Brava. La plus grande flotte de Blanes avec 9 bateaux et plus de 300 avis positifs sur Google Maps.",
    badgeFamily: "Entreprise familiale",
    badgeFleet: "9 bateaux - la plus grande flotte de Blanes",
    badgeReviews: "4.8 \u00e9toiles - 300+ avis sur Google",
    whoWeAreTitle: "Qui sommes-nous",
    whoWeAreP1: "Costa Brava Rent a Boat est une entreprise familiale bas\u00e9e au Port de Blanes, dans la province de Girona, Catalogne, Espagne. Nous exploitons la plus grande flotte de location de bateaux \u00e0 Blanes, avec 9 embarcations pr\u00eates \u00e0 vous faire d\u00e9couvrir la mer M\u00e9diterran\u00e9e sur la Costa Brava.",
    whoWeAreP2: "Notre mission est de rendre l'exp\u00e9rience de navigation sur la Costa Brava accessible \u00e0 tous, sans exp\u00e9rience pr\u00e9alable ni permis bateau.",
    whoWeAreP3: "Chaque saison, d'avril \u00e0 octobre, nous accueillons des clients de toute l'Europe. Notre \u00e9quipe parle 8 langues (espagnol, anglais, catalan, fran\u00e7ais, allemand, n\u00e9erlandais, italien et russe).",
    fleetTitle: "Notre flotte",
    fleetIntro: "Avec 9 bateaux, nous sommes la plus grande entreprise de location de bateaux \u00e0 Blanes.",
    fleetLicenseFree: "5 bateaux sans permis",
    fleetLicenseFreeDesc: "Aucun permis bateau n\u00e9cessaire. Bateaux jusqu'\u00e0 15 CV, faciles \u00e0 manier et s\u00fbrs. Toutes les locations sans permis incluent le carburant, l'assurance, la TVA, l'amarrage, le nettoyage et l'\u00e9quipement de s\u00e9curit\u00e9.",
    fleetLicensed: "3 bateaux avec permis",
    fleetLicensedDesc: "Pour les navigateurs avec permis bateau qui souhaitent plus de puissance. Bateaux jusqu'\u00e0 150 CV. Le carburant n'est pas inclus.",
    fleetExcursion: "1 excursion priv\u00e9e avec capitaine",
    fleetExcursionDesc: "Un skipper professionnel vous emm\u00e8ne dans les plus belles criques de la Costa Brava.",
    fleetIncluded: "Inclus avec les bateaux sans permis : carburant, assurance, TVA, amarrage, nettoyage, gilets de sauvetage et \u00e9quipement de s\u00e9curit\u00e9.",
    whyTitle: "Pourquoi choisir Costa Brava Rent a Boat",
    whySafety: "La s\u00e9curit\u00e9 en priorit\u00e9",
    whySafetyDesc: "Avant chaque d\u00e9part, nous consacrons 15 minutes \u00e0 vous expliquer le maniement du bateau et les r\u00e8gles de s\u00e9curit\u00e9.",
    whyLanguages: "8 langues",
    whyLanguagesDesc: "Notre \u00e9quipe parle espagnol, anglais, catalan, fran\u00e7ais, allemand, n\u00e9erlandais, italien et russe.",
    whyTransparency: "Prix transparents",
    whyTransparencyDesc: "Pour les bateaux sans permis, le prix affich\u00e9 est le prix final. Pas de frais cach\u00e9s.",
    whyExperience: "Facile pour les d\u00e9butants",
    whyExperienceDesc: "Aucune exp\u00e9rience pr\u00e9alable n\u00e9cessaire pour louer un bateau sans permis.",
    whyReviews: "4.8 \u00e9toiles sur Google Maps",
    whyReviewsDesc: "Plus de 300 avis sur Google Maps avec une note moyenne de 4.8 sur 5.",
    whyLocal: "Connaissance locale",
    whyLocalDesc: "Nous connaissons chaque crique entre Blanes, Lloret de Mar et Tossa de Mar.",
    locationTitle: "Notre emplacement",
    locationP1: "Nous sommes situ\u00e9s au Port de Blanes, \u00e0 60 km au nord de Barcelone, facilement accessible par l'autoroute AP-7 et la ligne de train Rodalies (R1).",
    locationP2: "Le port est \u00e0 c\u00f4t\u00e9 du centre-ville de Blanes, \u00e0 5 minutes \u00e0 pied de la promenade maritime.",
    locationAddress: "Port de Blanes, Blanes, Girona, Espagne",
    locationCoords: "GPS : 41.6722504 N, 2.7978625 E",
    locationSeason: "Saison : avril \u00e0 octobre, tous les jours",
    locationHours: "Horaires : 09:00 - 20:00",
    contactTitle: "Contact",
    contactP1: "Vous pouvez nous contacter par t\u00e9l\u00e9phone, WhatsApp ou email. Nous r\u00e9pondons dans votre langue.",
    ctaHeading: "Venez naviguer avec nous",
    ctaText: "R\u00e9servez votre bateau au Port de Blanes et d\u00e9couvrez la Costa Brava depuis la mer.",
    ctaWhatsApp: "R\u00e9server par WhatsApp",
    ctaFleet: "Voir notre flotte",
    linksTitle: "D\u00e9couvrez plus",
    linkFleet: "Bateaux sans permis",
    linkPricing: "Prix et tarifs",
    linkFaq: "Questions fr\u00e9quentes",
    linkTestimonials: "Avis clients",
    linkRoutes: "Routes maritimes",
  },
  de: {
    title: "\u00dcber uns",
    metaTitle: "\u00dcber uns - Costa Brava Rent a Boat | Bootsvermietung in Blanes",
    metaDescription: "Costa Brava Rent a Boat ist ein familiengef\u00fchrtes Bootsvermietungsunternehmen im Hafen von Blanes, Girona. Die gr\u00f6\u00dfte Flotte in Blanes mit 9 Booten, 4.8 Sterne bei Google Maps und \u00fcber 300 Bewertungen.",
    heroHeading: "\u00dcber Costa Brava Rent a Boat",
    heroSubheading: "Familiengef\u00fchrte Bootsvermietung im Hafen von Blanes, Costa Brava. Die gr\u00f6\u00dfte Flotte in Blanes mit 9 Booten und \u00fcber 300 positiven Bewertungen bei Google Maps.",
    badgeFamily: "Familienunternehmen",
    badgeFleet: "9 Boote - die gr\u00f6\u00dfte Flotte in Blanes",
    badgeReviews: "4.8 Sterne - 300+ Bewertungen bei Google",
    whoWeAreTitle: "Wer wir sind",
    whoWeAreP1: "Costa Brava Rent a Boat ist ein familiengef\u00fchrtes Unternehmen mit Sitz im Hafen von Blanes, in der Provinz Girona, Katalonien, Spanien. Wir betreiben die gr\u00f6\u00dfte Bootsvermietungsflotte in Blanes mit insgesamt 9 Booten.",
    whoWeAreP2: "Unsere Mission ist es, das Segelerlebnis an der Costa Brava f\u00fcr jeden zug\u00e4nglich zu machen, ohne Vorkenntnisse oder Bootsf\u00fchrerschein.",
    whoWeAreP3: "Jede Saison, von April bis Oktober, begr\u00fc\u00dfen wir Kunden aus ganz Europa. Unser Team spricht 8 Sprachen (Spanisch, Englisch, Katalanisch, Franz\u00f6sisch, Deutsch, Niederl\u00e4ndisch, Italienisch und Russisch).",
    fleetTitle: "Unsere Flotte",
    fleetIntro: "Mit 9 Booten sind wir die gr\u00f6\u00dfte Bootsvermietung in Blanes.",
    fleetLicenseFree: "5 führerscheinfreie Boote",
    fleetLicenseFreeDesc: "Kein Bootsführerschein erforderlich. Boote bis 15 PS, einfach zu bedienen und sicher. Alle Mieten ohne Führerschein beinhalten Treibstoff, Versicherung, MwSt., Anlegegebühr, Reinigung und Sicherheitsausrüstung.",
    fleetLicensed: "3 Boote mit Führerschein",
    fleetLicensedDesc: "Für erfahrene Segler mit Bootsführerschein. Boote bis 150 PS. Treibstoff ist nicht inbegriffen.",
    fleetExcursion: "1 Privatausflug mit Kapitän",
    fleetExcursionDesc: "Ein professioneller Skipper bringt Sie zu den schönsten Buchten der Costa Brava.",
    fleetIncluded: "Bei führerscheinfreien Booten inklusive: Treibstoff, Versicherung, MwSt., Anlegegebühr, Reinigung, Schwimmwesten und Sicherheitsausrüstung.",
    whyTitle: "Warum Costa Brava Rent a Boat wählen",
    whySafety: "Sicherheit als Priorität",
    whySafetyDesc: "Vor jeder Abfahrt erklären wir Ihnen 15 Minuten lang die Bedienung des Bootes und die Sicherheitsregeln.",
    whyLanguages: "8 Sprachen",
    whyLanguagesDesc: "Unser Team spricht Spanisch, Englisch, Katalanisch, Französisch, Deutsch, Niederländisch, Italienisch und Russisch.",
    whyTransparency: "Transparente Preise",
    whyTransparencyDesc: "Bei führerscheinfreien Booten ist der angezeigte Preis der Endpreis. Keine versteckten Kosten.",
    whyExperience: "Einfach für Anfänger",
    whyExperienceDesc: "Keine Vorkenntnisse nötig, um ein führerscheinfreies Boot zu mieten.",
    whyReviews: "4.8 Sterne bei Google Maps",
    whyReviewsDesc: "Über 300 Bewertungen bei Google Maps mit einer Durchschnittsbewertung von 4.8 von 5.",
    whyLocal: "Lokales Wissen",
    whyLocalDesc: "Wir kennen jede Bucht zwischen Blanes, Lloret de Mar und Tossa de Mar.",
    locationTitle: "Unser Standort",
    locationP1: "Wir befinden uns im Hafen von Blanes, 60 km nördlich von Barcelona, leicht erreichbar über die Autobahn AP-7 und die Rodalies-Zuglinie (R1).",
    locationP2: "Der Hafen liegt neben dem Stadtzentrum von Blanes, 5 Gehminuten von der Strandpromenade entfernt.",
    locationAddress: "Hafen von Blanes, Blanes, Girona, Spanien",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Saison: April bis Oktober, täglich",
    locationHours: "Öffnungszeiten: 09:00 - 20:00",
    contactTitle: "Kontakt",
    contactP1: "Sie können uns per Telefon, WhatsApp oder E-Mail erreichen. Wir antworten in Ihrer Sprache.",
    ctaHeading: "Kommen Sie segeln mit uns",
    ctaText: "Buchen Sie Ihr Boot im Hafen von Blanes und entdecken Sie die Costa Brava vom Meer aus.",
    ctaWhatsApp: "Per WhatsApp buchen",
    ctaFleet: "Unsere Flotte ansehen",
    linksTitle: "Mehr entdecken",
    linkFleet: "Führerscheinfreie Boote",
    linkPricing: "Preise und Tarife",
    linkFaq: "Häufige Fragen",
    linkTestimonials: "Kundenbewertungen",
    linkRoutes: "Seerouten",
  },
  nl: {
    title: "Over ons",
    metaTitle: "Over ons - Costa Brava Rent a Boat | Bootverhuur in Blanes",
    metaDescription: "Costa Brava Rent a Boat is een familiebedrijf voor bootverhuur in de haven van Blanes, Girona. De grootste vloot van Blanes met 9 boten, 4.8 sterren op Google Maps en meer dan 300 beoordelingen.",
    heroHeading: "Over Costa Brava Rent a Boat",
    heroSubheading: "Familiebedrijf voor bootverhuur in de haven van Blanes, Costa Brava. De grootste vloot van Blanes met 9 boten en meer dan 300 positieve beoordelingen op Google Maps.",
    badgeFamily: "Familiebedrijf",
    badgeFleet: "9 boten - de grootste vloot van Blanes",
    badgeReviews: "4.8 sterren - 300+ beoordelingen op Google",
    whoWeAreTitle: "Wie zijn wij",
    whoWeAreP1: "Costa Brava Rent a Boat is een familiebedrijf gevestigd in de haven van Blanes, in de provincie Girona, Cataloni\u00eb, Spanje. Wij beheren de grootste bootverhuurvloot van Blanes met 9 boten.",
    whoWeAreP2: "Onze missie is om de ervaring van varen langs de Costa Brava toegankelijk te maken voor iedereen, zonder ervaring of vaarbewijs.",
    whoWeAreP3: "Elk seizoen, van april tot oktober, verwelkomen wij klanten uit heel Europa. Ons team spreekt 8 talen (Spaans, Engels, Catalaans, Frans, Duits, Nederlands, Italiaans en Russisch).",
    fleetTitle: "Onze vloot",
    fleetIntro: "Met 9 boten zijn wij het grootste bootverhuurbedjrijf van Blanes.",
    fleetLicenseFree: "5 boten zonder vaarbewijs",
    fleetLicenseFreeDesc: "Geen vaarbewijs nodig. Boten tot 15 PK, makkelijk te besturen en veilig. Alle verhuur zonder vaarbewijs is inclusief brandstof, verzekering, BTW, aanlegkosten, reiniging en veiligheidsuitrusting.",
    fleetLicensed: "3 boten met vaarbewijs",
    fleetLicensedDesc: "Voor ervaren zeilers met vaarbewijs. Boten tot 150 PK. Brandstof is niet inbegrepen.",
    fleetExcursion: "1 privé-excursie met schipper",
    fleetExcursionDesc: "Een professionele schipper brengt u naar de mooiste baaien van de Costa Brava.",
    fleetIncluded: "Inbegrepen bij boten zonder vaarbewijs: brandstof, verzekering, BTW, aanlegkosten, reiniging, reddingsvesten en veiligheidsuitrusting.",
    whyTitle: "Waarom Costa Brava Rent a Boat kiezen",
    whySafety: "Veiligheid als prioriteit",
    whySafetyDesc: "Voor elk vertrek besteden we 15 minuten aan het uitleggen van de bediening van de boot en de veiligheidsregels.",
    whyLanguages: "8 talen",
    whyLanguagesDesc: "Ons team spreekt Spaans, Engels, Catalaans, Frans, Duits, Nederlands, Italiaans en Russisch.",
    whyTransparency: "Transparante prijzen",
    whyTransparencyDesc: "Bij boten zonder vaarbewijs is de getoonde prijs de eindprijs. Geen verborgen kosten.",
    whyExperience: "Makkelijk voor beginners",
    whyExperienceDesc: "Geen ervaring nodig om een boot zonder vaarbewijs te huren.",
    whyReviews: "4.8 sterren op Google Maps",
    whyReviewsDesc: "Meer dan 300 beoordelingen op Google Maps met een gemiddelde score van 4.8 op 5.",
    whyLocal: "Lokale kennis",
    whyLocalDesc: "Wij kennen elke baai tussen Blanes, Lloret de Mar en Tossa de Mar.",
    locationTitle: "Onze locatie",
    locationP1: "Wij bevinden ons in de haven van Blanes, 60 km ten noorden van Barcelona, makkelijk bereikbaar via de snelweg AP-7 en de Rodalies-treinlijn (R1).",
    locationP2: "De haven ligt naast het centrum van Blanes, op 5 minuten lopen van de boulevard.",
    locationAddress: "Haven van Blanes, Blanes, Girona, Spanje",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Seizoen: april tot oktober, elke dag",
    locationHours: "Openingstijden: 09:00 - 20:00",
    contactTitle: "Contact",
    contactP1: "U kunt ons bereiken per telefoon, WhatsApp of e-mail. Wij antwoorden in uw taal.",
    ctaHeading: "Kom zeilen met ons",
    ctaText: "Boek uw boot in de haven van Blanes en ontdek de Costa Brava vanaf zee.",
    ctaWhatsApp: "Boeken via WhatsApp",
    ctaFleet: "Bekijk onze vloot",
    linksTitle: "Ontdek meer",
    linkFleet: "Boten zonder vaarbewijs",
    linkPricing: "Prijzen en tarieven",
    linkFaq: "Veelgestelde vragen",
    linkTestimonials: "Klantbeoordelingen",
    linkRoutes: "Zeeroutes",
  },
  it: {
    title: "Chi siamo",
    metaTitle: "Chi siamo - Costa Brava Rent a Boat | Noleggio Barche a Blanes",
    metaDescription: "Costa Brava Rent a Boat \u00e8 un'azienda familiare di noleggio barche nel Porto di Blanes, Girona. La flotta pi\u00f9 grande di Blanes con 9 barche, 4.8 stelle su Google Maps e oltre 300 recensioni.",
    heroHeading: "Chi \u00e8 Costa Brava Rent a Boat",
    heroSubheading: "Azienda familiare di noleggio barche nel Porto di Blanes, Costa Brava. La flotta pi\u00f9 grande di Blanes con 9 imbarcazioni e oltre 300 recensioni positive su Google Maps.",
    badgeFamily: "Azienda familiare",
    badgeFleet: "9 barche - la flotta pi\u00f9 grande di Blanes",
    badgeReviews: "4.8 stelle - 300+ recensioni su Google",
    whoWeAreTitle: "Chi siamo",
    whoWeAreP1: "Costa Brava Rent a Boat \u00e8 un'azienda familiare con sede nel Porto di Blanes, nella provincia di Girona, Catalogna, Spagna. Gestiamo la flotta di noleggio barche pi\u00f9 grande di Blanes con 9 imbarcazioni.",
    whoWeAreP2: "La nostra missione \u00e8 rendere l'esperienza di navigare lungo la Costa Brava accessibile a tutti, senza esperienza o patente nautica.",
    whoWeAreP3: "Ogni stagione, da aprile a ottobre, accogliamo clienti da tutta Europa. Il nostro team parla 8 lingue (spagnolo, inglese, catalano, francese, tedesco, olandese, italiano e russo).",
    fleetTitle: "La nostra flotta",
    fleetIntro: "Con 9 barche, siamo la pi\u00f9 grande azienda di noleggio barche di Blanes.",
    fleetLicenseFree: "5 barche senza patente",
    fleetLicenseFreeDesc: "Nessuna patente nautica necessaria. Barche fino a 15 CV, facili da guidare e sicure. Tutti i noleggi senza patente includono carburante, assicurazione, IVA, ormeggio, pulizia e attrezzatura di sicurezza.",
    fleetLicensed: "3 barche con patente",
    fleetLicensedDesc: "Per navigatori con patente nautica. Barche fino a 150 CV. Il carburante non \u00e8 incluso.",
    fleetExcursion: "1 escursione privata con capitano",
    fleetExcursionDesc: "Uno skipper professionista vi porta nelle migliori calette della Costa Brava.",
    fleetIncluded: "Incluso nelle barche senza patente: carburante, assicurazione, IVA, ormeggio, pulizia, giubbotti di salvataggio e attrezzatura di sicurezza.",
    whyTitle: "Perch\u00e9 scegliere Costa Brava Rent a Boat",
    whySafety: "La sicurezza come priorit\u00e0",
    whySafetyDesc: "Prima di ogni partenza, dedichiamo 15 minuti a spiegarvi il funzionamento della barca e le regole di sicurezza.",
    whyLanguages: "8 lingue",
    whyLanguagesDesc: "Il nostro team parla spagnolo, inglese, catalano, francese, tedesco, olandese, italiano e russo.",
    whyTransparency: "Prezzi trasparenti",
    whyTransparencyDesc: "Per le barche senza patente, il prezzo mostrato \u00e8 il prezzo finale. Nessun costo nascosto.",
    whyExperience: "Facile per principianti",
    whyExperienceDesc: "Nessuna esperienza necessaria per noleggiare una barca senza patente.",
    whyReviews: "4.8 stelle su Google Maps",
    whyReviewsDesc: "Oltre 300 recensioni su Google Maps con una valutazione media di 4.8 su 5.",
    whyLocal: "Conoscenza locale",
    whyLocalDesc: "Conosciamo ogni caletta tra Blanes, Lloret de Mar e Tossa de Mar.",
    locationTitle: "La nostra posizione",
    locationP1: "Siamo situati nel Porto di Blanes, a 60 km a nord di Barcellona, facilmente raggiungibile tramite l'autostrada AP-7 e la linea ferroviaria Rodalies (R1).",
    locationP2: "Il porto \u00e8 accanto al centro di Blanes, a 5 minuti a piedi dal lungomare.",
    locationAddress: "Porto di Blanes, Blanes, Girona, Spagna",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Stagione: aprile a ottobre, tutti i giorni",
    locationHours: "Orario: 09:00 - 20:00",
    contactTitle: "Contatto",
    contactP1: "Potete contattarci per telefono, WhatsApp o email. Rispondiamo nella vostra lingua.",
    ctaHeading: "Venite a navigare con noi",
    ctaText: "Prenotate la vostra barca nel Porto di Blanes e scoprite la Costa Brava dal mare.",
    ctaWhatsApp: "Prenotare via WhatsApp",
    ctaFleet: "Vedere la nostra flotta",
    linksTitle: "Scopri di pi\u00f9",
    linkFleet: "Barche senza patente",
    linkPricing: "Prezzi e tariffe",
    linkFaq: "Domande frequenti",
    linkTestimonials: "Recensioni clienti",
    linkRoutes: "Rotte marittime",
  },
  ru: {
    title: "O nas",
    metaTitle: "O nas - Costa Brava Rent a Boat | Arenda lodok v Blanese",
    metaDescription: "Costa Brava Rent a Boat - semejnaja kompanija po arende lodok v portu Blanesa, Zhirona. Samyj bol'shoj flot v Blanese - 9 lodok, 4.8 zvezd na Google Maps i bolee 300 otzyvov.",
    heroHeading: "O kompanii Costa Brava Rent a Boat",
    heroSubheading: "Semejnaja kompanija po arende lodok v portu Blanesa, Kosta Brava. Samyj bol'shoj flot v Blanese - 9 lodok i bolee 300 polozhitel'nyh otzyvov na Google Maps.",
    badgeFamily: "Semejnyj biznes",
    badgeFleet: "9 lodok - samyj bol'shoj flot v Blanese",
    badgeReviews: "4.8 zvezd - 300+ otzyvov na Google",
    whoWeAreTitle: "Kto my",
    whoWeAreP1: "Costa Brava Rent a Boat - semejnaja kompanija, raspolozhennaja v portu Blanesa, v provincii Zhirona, Katalonija, Ispanija. My upravljaem samym bol'shim flotom arendy lodok v Blanese - 9 lodok.",
    whoWeAreP2: "Nasha missija - sdelat' opyt plavanija po Kosta Brave dostupnym dlja vseh, bez opyta ili licenzii.",
    whoWeAreP3: "Kazhdyj sezon, s aprelja po oktjabr', my privetstvuem klientov so vsej Evropy. Nasha komanda govorit na 8 jazykah (ispanskij, anglijskij, katalanskij, francuzskij, nemeckij, gollandskij, ital'janskij i russkij).",
    fleetTitle: "Nash flot",
    fleetIntro: "S 9 lodkami my javljaenmsja krupnejshej kompaniej po arende lodok v Blanesse.",
    fleetLicenseFree: "5 lodok bez licenzii",
    fleetLicenseFreeDesc: "Licenzija ne trebuetsja. Lodki do 15 l.s., prostye v upravlenii i bezopasnye. Vsja arenda bez licenzii vkljuchaet toplivo, strahovku, NDS, shvartovku, uborku i oborudovanie bezopasnosti.",
    fleetLicensed: "3 lodki s licenziej",
    fleetLicensedDesc: "Dlja opytnyh morjakov s licenziej. Lodki do 150 l.s. Toplivo ne vkljucheno.",
    fleetExcursion: "1 chastnaja ehkskursija s kapitanom",
    fleetExcursionDesc: "Professional'nyj shkiper otvezyot vas v luchshie buhty Kosta Bravy.",
    fleetIncluded: "Vkljucheno v lodki bez licenzii: toplivo, strahovka, NDS, shvartovka, uborka, spasatel'nye zhilety i oborudovanie bezopasnosti.",
    whyTitle: "Pochemu Costa Brava Rent a Boat",
    whySafety: "Bezopasnost' - prioritet",
    whySafetyDesc: "Pered kazhdym vyhodom my posvjashhaem 15 minut ob\"jasneniju upravlenija lodkoj i pravil bezopasnosti.",
    whyLanguages: "8 jazykov",
    whyLanguagesDesc: "Nasha komanda govorit na ispanskom, anglijskom, katalanskom, francuzskom, nemeckom, gollandskom, ital'janskom i russkom.",
    whyTransparency: "Prozrachnye ceny",
    whyTransparencyDesc: "Dlja lodok bez licenzii ukazannaja cena - okonchatel'naja. Nikakikh skrytyh rashodov.",
    whyExperience: "Prosto dlja novichkov",
    whyExperienceDesc: "Opyt ne trebuyetsja dlja arendy lodki bez licenzii.",
    whyReviews: "4.8 zvezd na Google Maps",
    whyReviewsDesc: "Bolee 300 otzyvov na Google Maps so srednej ocenkoj 4.8 iz 5.",
    whyLocal: "Mestnye znanija",
    whyLocalDesc: "My znaem kazhduyu buhtu mezhdu Blanesom, Lloret de Mar i Tossa de Mar.",
    locationTitle: "Nashe mestopolozhenie",
    locationP1: "My nahodimsja v portu Blanesa, v 60 km k severu ot Barselony, legko dostizhimy po avtomagistrali AP-7 i linii poezdov Rodalies (R1).",
    locationP2: "Port nahoditsja rjadom s centrom Blanesa, v 5 minutah hod'by ot nabereznoj.",
    locationAddress: "Port Blanesa, Blanes, Zhirona, Ispanija",
    locationCoords: "GPS: 41.6722504 N, 2.7978625 E",
    locationSeason: "Sezon: aprel' - oktjabr', ezhednevno",
    locationHours: "Grafik: 09:00 - 20:00",
    contactTitle: "Kontakty",
    contactP1: "Vy mozhete svjazat'sja s nami po telefonu, WhatsApp ili email. My otvechaem na vashem jazyke.",
    ctaHeading: "Prihodite plavat' s nami",
    ctaText: "Zabroniruyte lodku v portu Blanesa i otkrojte Kosta Bravu s morja.",
    ctaWhatsApp: "Zabronirovat' cherez WhatsApp",
    ctaFleet: "Posmotret' nash flot",
    linksTitle: "Uznat' bol'she",
    linkFleet: "Lodki bez licenzii",
    linkPricing: "Ceny i tarify",
    linkFaq: "Chasto zadavaemye voprosy",
    linkTestimonials: "Otzyvy klientov",
    linkRoutes: "Morskie marshruty",
  },
};

// ---------------------------------------------------------------------------
// "Why choose us" items — language-independent structure, text from translations
// ---------------------------------------------------------------------------
const whyItems = [
  { key: "safety" as const, icon: Shield },
  { key: "languages" as const, icon: Globe },
  { key: "transparency" as const, icon: Star },
  { key: "experience" as const, icon: Users },
  { key: "reviews" as const, icon: Star },
  { key: "local" as const, icon: MapPin },
] as const;

// Map the key to the corresponding title/desc translation keys
function getWhyTitle(key: typeof whyItems[number]["key"], lang: Language): string {
  const map: Record<typeof whyItems[number]["key"], keyof typeof t.es> = {
    safety: "whySafety",
    languages: "whyLanguages",
    transparency: "whyTransparency",
    experience: "whyExperience",
    reviews: "whyReviews",
    local: "whyLocal",
  };
  return t[lang][map[key]];
}

function getWhyDesc(key: typeof whyItems[number]["key"], lang: Language): string {
  const map: Record<typeof whyItems[number]["key"], keyof typeof t.es> = {
    safety: "whySafetyDesc",
    languages: "whyLanguagesDesc",
    transparency: "whyTransparencyDesc",
    experience: "whyExperienceDesc",
    reviews: "whyReviewsDesc",
    local: "whyLocalDesc",
  };
  return t[lang][map[key]];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function AboutPage() {
  const { language, localizedPath } = useLanguage();
  const txt = t[language];
  const tr = useTranslations();

  const handleBookingWhatsApp = () => {
    const message = createBookingMessage(undefined, undefined, tr.whatsappMessages);
    openWhatsApp(message);
  };

  // JSON-LD: LocalBusiness + Organization combined schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": "https://www.costabravarentaboat.com/#localbusiness",
        "name": "Costa Brava Rent a Boat",
        "alternateName": "CBRAB",
        "description": "Family-run boat rental business in the Port of Blanes, Costa Brava, Spain. Largest fleet in Blanes with 9 boats including 5 licence-free, 3 licensed motorboats and 1 private excursion with captain.",
        "url": "https://www.costabravarentaboat.com",
        "telephone": "+34611500372",
        "email": "costabravarentaboat@gmail.com",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Puerto de Blanes",
          "addressLocality": "Blanes",
          "addressRegion": "Girona",
          "postalCode": "17300",
          "addressCountry": "ES"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 41.6722504,
          "longitude": 2.7978625
        },
        "openingHoursSpecification": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "09:00",
          "closes": "20:00",
          "validFrom": "2026-04-01",
          "validThrough": "2026-10-31"
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": BUSINESS_RATING_STR,
          "bestRating": "5",
          "ratingCount": BUSINESS_REVIEW_COUNT_STR,
          "reviewCount": BUSINESS_REVIEW_COUNT_STR
        },
        "priceRange": "EUR 70-450",
        "currenciesAccepted": "EUR",
        "paymentAccepted": "Credit Card, Cash, Bank Transfer",
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 41.6722504,
            "longitude": 2.7978625
          },
          "geoRadius": "30000"
        },
        "numberOfEmployees": {
          "@type": "QuantitativeValue",
          "minValue": 2,
          "maxValue": 10
        },
        "foundingLocation": {
          "@type": "Place",
          "name": "Blanes, Costa Brava, Spain"
        },
        "knowsLanguage": ["es", "en", "ca", "fr", "de", "nl", "it", "ru"],
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Boat Rental Services",
          "itemListElement": [
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Licence-free boat rental",
                "description": "Rent a boat without a licence. Includes fuel, insurance, VAT, mooring, cleaning and safety equipment."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Licensed boat rental",
                "description": "Rent a motorboat with boating licence. Boats up to 150 HP."
              }
            },
            {
              "@type": "Offer",
              "itemOffered": {
                "@type": "Service",
                "name": "Private excursion with captain",
                "description": "Private boat trip with a professional skipper along the Costa Brava coast."
              }
            }
          ]
        },
        "sameAs": [
          "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
          "https://www.instagram.com/costabravarentaboat/",
          "https://www.facebook.com/costabravarentaboat",
          "https://www.tiktok.com/@costabravarentaboat"
        ]
      },
      {
        "@type": "Organization",
        "@id": "https://www.costabravarentaboat.com/#organization",
        "name": "Costa Brava Rent a Boat",
        "url": "https://www.costabravarentaboat.com",
        "logo": "https://www.costabravarentaboat.com/assets/logo-email-white.svg",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+34611500372",
          "contactType": "customer service",
          "availableLanguage": ["Spanish", "English", "Catalan", "French", "German", "Dutch", "Italian", "Russian"],
          "areaServed": "ES"
        },
        "sameAs": [
          "https://maps.app.goo.gl/NHV4PcaFPmwBYqCt5",
          "https://www.instagram.com/costabravarentaboat/",
          "https://www.facebook.com/costabravarentaboat",
          "https://www.tiktok.com/@costabravarentaboat"
        ]
      },
      generateBreadcrumbSchema([
        { name: tr.breadcrumbs.home, url: "/" },
        { name: tr.breadcrumbs.about, url: "/about" }
      ])
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={txt.metaTitle}
        description={txt.metaDescription}
        canonical="https://www.costabravarentaboat.com/about"
        jsonLd={jsonLd}
      />
      <Navigation />
      <ReadingProgressBar />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-sky-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Anchor className="w-8 h-8 text-primary mr-4" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                {txt.heroHeading}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-4xl mx-auto">
              {txt.heroSubheading}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Badge variant="outline" className="text-primary border-primary">
                <Users className="w-4 h-4 mr-2" />
                {txt.badgeFamily}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Ship className="w-4 h-4 mr-2" />
                {txt.badgeFleet}
              </Badge>
              <Badge variant="outline" className="text-primary border-primary">
                <Star className="w-4 h-4 mr-2" />
                {txt.badgeReviews}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Who We Are */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-3 space-y-5">
              <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold text-foreground">
                <Users className="w-6 h-6 text-cta" />
                {txt.whoWeAreTitle}
              </h2>
              <p className="text-muted-foreground leading-relaxed">{txt.whoWeAreP1}</p>
              <p className="text-muted-foreground leading-relaxed">{txt.whoWeAreP2}</p>
              <p className="text-muted-foreground leading-relaxed">{txt.whoWeAreP3}</p>
            </div>
            <div className="lg:col-span-2">
              <img
                src="/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-vista-completa-puerto.webp"
                alt="Costa Brava Rent a Boat fleet in the Port of Blanes"
                className="w-full rounded-2xl object-cover aspect-[4/5]"
                loading="lazy"
                width={640}
                height={800}
              />
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Photo break */}
      <div className="w-full overflow-hidden">
        <img
          src="/images/blog/ruta-costera.jpg"
          alt="Coastal route along the Costa Brava from Blanes"
          className="w-full h-[35vh] min-h-[250px] max-h-[400px] object-cover"
          loading="lazy"
          width={1920}
          height={600}
        />
      </div>

      {/* Our Fleet */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold text-foreground mb-4">
            <Ship className="w-6 h-6 text-primary" />
            {txt.fleetTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{txt.fleetIntro}</p>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="border rounded-lg p-6 bg-background">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Anchor className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{txt.fleetLicenseFree}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{txt.fleetLicenseFreeDesc}</p>
            </div>
            <div className="border rounded-lg p-6 bg-background">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Ship className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{txt.fleetLicensed}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{txt.fleetLicensedDesc}</p>
            </div>
            <div className="border rounded-lg p-6 bg-background">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">{txt.fleetExcursion}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{txt.fleetExcursionDesc}</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground leading-relaxed">{txt.fleetIncluded}</p>
          </div>
        </div>
      </RevealSection>

      {/* Why Choose Us */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold text-foreground mb-8">
            <Shield className="w-6 h-6 text-primary" />
            {txt.whyTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {whyItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg mb-1">{getWhyTitle(item.key, language)}</h3>
                    <p className="text-muted-foreground leading-relaxed">{getWhyDesc(item.key, language)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </RevealSection>

      {/* Location */}
      <RevealSection className="py-16 sm:py-20 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold text-foreground mb-8">
            <MapPin className="w-6 h-6 text-primary" />
            {txt.locationTitle}
          </h2>
          <div className="grid md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">{txt.locationP1}</p>
              <p className="text-muted-foreground leading-relaxed">{txt.locationP2}</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-foreground">{txt.locationAddress}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{txt.locationCoords}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{txt.locationSeason}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-muted-foreground">{txt.locationHours}</span>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Contact */}
      <RevealSection className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-3 text-2xl font-heading font-semibold text-foreground mb-4">
            <Phone className="w-6 h-6 text-primary" />
            {txt.contactTitle}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-8">{txt.contactP1}</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-background">
              <Phone className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp / Tel</p>
                <a href="tel:+34611500372" onClick={() => trackPhoneClick()} className="font-medium text-foreground hover:text-primary transition-colors">
                  +34 611 500 372
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-background">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <a href="mailto:costabravarentaboat@gmail.com" className="font-medium text-foreground hover:text-primary transition-colors text-sm">
                  costabravarentaboat@gmail.com
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-background">
              <Clock className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">{txt.locationSeason}</p>
                <p className="font-medium text-foreground">09:00 - 20:00</p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* Internal Links */}
      <div className="py-8 bg-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="font-heading font-semibold text-lg mb-4">{txt.linksTitle}</h3>
          <div className="flex flex-wrap gap-3">
            <a href={localizedPath("categoryLicenseFree")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {txt.linkFleet}
            </a>
            <a href={localizedPath("pricing")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {txt.linkPricing}
            </a>
            <a href={localizedPath("faq")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {txt.linkFaq}
            </a>
            <a href={localizedPath("testimonials")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {txt.linkTestimonials}
            </a>
            <a href={localizedPath("routes")} className="text-primary hover:underline flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />
              {txt.linkRoutes}
            </a>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 sm:py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-heading font-bold text-white mb-4">{txt.ctaHeading}</h2>
          <p className="text-lg text-white/90 leading-relaxed mb-8 max-w-2xl mx-auto">{txt.ctaText}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={handleBookingWhatsApp}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              {txt.ctaWhatsApp}
            </Button>
            <a href={localizedPath("home") + "#fleet"}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 w-full">
                <Ship className="w-5 h-5 mr-2" />
                {txt.ctaFleet}
              </Button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
