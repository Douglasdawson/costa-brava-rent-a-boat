import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Star, Euro, CheckCircle, AlertCircle, Gauge } from "lucide-react";
import { useTranslations } from "@/lib/translations";

interface BoatCardProps {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  capacity: number;
  requiresLicense: boolean;
  description: string;
  basePrice: number;
  rating: number;
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
  imageAlt,
  capacity,
  requiresLicense,
  description,
  basePrice,
  rating,
  features,
  available,
  enginePower,
  onBooking,
  onDetails
}: BoatCardProps) {
  const t = useTranslations();

  const handleBooking = () => {
    console.log(`Booking initiated for boat ${id}`);
    onBooking(id);
  };

  const handleDetails = () => {
    console.log(`View details for boat ${id}`);
    if (id === "solar-450") {
      window.location.href = "/barco/solar-450";
    } else {
      onDetails(id);
    }
    // Ensure scroll to top for consistent behavior
    setTimeout(() => window.scrollTo(0, 0), 50);
  };

  return (
    <Card className="hover-elevate overflow-hidden transition-all duration-300">
      <div 
        className="relative cursor-pointer group"
        onClick={handleDetails}
        data-testid={`image-${id}`}
      >
        <img 
          src={image} 
          alt={imageAlt}
          className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-gray-800">
            {t.boats.viewDetails}
          </div>
        </div>
        <div className="absolute top-3 left-3">
          <Badge variant={requiresLicense ? "default" : "secondary"}>
            {requiresLicense ? t.boats.withLicense : t.boats.withoutLicense}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={available ? "default" : "secondary"} className="bg-white/90 text-gray-800">
            {available ? (
              <><CheckCircle className="w-3 h-3 mr-1 text-green-600" /> {t.boats.available}</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1 text-orange-600" /> {t.boats.occupied}</>
            )}
          </Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <div className="flex items-center bg-white/90 backdrop-blur px-2 py-1 rounded-full text-sm">
            <Star className="w-3 h-3 text-yellow-500 mr-1 fill-current" />
            <span className="font-medium text-gray-800">{rating}</span>
          </div>
        </div>
      </div>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-semibold text-base sm:text-lg text-gray-900 flex-1 mr-2">{name}</h3>
          <div className="text-right flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-500">{t.boats.from}</div>
            <div className="font-bold text-primary flex items-center text-[20px]">
              <Euro className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              {basePrice}
            </div>
          </div>
        </div>

        <p className="text-gray-600 sm:text-sm mb-3 line-clamp-2 text-[13px]">{description}</p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3 text-xs sm:text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span>{t.boats.upTo} {capacity} {t.boats.people}</span>
          </div>
          {enginePower && (
            <div className="flex items-center">
              <Gauge className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              <span>{enginePower}</span>
            </div>
          )}
          <div className="flex items-center">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            <span>{t.boats.hours}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {features.map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0 flex flex-row gap-2">
        <Button 
          variant="outline" 
          size="sm"
          className="flex-1 text-xs sm:text-sm"
          onClick={handleDetails}
          data-testid={`button-details-${id}`}
        >
          {t.boats.viewDetails}
        </Button>
        <Button 
          size="sm"
          className="flex-1 text-xs sm:text-sm" 
          onClick={handleBooking}
          disabled={!available}
          data-testid={`button-book-${id}`}
        >
          {available ? t.boats.book : t.boats.notAvailable}
        </Button>
      </CardFooter>
    </Card>
  );
}