import { useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Button } from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import PhotoLightbox from "@/components/PhotoLightbox";
import PhotoSubmissionForm from "@/components/PhotoSubmissionForm";
import { useLanguage, type Language } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks, generateBreadcrumbSchema } from "@/utils/seo-config";
import { queryClient } from "@/lib/queryClient";

const galleryText: Record<string, {
  introP1: string;
  introP2pre: string;
  introP2licenseFree: string;
  introP2mid: string;
  introP2licensed: string;
  introP2post: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaFleet: string;
  ctaRoutes: string;
}> = {
  es: {
    introP1: "Nuestros clientes capturan momentos inolvidables navegando por las aguas turquesa de la Costa Brava. Desde las calas escondidas de Lloret de Mar hasta los impresionantes acantilados cerca de Tossa de Mar, cada salida en barco es una oportunidad para crear recuerdos que duran toda la vida.",
    introP2pre: "Tanto si navegas con nuestra flota de",
    introP2licenseFree: "barcos sin licencia",
    introP2mid: "como si prefieres un",
    introP2licensed: "barco con licencia",
    introP2post: "para explorar mas lejos, las fotos de esta galeria muestran la variedad de experiencias que puedes vivir: snorkel en aguas cristalinas, atardeceres desde cubierta, fondeo en calas virgenes y la diversion en familia que solo el mar puede ofrecer.",
    ctaTitle: "Crea tus propios recuerdos",
    ctaSubtitle: "Explora la Costa Brava desde el agua. Elige tu barco, reserva tu fecha y preparate para una experiencia inolvidable.",
    ctaFleet: "Ver nuestra flota",
    ctaRoutes: "Descubrir rutas",
  },
  en: {
    introP1: "Our customers capture unforgettable moments sailing through the turquoise waters of the Costa Brava. From the hidden coves of Lloret de Mar to the stunning cliffs near Tossa de Mar, every boat trip is a chance to create memories that last a lifetime.",
    introP2pre: "Whether you sail with our fleet of",
    introP2licenseFree: "licence-free boats",
    introP2mid: "or prefer a",
    introP2licensed: "licensed boat",
    introP2post: "to explore further, the photos in this gallery show the variety of experiences you can enjoy: snorkelling in crystal-clear waters, sunsets from the deck, anchoring in pristine coves and the family fun that only the sea can offer.",
    ctaTitle: "Create your own memories",
    ctaSubtitle: "Explore the Costa Brava from the water. Choose your boat, book your date and get ready for an unforgettable experience.",
    ctaFleet: "See our fleet",
    ctaRoutes: "Discover routes",
  },
  fr: {
    introP1: "Nos clients capturent des moments inoubliables en naviguant dans les eaux turquoise de la Costa Brava. Des criques cachees de Lloret de Mar aux falaises impressionnantes pres de Tossa de Mar, chaque sortie en bateau est une occasion de creer des souvenirs qui durent toute la vie.",
    introP2pre: "Que vous naviguiez avec notre flotte de",
    introP2licenseFree: "bateaux sans permis",
    introP2mid: "ou que vous preferiez un",
    introP2licensed: "bateau avec permis",
    introP2post: "pour explorer plus loin, les photos de cette galerie montrent la variete d'experiences que vous pouvez vivre : snorkeling dans des eaux cristallines, couchers de soleil depuis le pont, mouillage dans des criques vierges et le plaisir en famille que seule la mer peut offrir.",
    ctaTitle: "Creez vos propres souvenirs",
    ctaSubtitle: "Explorez la Costa Brava depuis la mer. Choisissez votre bateau, reservez votre date et preparez-vous pour une experience inoubliable.",
    ctaFleet: "Voir notre flotte",
    ctaRoutes: "Decouvrir les itineraires",
  },
  de: {
    introP1: "Unsere Kunden fangen unvergessliche Momente beim Segeln durch das turkisfarbene Wasser der Costa Brava ein. Von den versteckten Buchten von Lloret de Mar bis zu den beeindruckenden Klippen bei Tossa de Mar ist jeder Bootsausflug eine Gelegenheit, Erinnerungen zu schaffen, die ein Leben lang halten.",
    introP2pre: "Ob Sie mit unserer Flotte von",
    introP2licenseFree: "fuhrerscheinfreien Booten",
    introP2mid: "segeln oder ein",
    introP2licensed: "Boot mit Fuhrerschein",
    introP2post: "bevorzugen, um weiter zu erkunden — die Fotos in dieser Galerie zeigen die Vielfalt der Erlebnisse: Schnorcheln in kristallklarem Wasser, Sonnenuntergange vom Deck, Ankern in unberuhrten Buchten und der Familienspass, den nur das Meer bieten kann.",
    ctaTitle: "Schaffen Sie Ihre eigenen Erinnerungen",
    ctaSubtitle: "Erkunden Sie die Costa Brava vom Wasser aus. Wahlen Sie Ihr Boot, buchen Sie Ihr Datum und bereiten Sie sich auf ein unvergessliches Erlebnis vor.",
    ctaFleet: "Unsere Flotte ansehen",
    ctaRoutes: "Routen entdecken",
  },
  nl: {
    introP1: "Onze klanten leggen onvergetelijke momenten vast terwijl ze over het turquoise water van de Costa Brava varen. Van de verborgen baaien van Lloret de Mar tot de indrukwekkende kliffen bij Tossa de Mar, elke boottocht is een kans om herinneringen te creeren die een leven lang meegaan.",
    introP2pre: "Of u nu vaart met onze vloot van",
    introP2licenseFree: "boten zonder vaarbewijs",
    introP2mid: "of de voorkeur geeft aan een",
    introP2licensed: "boot met vaarbewijs",
    introP2post: "om verder te verkennen, de foto's in deze galerij tonen de verscheidenheid aan ervaringen: snorkelen in kristalhelder water, zonsondergangen vanaf het dek, ankeren in ongerepte baaien en het familieplezier dat alleen de zee kan bieden.",
    ctaTitle: "Maak uw eigen herinneringen",
    ctaSubtitle: "Verken de Costa Brava vanaf het water. Kies uw boot, boek uw datum en bereid u voor op een onvergetelijke ervaring.",
    ctaFleet: "Onze vloot bekijken",
    ctaRoutes: "Routes ontdekken",
  },
  it: {
    introP1: "I nostri clienti catturano momenti indimenticabili navigando nelle acque turchesi della Costa Brava. Dalle calette nascoste di Lloret de Mar alle impressionanti scogliere vicino a Tossa de Mar, ogni uscita in barca e un'opportunita per creare ricordi che durano tutta la vita.",
    introP2pre: "Sia che navighi con la nostra flotta di",
    introP2licenseFree: "barche senza patente",
    introP2mid: "o che preferisca una",
    introP2licensed: "barca con patente",
    introP2post: "per esplorare piu lontano, le foto di questa galleria mostrano la varieta di esperienze che puoi vivere: snorkeling in acque cristalline, tramonti dal ponte, ancoraggio in calette incontaminate e il divertimento in famiglia che solo il mare puo offrire.",
    ctaTitle: "Crea i tuoi ricordi",
    ctaSubtitle: "Esplora la Costa Brava dall'acqua. Scegli la tua barca, prenota la tua data e preparati per un'esperienza indimenticabile.",
    ctaFleet: "Vedi la nostra flotta",
    ctaRoutes: "Scopri gli itinerari",
  },
  ru: {
    introP1: "Наши клиенты запечатлевают незабываемые моменты, плавая по бирюзовым водам Коста-Бравы. От скрытых бухт Льорет-де-Мар до впечатляющих скал возле Тосса-де-Мар — каждая морская прогулка это возможность создать воспоминания на всю жизнь.",
    introP2pre: "Плаваете ли вы на нашем флоте",
    introP2licenseFree: "лодок без лицензии",
    introP2mid: "или предпочитаете",
    introP2licensed: "лодку с лицензией",
    introP2post: "для дальних путешествий — фотографии в этой галерее показывают разнообразие впечатлений: снорклинг в кристально чистой воде, закаты с палубы, якорные стоянки в нетронутых бухтах и семейное веселье, которое может подарить только море.",
    ctaTitle: "Создайте свои воспоминания",
    ctaSubtitle: "Исследуйте Коста-Браву с воды. Выберите лодку, забронируйте дату и приготовьтесь к незабываемому опыту.",
    ctaFleet: "Посмотреть наш флот",
    ctaRoutes: "Открыть маршруты",
  },
  ca: {
    introP1: "Els nostres clients capturen moments inoblidables navegant per les aigues turquesa de la Costa Brava. Des de les cales amagades de Lloret de Mar fins als impressionants penya-segats prop de Tossa de Mar, cada sortida en vaixell es una oportunitat per crear records que duren tota la vida.",
    introP2pre: "Tant si navegues amb la nostra flota de",
    introP2licenseFree: "barques sense llicencia",
    introP2mid: "com si prefereixes una",
    introP2licensed: "barca amb llicencia",
    introP2post: "per explorar mes lluny, les fotos d'aquesta galeria mostren la varietat d'experiencies que pots viure: snorkel en aigues cristal·lines, postes de sol des de coberta, fondeig en cales verges i la diversio en familia que nomes el mar pot oferir.",
    ctaTitle: "Crea els teus propis records",
    ctaSubtitle: "Explora la Costa Brava des de l'aigua. Tria la teva barca, reserva la teva data i prepara't per a una experiencia inoblidable.",
    ctaFleet: "Veure la nostra flota",
    ctaRoutes: "Descobrir rutes",
  },
};

function getGalleryText(language: Language) {
  return galleryText[language] || galleryText.es;
}

interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string | null;
  customerName: string;
  boatName: string | null;
  boatId: string | null;
  tripDate: string | null;
  createdAt: string;
}

export default function GalleryPage() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal();
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const gt = getGalleryText(language);

  const { data: photos = [], isLoading } = useQuery<GalleryPhoto[]>({
    queryKey: ["/api/gallery"],
  });

  const seoConfig = getSEOConfig("gallery", language) || {
    title: "Galeria de Fotos | Costa Brava Rent a Boat",
    description: "Fotos de nuestros clientes disfrutando en barco por la Costa Brava. Comparte tu experiencia.",
  };
  const canonical = generateCanonicalUrl("gallery", language);
  const hreflangLinks = generateHreflangLinks("gallery");
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: t.breadcrumbs.home, url: "/" },
    { name: t.breadcrumbs.gallery, url: "/galeria" }
  ]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <main id="main-content" className="min-h-screen bg-muted">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        keywords={seoConfig.keywords}
        ogImage={seoConfig.image}
        canonical={canonical}
        hreflang={hreflangLinks}
        jsonLd={breadcrumbSchema}
      />
      <Navigation />

      <div className="container mx-auto px-4 pt-20 sm:pt-24 pb-8 sm:pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            {t.gallery?.title || "Galeria de Fotos"}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
            {t.gallery?.subtitle || "Fotos de nuestros clientes disfrutando de la Costa Brava"}
          </p>

          {/* Rich intro paragraph with internal links */}
          <div className="max-w-3xl mx-auto text-left mt-6 mb-8 space-y-4 text-muted-foreground">
            <p>{gt.introP1}</p>
            <p>
              {gt.introP2pre}{" "}
              <a href={localizedPath("home") + "#fleet"} className="text-primary hover:underline">{gt.introP2licenseFree}</a>{" "}
              {gt.introP2mid}{" "}
              <a href={localizedPath("categoryLicensed")} className="text-primary hover:underline">{gt.introP2licensed}</a>{" "}
              {gt.introP2post}
            </p>
          </div>

          <Button variant="outline" onClick={() => setShowSubmitForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t.gallery?.sharePhoto || "Comparte tu foto"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16">
            <Camera className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground/60 text-lg">
              {t.gallery?.noPhotos || "Aun no hay fotos. Se el primero en compartir!"}
            </p>
          </div>
        ) : (
          /* Masonry grid with CSS columns */
          <div ref={gridRef} className={`columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4 transition-[opacity,transform,filter] duration-500 ${gridVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"}`}>
            {photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                className="break-inside-avoid cursor-pointer group text-left w-full"
                onClick={() => openLightbox(index)}
                aria-label={`Ver imagen ${index + 1} en pantalla completa`}
              >
                <div className="bg-background rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || `Photo by ${photo.customerName}`}
                    className="w-full object-cover group-hover:opacity-95 transition-opacity aspect-[4/3]"
                    loading="lazy"
                    width={600}
                    height={450}
                  />
                  <div className="p-3">
                    {photo.caption && (
                      <p className="text-sm text-muted-foreground mb-1">{photo.caption}</p>
                    )}
                    <p className="text-xs text-muted-foreground/60">
                      {photo.customerName}
                      {photo.boatName && ` - ${photo.boatName}`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 text-center space-y-4">
          <h2 className="text-2xl font-heading font-bold text-foreground">
            {gt.ctaTitle}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {gt.ctaSubtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href={localizedPath("home") + "#fleet"} className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              {gt.ctaFleet}
            </a>
            <a href={localizedPath("routes")} className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary/5 transition-colors">
              {gt.ctaRoutes}
            </a>
          </div>
        </div>
      </div>

      <PhotoLightbox
        photos={photos}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      <PhotoSubmissionForm
        open={showSubmitForm}
        onOpenChange={setShowSubmitForm}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/gallery"] })}
      />

      <Footer />
    </main>
  );
}
