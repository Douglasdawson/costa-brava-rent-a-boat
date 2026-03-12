import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Anchor, Gauge } from "lucide-react";
import { getBoatAltText } from "@/utils/boatImages";
import type { Boat } from "@shared/schema";
import type { Translations } from "@/lib/translations";

interface BookingStepBoatProps {
  availableBoats: Boat[];
  selectedBoat: string;
  setSelectedBoat: (boatId: string) => void;
  licenseFilter: "all" | "with" | "without";
  setLicenseFilter: (filter: "all" | "with" | "without") => void;
  setStep: (step: number) => void;
  t: Translations;
}

export function BookingStepBoat({
  availableBoats, selectedBoat, setSelectedBoat,
  licenseFilter, setLicenseFilter, setStep, t,
}: BookingStepBoatProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Anchor className="w-5 h-5 mr-2" />
          {t.booking.selectYourBoat}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <h3 className="font-medium text-foreground mb-3 text-base">{t.booking.boatType}</h3>
          <div className="flex gap-2">
            <Button
              variant={licenseFilter === "all" ? "default" : "outline"}
              onClick={() => setLicenseFilter("all")}
              className="flex-1"
              data-testid="button-filter-all"
            >
              {t.booking.allBoats}
            </Button>
            <Button
              variant={licenseFilter === "without" ? "default" : "outline"}
              onClick={() => setLicenseFilter("without")}
              className="flex-1"
              data-testid="button-filter-without-license"
            >
              {t.booking.withoutLicense}
            </Button>
            <Button
              variant={licenseFilter === "with" ? "default" : "outline"}
              onClick={() => setLicenseFilter("with")}
              className="flex-1"
              data-testid="button-filter-with-license"
            >
              {t.booking.withLicense}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableBoats.map((boat: Boat) => {
            const isSelected = selectedBoat === boat.id;
            const boatName = boat.name;
            const boatCapacity = boat.capacity || parseInt(boat.specifications?.capacity?.split(' ')[0] || '5');
            const boatPrice = boat.pricePerHour ? parseFloat(boat.pricePerHour) : Math.min(...Object.values(boat.pricing?.BAJA?.prices || {"1h": 75}) as number[]);
            const boatImage = boat.imageUrl || (boat as Record<string, unknown>).image as string || "/placeholder-boat.jpg";
            const requiresLicense = boat.requiresLicense !== undefined ? boat.requiresLicense : boat.subtitle?.includes("Con Licencia");

            return (
              <div
                key={boat.id}
                onClick={() => setSelectedBoat(boat.id)}
                className={`p-4 border rounded-lg cursor-pointer hover-elevate ${
                  isSelected
                    ? 'border-primary bg-primary/10'
                    : 'border-primary/20 hover:border-primary/20'
                }`}
                data-testid={`boat-option-${boat.id}`}
              >
                <div className="flex items-center mb-3">
                  <img
                    src={boatImage}
                    alt={getBoatAltText(boatName)}
                    className="w-16 h-16 object-cover rounded-lg mr-3"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">{boatName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {requiresLicense ? t.booking.withLicense : t.booking.withoutLicense}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div>{boatCapacity} {t.booking.people}</div>
                  <div>{boat.specifications?.length || "4-6m"}</div>
                  <div className="flex items-center"><Gauge className="w-3 h-3 mr-1" />{boat.specifications?.engine || boat.specifications?.model || "Motor"}</div>
                  <div>{t.boats.from} {boatPrice}€</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <Button
            onClick={() => setStep(3)}
            disabled={!selectedBoat}
            className="w-full py-3"
            data-testid="button-next-step"
          >
            {t.booking.continue}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
