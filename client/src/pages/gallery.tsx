import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import PhotoLightbox from "@/components/PhotoLightbox";
import PhotoSubmissionForm from "@/components/PhotoSubmissionForm";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { getSEOConfig, generateCanonicalUrl, generateHreflangLinks } from "@/utils/seo-config";
import { queryClient } from "@/lib/queryClient";

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
  const { language } = useLanguage();
  const t = useTranslations();

  const { data: photos = [], isLoading } = useQuery<GalleryPhoto[]>({
    queryKey: ["/api/gallery"],
  });

  const seoConfig = getSEOConfig("gallery", language) || {
    title: "Galeria de Fotos | Costa Brava Rent a Boat",
    description: "Fotos de nuestros clientes disfrutando en barco por la Costa Brava. Comparte tu experiencia.",
  };
  const canonical = generateCanonicalUrl("gallery", language);
  const hreflangLinks = generateHreflangLinks("gallery");

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
            <p>
              Nuestros clientes capturan momentos inolvidables navegando por las aguas turquesa de la Costa Brava.
              Desde las calas escondidas de Lloret de Mar hasta los impresionantes acantilados cerca de Tossa de Mar,
              cada salida en barco es una oportunidad para crear recuerdos que duran toda la vida.
            </p>
            <p>
              Tanto si navegas con nuestra flota de{" "}
              <a href="/#fleet" className="text-primary hover:underline">barcos sin licencia</a>{" "}
              como si prefieres un{" "}
              <a href="/barcos-con-licencia" className="text-primary hover:underline">barco con licencia</a>{" "}
              para explorar más lejos, las fotos de esta galería muestran la variedad de experiencias que puedes vivir:
              snorkel en aguas cristalinas, atardeceres desde cubierta, fondeo en calas vírgenes
              y la diversión en familia que solo el mar puede ofrecer.
            </p>
          </div>

          <Button onClick={() => setShowSubmitForm(true)}>
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
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
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
            Crea tus propios recuerdos
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explora la Costa Brava desde el agua. Elige tu barco, reserva tu fecha y prepárate para una experiencia inolvidable.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a href="/#fleet" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
              Ver nuestra flota
            </a>
            <a href="/rutas" className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-3 rounded-lg font-medium hover:bg-primary/5 transition-colors">
              Descubrir rutas
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
