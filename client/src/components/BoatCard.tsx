import { Card, CardContent } from "@/components/ui/card";
import { Anchor, ArrowRight } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useState } from "react";

interface BoatCardProps {
  id: string;
  name: string;
  image: string;
  imageSrcSet?: string;
  imageAlt: string;
  capacity: number;
  requiresLicense: boolean;
  description: string;
  basePrice: number;
  features: string[];
  available: boolean;
  enginePower?: string;
  onBooking: (boatId: string) => void;
  onDetails: (boatId: string) => void;
}

export default function BoatCard({
  id,
  name,
  image,
  imageSrcSet,
  imageAlt,
  capacity,
  requiresLicense,
  description,
  basePrice,
  features,
  available,
  enginePower,
  onBooking: _onBooking,
  onDetails
}: BoatCardProps) {
  const t = useTranslations();
  const [imageError, setImageError] = useState(false);

  const handleDetails = () => {
    onDetails(id);
    setTimeout(() => window.scrollTo(0, 0), 50);
  };

  return (
    <Card className="overflow-hidden hover:border-cta/50 transition-colors duration-200">
      <a
        href={`/barco/${id}`}
        onClick={(e) => { e.preventDefault(); handleDetails(); }}
        className="relative block cursor-pointer group bg-muted"
        data-testid={`image-${id}`}
        aria-label={`Ver detalles del barco ${name}`}
      >
        {imageError ? (
          <div className="w-full h-44 sm:h-52 lg:h-64 flex items-center justify-center">
            <Anchor className="w-12 h-12 text-muted-foreground/50" aria-hidden="true" />
          </div>
        ) : (
          <img
            src={image}
            srcSet={imageSrcSet || undefined}
            sizes="(max-width: 639px) calc(100vw - 32px), (max-width: 1279px) calc(50vw - 20px), calc(33vw - 24px)"
            alt={imageAlt}
            className="w-full h-44 sm:h-52 lg:h-64 object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        )}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm text-foreground text-sm font-medium rounded-full px-3 py-1">
            {requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className={`inline-block w-2.5 h-2.5 rounded-full ${available ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
        </div>
      </a>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-medium text-lg text-foreground flex-1 mr-2">{name}</h3>
          <div className="text-right flex-shrink-0">
            <div className="text-sm text-muted-foreground">{t.boats.from}</div>
            <div className="text-cta font-medium text-lg">
              {basePrice}&euro;
            </div>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{description}</p>

        <p className="text-sm text-muted-foreground mb-3">
          {capacity} {t.boats.people}{enginePower ? ` | ${enginePower}` : ''}{` | ${requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}`}
        </p>
      </CardContent>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <a
          href={`/barco/${id}`}
          onClick={(e) => { e.preventDefault(); handleDetails(); }}
          className="text-sm font-medium text-foreground hover:text-cta inline-flex items-center gap-1.5 transition-colors py-2 -my-1"
          data-testid={`button-details-${id}`}
        >
          {t.boats.viewDetails} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </Card>
  );
}