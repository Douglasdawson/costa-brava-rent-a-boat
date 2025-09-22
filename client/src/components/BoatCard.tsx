import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Star, Euro, CheckCircle, AlertCircle } from "lucide-react";

interface BoatCardProps {
  id: string;
  name: string;
  image: string;
  capacity: number;
  requiresLicense: boolean;
  description: string;
  basePrice: number;
  rating: number;
  features: string[];
  available: boolean;
  onBooking: (boatId: string) => void;
  onDetails: (boatId: string) => void;
}

export default function BoatCard({
  id,
  name,
  image,
  capacity,
  requiresLicense,
  description,
  basePrice,
  rating,
  features,
  available,
  onBooking,
  onDetails
}: BoatCardProps) {

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
          alt={name}
          className="w-full h-48 object-cover transition-transform duration-200 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-gray-800">
            Ver detalles
          </div>
        </div>
        <div className="absolute top-3 left-3">
          <Badge variant={requiresLicense ? "destructive" : "secondary"}>
            {requiresLicense ? "Con licencia" : "Sin licencia"}
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge variant={available ? "default" : "secondary"} className="bg-white/90 text-gray-800">
            {available ? (
              <><CheckCircle className="w-3 h-3 mr-1 text-green-600" /> Disponible</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1 text-orange-600" /> Ocupado</>
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

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-heading font-semibold text-lg text-gray-900">{name}</h3>
          <div className="text-right">
            <div className="text-sm text-gray-500">desde</div>
            <div className="font-bold text-primary flex items-center">
              <Euro className="w-4 h-4 mr-1" />
              {basePrice}
            </div>
          </div>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>

        <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>Hasta {capacity} pax</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>1-8 horas</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {feature}
            </Badge>
          ))}
          {features.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{features.length - 3} más
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={handleDetails}
          data-testid={`button-details-${id}`}
        >
          Ver detalles
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleBooking}
          disabled={!available}
          data-testid={`button-book-${id}`}
        >
          {available ? "Reservar" : "No disponible"}
        </Button>
      </CardFooter>
    </Card>
  );
}