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
import { getSEOConfig, generateCanonicalUrl } from "@/utils/seo-config";
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

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={canonical}
      />
      <Navigation />

      <div className="container mx-auto px-4 py-8 sm:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {t.gallery?.title || "Galeria de Fotos"}
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            {t.gallery?.subtitle || "Fotos de nuestros clientes disfrutando de la Costa Brava"}
          </p>
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
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t.gallery?.noPhotos || "Aun no hay fotos. Se el primero en compartir!"}
            </p>
          </div>
        ) : (
          /* Masonry grid with CSS columns */
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="break-inside-avoid cursor-pointer group"
                onClick={() => openLightbox(index)}
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption || `Photo by ${photo.customerName}`}
                    className="w-full object-cover group-hover:opacity-95 transition-opacity"
                    loading="lazy"
                  />
                  <div className="p-3">
                    {photo.caption && (
                      <p className="text-sm text-gray-700 mb-1">{photo.caption}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {photo.customerName}
                      {photo.boatName && ` - ${photo.boatName}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  );
}
