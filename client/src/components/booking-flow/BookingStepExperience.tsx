import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Anchor, Clock, Gauge, AlertTriangle } from "lucide-react";
import { getBoatAltText } from "@/utils/boatImages";
import { trackAddToCart, trackBeginCheckout, trackBookingStarted, trackDateSelected, trackDurationSelected, trackTimeSlotSelected, trackEvent } from "@/utils/analytics";
import { getStoredUtm } from "@/hooks/useUtmCapture";
import type { Boat } from "@shared/schema";
import type { Translations } from "@/lib/translations";
import type { Duration, TimeSlot } from "./types";
import { BookingTrustBanner } from "./BookingTrustBanner";
import { getMinActivePrice } from "@shared/pricing";

interface PopularChoices {
  popularTime: string;
  popularDuration: string;
  sampleSize: number;
}

interface BookingStepExperienceProps {
  // Date
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  // Boat
  availableBoats: Boat[];
  selectedBoat: string;
  setSelectedBoat: (boatId: string) => void;
  licenseFilter: "all" | "with" | "without";
  setLicenseFilter: (filter: "all" | "with" | "without") => void;
  // Time
  timeSlots: TimeSlot[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  getAvailableDurations: (startTime: string) => Duration[];
  // Navigation
  setStep: (step: number) => void;
  t: Translations;
}

export function BookingStepExperience({
  selectedDate, setSelectedDate,
  availableBoats, selectedBoat, setSelectedBoat,
  licenseFilter, setLicenseFilter,
  timeSlots, selectedTime, setSelectedTime,
  duration, setDuration, getAvailableDurations,
  setStep, t,
}: BookingStepExperienceProps) {
  const parsedDate = selectedDate ? new Date(selectedDate + "T12:00:00") : null;
  const isWeekendDay = parsedDate ? (parsedDate.getDay() === 0 || parsedDate.getDay() === 6) : false;
  const isAugust = parsedDate ? (parsedDate.getMonth() === 7) : false;
  const minDuration2h = isWeekendDay || isAugust;

  const selectedBoatData = availableBoats.find(b => b.id === selectedBoat);
  const boatCapacity = selectedBoatData?.capacity || parseInt(selectedBoatData?.specifications?.capacity?.split(' ')[0] || '5');

  const canContinue = selectedDate && selectedBoat && selectedTime && duration;

  // Smart defaults: fetch popular choices when a boat is selected
  const [popularChoices, setPopularChoices] = useState<PopularChoices | null>(null);
  const userChangedTime = useRef(false);
  const userChangedDuration = useRef(false);
  const lastFetchedBoatId = useRef<string>("");

  useEffect(() => {
    if (!selectedBoat) return;
    // Only fetch once per boat selection
    if (lastFetchedBoatId.current === selectedBoat) return;
    lastFetchedBoatId.current = selectedBoat;
    userChangedTime.current = false;
    userChangedDuration.current = false;

    fetch(`/api/boats/${selectedBoat}/popular-choices`)
      .then((res) => res.json())
      .then((data: PopularChoices) => {
        setPopularChoices(data);
      })
      .catch(() => {
        setPopularChoices(null);
      });
  }, [selectedBoat]);

  // Auto-select popular time slot when time slots become available
  useEffect(() => {
    if (!popularChoices || !timeSlots.length || userChangedTime.current || selectedTime) return;
    const popularSlot = timeSlots.find(
      (s) => s.available && s.id === popularChoices.popularTime,
    );
    if (popularSlot) {
      setSelectedTime(popularSlot.id);
    }
  }, [popularChoices, timeSlots, selectedTime, setSelectedTime]);

  // Auto-select popular duration when durations become available
  useEffect(() => {
    if (!popularChoices || !selectedTime || userChangedDuration.current || duration) return;
    const durations = getAvailableDurations(selectedTime);
    const popularDur = durations.find((d) => d.id === popularChoices.popularDuration);
    if (popularDur) {
      setDuration(popularDur.id);
    }
  }, [popularChoices, selectedTime, duration, setDuration, getAvailableDurations]);

  return (
    <div className="space-y-4">
      <BookingTrustBanner t={t} stage="step1" />
      {/* Section 1: Date */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-base">
            <Calendar className="w-4 h-4 mr-2" />
            {t.booking.selectDate}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); if (e.target.value) trackDateSelected(e.target.value, selectedBoat); }}
            min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())}
            className="w-full p-3 border border-primary/20 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary text-base text-left text-foreground"
            data-testid="input-booking-date"
          />
        </CardContent>
      </Card>

      {/* Section 2: Boat - shown after date selected */}
      {selectedDate && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Anchor className="w-4 h-4 mr-2" />
              {t.booking.selectYourBoat}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* License filter */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Button
                  variant={licenseFilter === "all" ? "default" : "outline"}
                  onClick={() => setLicenseFilter("all")}
                  className="flex-1 text-xs sm:text-sm py-2 h-auto"
                  data-testid="button-filter-all"
                >
                  {t.booking.allBoats}
                </Button>
                <Button
                  variant={licenseFilter === "without" ? "default" : "outline"}
                  onClick={() => setLicenseFilter("without")}
                  className="flex-1 text-xs sm:text-sm py-2 h-auto"
                  data-testid="button-filter-without-license"
                >
                  {t.booking.withoutLicense}
                </Button>
                <Button
                  variant={licenseFilter === "with" ? "default" : "outline"}
                  onClick={() => setLicenseFilter("with")}
                  className="flex-1 text-xs sm:text-sm py-2 h-auto"
                  data-testid="button-filter-with-license"
                >
                  {t.booking.withLicense}
                </Button>
              </div>
            </div>

            {/* Compact boat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableBoats.map((boat: Boat) => {
                const isSelected = selectedBoat === boat.id;
                const boatName = boat.name;
                const boatCapacity = boat.capacity || parseInt(boat.specifications?.capacity?.split(' ')[0] || '5');
                const boatPrice = boat.pricePerHour ? parseFloat(boat.pricePerHour) : (getMinActivePrice(boat.pricing?.BAJA?.prices) ?? 75);
                const boatImage = boat.imageUrl || (boat as Record<string, unknown>).image as string || "/placeholder-boat.jpg";
                const requiresLicense = boat.requiresLicense !== undefined ? boat.requiresLicense : boat.subtitle?.includes("Con Licencia");

                return (
                  <div
                    key={boat.id}
                    onClick={() => setSelectedBoat(boat.id)}
                    className={`p-3 border rounded-lg cursor-pointer hover-elevate ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-primary/20 hover:border-primary/20'
                    }`}
                    data-testid={`boat-option-${boat.id}`}
                  >
                    <div className="flex items-center mb-2">
                      <img
                        src={boatImage}
                        alt={getBoatAltText(boatName)}
                        className="w-12 h-12 object-cover rounded-lg mr-3"
                      />
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{boatName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {requiresLicense ? t.booking.withLicense : t.booking.withoutLicense}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                      <div>{boatCapacity} {t.booking.people}</div>
                      <div>{boat.specifications?.length || "4-6m"}</div>
                      <div className="flex items-center"><Gauge className="w-3 h-3 mr-1" />{boat.specifications?.engine || boat.specifications?.model || "Motor"}</div>
                      <div>{t.boats.from} {boatPrice}€</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Time & Duration - shown after boat selected */}
      {selectedDate && selectedBoat && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-base">
              <Clock className="w-4 h-4 mr-2" />
              {t.booking.scheduleAndDuration}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isWeekendDay && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  <strong>{t.booking?.weekendSurchargeTitle || 'Weekend surcharge'}:</strong>{' '}
                  {t.booking?.weekendSurcharge || 'A 15% surcharge applies on weekends.'}
                </span>
              </div>
            )}
            {minDuration2h && (
              <p className="text-xs text-muted-foreground mb-3">
                {t.booking?.minDuration2h || 'Minimum duration: 2 hours on weekends and high season.'}
              </p>
            )}

            {/* Time slots - compact grid with "Most popular" badge */}
            <div className="mb-4">
              <h3 className="font-medium text-foreground mb-2 text-sm">{t.booking.startTime}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {timeSlots.map((slot) => {
                  const isPopularTime = popularChoices && popularChoices.sampleSize > 0 && slot.id === popularChoices.popularTime;
                  return (
                    <button
                      key={slot.id}
                      onClick={() => {
                        userChangedTime.current = true;
                        setSelectedTime(slot.id);
                        trackTimeSlotSelected(slot.id, selectedBoat);
                        const availableDurations = getAvailableDurations(slot.id);
                        const isDurationStillAvailable = availableDurations.some(d => d.id === duration);
                        if (!isDurationStillAvailable) {
                          setDuration("2h");
                        }
                      }}
                      disabled={!slot.available}
                      className={`relative p-2 border rounded-lg text-sm font-medium text-center ${
                        selectedTime === slot.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : !slot.available
                            ? 'border-primary/20 bg-primary/5 text-muted-foreground/70 cursor-not-allowed'
                            : 'border-primary/20 hover:border-primary hover:bg-primary/5'
                      }`}
                      data-testid={`button-timeslot-${slot.id}`}
                    >
                      {slot.label}
                      {isPopularTime && slot.available && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-indigo-50 text-indigo-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          {t.neuro?.mostPopular || 'Mas popular'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration selector - visual card grid with per-hour pricing */}
            {selectedTime && (() => {
              const availableDurations = getAvailableDurations(selectedTime);
              // Find the duration with the lowest per-hour price (best value)
              const bestValueId = availableDurations.length > 0
                ? availableDurations.reduce((best, dur) => {
                    const bestPerHour = best.price / parseFloat(best.id);
                    const durPerHour = dur.price / parseFloat(dur.id);
                    return durPerHour < bestPerHour ? dur : best;
                  }).id
                : null;

              return (
                <div className="animate-in fade-in duration-200">
                  <h3 className="font-medium text-foreground mb-2 text-sm">{t.booking.duration}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableDurations.map((dur) => {
                      const isSelected = duration === dur.id;
                      const hours = parseFloat(dur.id);
                      const perHour = dur.price / hours;
                      const perPersonPerHour = perHour / boatCapacity;
                      const isBestValue = dur.id === bestValueId && availableDurations.length > 1;
                      const isPopularDuration = popularChoices && popularChoices.sampleSize > 0 && dur.id === popularChoices.popularDuration;

                      return (
                        <button
                          key={dur.id}
                          onClick={() => {
                            userChangedDuration.current = true;
                            setDuration(dur.id);
                            trackDurationSelected(dur.id, selectedBoat);
                          }}
                          className={`relative p-3 border rounded-lg text-left transition-colors ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-primary/20 hover:border-primary/40'
                          }`}
                          data-testid={`duration-card-${dur.id}`}
                        >
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="font-semibold text-foreground text-sm">{dur.label}</span>
                            <span className="font-semibold text-foreground text-sm">{dur.price}€</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {perHour.toFixed(perHour % 1 === 0 ? 0 : 2)}€{t.neuro?.perHour || '/hora'} · {Math.ceil(perPersonPerHour)}€/{t.boats?.perPerson || 'pers.'}
                          </div>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {isBestValue && (
                              <span className="bg-green-50 text-green-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">
                                {t.neuro?.bestValue || 'Mejor valor'}
                              </span>
                            )}
                            {isPopularDuration && (
                              <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                                {t.neuro?.mostPopular || 'Mas popular'}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Continue button */}
      {canContinue && (
        <div className="animate-in fade-in duration-200">
          <Button
            onClick={() => {
              const boat = availableBoats.find(b => b.id === selectedBoat);
              const boatName = boat?.name || selectedBoat;
              const pricing = boat?.pricing as Record<string, { prices: Record<string, number> }> | null;
              const price = pricing ? (getMinActivePrice(pricing.BAJA?.prices) ?? 75) : 0;
              const utm = getStoredUtm();
              trackAddToCart(selectedBoat, boatName, price);
              trackBeginCheckout(selectedBoat, boatName, price, utm);
              trackBookingStarted(selectedBoat, boatName, utm);

              // Track smart default acceptance/change
              if (popularChoices && popularChoices.sampleSize > 0) {
                const timeAccepted = selectedTime === popularChoices.popularTime;
                const durationAccepted = duration === popularChoices.popularDuration;
                if (timeAccepted && durationAccepted) {
                  trackEvent("default_accepted", { boat_id: selectedBoat, popular_time: popularChoices.popularTime, popular_duration: popularChoices.popularDuration });
                } else {
                  trackEvent("default_changed", {
                    boat_id: selectedBoat,
                    time_changed: !timeAccepted,
                    duration_changed: !durationAccepted,
                    selected_time: selectedTime,
                    selected_duration: duration,
                    popular_time: popularChoices.popularTime,
                    popular_duration: popularChoices.popularDuration,
                  });
                }
              }

              setStep(2);
            }}
            className="w-full py-3"
            data-testid="button-next-step"
          >
            {t.booking.continue}
          </Button>
        </div>
      )}
    </div>
  );
}
