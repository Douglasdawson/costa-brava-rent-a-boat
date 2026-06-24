import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { getBoatAltText } from "@/utils/boatImages";
import { trackAddToCart, trackBeginCheckout, trackBookingStarted, trackDateSelected, trackDurationSelected, trackTimeSlotSelected, trackEvent } from "@/utils/analytics";
import { getStoredUtm } from "@/hooks/useUtmCapture";
import type { Boat } from "@shared/schema";
import type { Translations } from "@/lib/translations";
import type { Duration, TimeSlot } from "./types";
import { getMinActivePrice } from "@shared/pricing";

interface PopularChoices {
  popularTime: string;
  popularDuration: string;
  sampleSize: number;
}

interface BookingStepExperienceProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  availableBoats: Boat[];
  selectedBoat: string;
  setSelectedBoat: (boatId: string) => void;
  licenseFilter: "all" | "with" | "without";
  setLicenseFilter: (filter: "all" | "with" | "without") => void;
  timeSlots: TimeSlot[];
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  getAvailableDurations: (startTime: string) => Duration[];
  setStep: (step: number) => void;
  t: Translations;
}

function SectionLabel({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-semibold tabular-nums bg-foreground/10 text-foreground"
      >
        {index}
      </span>
      <h3 className="font-heading text-[15px] font-semibold text-foreground tracking-tight">
        {children}
      </h3>
    </div>
  );
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

  const selectedBoatData = availableBoats.find(b => b.id === selectedBoat);
  const boatCapacity = selectedBoatData?.capacity || parseInt(selectedBoatData?.specifications?.capacity?.split(' ')[0] || '5');
  // Licence-free boats keep a 1h minimum all season (owner rule 2026-06-24);
  // the 2h floor only applies to licensed boats on weekends / August.
  const selectedRequiresLicense = selectedBoatData?.requiresLicense ?? true;
  const minDuration2h = (isWeekendDay || isAugust) && selectedRequiresLicense;

  const canContinue = !!(selectedDate && selectedBoat && selectedTime && duration);
  const continueHint = canContinue
    ? (() => {
        const durations = getAvailableDurations(selectedTime);
        const dur = durations.find(d => d.id === duration);
        return dur ? `${dur.label} · ${dur.price}€` : null;
      })()
    : null;

  const [popularChoices, setPopularChoices] = useState<PopularChoices | null>(null);
  const userChangedTime = useRef(false);
  const userChangedDuration = useRef(false);
  const lastFetchedBoatId = useRef<string>("");

  useEffect(() => {
    if (!selectedBoat) return;
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

  useEffect(() => {
    if (!popularChoices || !timeSlots.length || userChangedTime.current || selectedTime) return;
    const popularSlot = timeSlots.find(
      (s) => s.available && s.id === popularChoices.popularTime,
    );
    if (popularSlot) {
      setSelectedTime(popularSlot.id);
    }
  }, [popularChoices, timeSlots, selectedTime, setSelectedTime]);

  useEffect(() => {
    if (!popularChoices || !selectedTime || userChangedDuration.current || duration) return;
    const durations = getAvailableDurations(selectedTime);
    const popularDur = durations.find((d) => d.id === popularChoices.popularDuration);
    if (popularDur) {
      setDuration(popularDur.id);
    }
  }, [popularChoices, selectedTime, duration, setDuration, getAvailableDurations]);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Section 1 — Date */}
      <section>
        <SectionLabel index={1}>{t.booking.selectDate}</SectionLabel>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); if (e.target.value) trackDateSelected(e.target.value, selectedBoat); }}
          min={new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())}
          aria-label={t.booking.selectDate}
          className="w-full h-14 px-4 bg-background border border-border rounded-xl text-base font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-shadow"
          data-testid="input-booking-date"
        />
      </section>

      {/* Section 2 — Boat (revealed after date) */}
      {selectedDate && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SectionLabel index={2}>{t.booking.selectYourBoat}</SectionLabel>

          {/* License filter — pill chips, lighter weight than the boat selection itself */}
          <div className="flex flex-wrap gap-2 mb-4">
            {([
              { key: "all", label: t.booking.allBoats },
              { key: "without", label: t.booking.withoutLicense },
              { key: "with", label: t.booking.withLicense },
            ] as const).map(({ key, label }) => {
              const isActive = licenseFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLicenseFilter(key)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center justify-center h-9 px-4 rounded-full text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    isActive
                      ? 'bg-foreground text-background'
                      : 'bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08]'
                  }`}
                  data-testid={`button-filter-${key}`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Boat grid — high-contrast selection, simplified meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableBoats.map((boat: Boat) => {
              const isSelected = selectedBoat === boat.id;
              const boatName = boat.name;
              const cap = boat.capacity || parseInt(boat.specifications?.capacity?.split(' ')[0] || '5');
              const boatPrice = boat.pricePerHour ? parseFloat(boat.pricePerHour) : (getMinActivePrice(boat.pricing?.BAJA?.prices) ?? 75);
              const boatImage = boat.imageUrl || (boat as Record<string, unknown>).image as string || "/placeholder-boat.jpg";
              const requiresLicense = boat.requiresLicense !== undefined ? boat.requiresLicense : boat.subtitle?.includes("Con Licencia");

              return (
                <button
                  type="button"
                  key={boat.id}
                  onClick={() => setSelectedBoat(boat.id)}
                  aria-pressed={isSelected}
                  aria-label={`${boatName}, ${cap} ${t.booking.people}, ${t.boats.from} ${boatPrice}€`}
                  className={`group relative flex items-center gap-3 p-3 rounded-xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    isSelected
                      ? 'bg-foreground text-background ring-2 ring-foreground'
                      : 'bg-background ring-1 ring-border hover:ring-foreground/30'
                  }`}
                  data-testid={`boat-option-${boat.id}`}
                >
                  <img
                    src={boatImage}
                    alt={getBoatAltText(boatName)}
                    className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 mb-0.5">
                      <h4 className={`font-semibold text-[14px] truncate ${isSelected ? 'text-background' : 'text-foreground'}`}>
                        {boatName}
                      </h4>
                      <span className={`text-[12px] font-medium tabular-nums shrink-0 ${isSelected ? 'text-background/90' : 'text-foreground'}`}>
                        {t.boats.from} {boatPrice}€
                      </span>
                    </div>
                    <p className={`text-[12px] ${isSelected ? 'text-background/70' : 'text-muted-foreground'}`}>
                      {cap} {t.booking.people} · {requiresLicense ? t.booking.withLicense : t.booking.withoutLicense}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 3 — Time + Duration (revealed after boat) */}
      {selectedDate && selectedBoat && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <SectionLabel index={3}>{t.booking.scheduleAndDuration}</SectionLabel>

          {isWeekendDay && (
            <div className="flex items-start gap-2.5 px-3.5 py-2.5 mb-4 rounded-lg bg-amber-50 text-amber-900 text-[13px] leading-snug">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                <strong className="font-semibold">{t.booking?.weekendSurchargeTitle || 'Recargo de fin de semana'}:</strong>{' '}
                {t.booking?.weekendSurcharge || 'Se aplica un 15% en sábados y domingos.'}
              </span>
            </div>
          )}

          {/* Time slots — pill chips, navy fill when selected */}
          <div className="mb-6">
            <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground mb-2.5">
              {t.booking.startTime}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {timeSlots.map((slot) => {
                const isSelected = selectedTime === slot.id;
                const isPopular = popularChoices && popularChoices.sampleSize > 0 && slot.id === popularChoices.popularTime;
                return (
                  <button
                    key={slot.id}
                    type="button"
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
                    aria-pressed={isSelected}
                    className={`relative h-11 rounded-full text-[14px] font-medium tabular-nums transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                      isSelected
                        ? 'bg-foreground text-background'
                        : !slot.available
                          ? 'bg-foreground/[0.03] text-muted-foreground/40 line-through cursor-not-allowed'
                          : 'bg-foreground/[0.04] text-foreground hover:bg-foreground/[0.08]'
                    }`}
                    data-testid={`button-timeslot-${slot.id}`}
                  >
                    {slot.label}
                    {isPopular && slot.available && !isSelected && (
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 h-[14px] inline-flex items-center justify-center rounded-full text-[9px] font-semibold uppercase tracking-wider bg-amber-500 text-white whitespace-nowrap">
                        {t.neuro?.mostPopular || 'Top'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Duration cards — single badge max, navy fill when selected */}
          {selectedTime && (() => {
            const availableDurations = getAvailableDurations(selectedTime);
            const bestValueId = availableDurations.length > 1
              ? availableDurations.reduce((best, dur) => {
                  const bestPerHour = best.price / parseFloat(best.id);
                  const durPerHour = dur.price / parseFloat(dur.id);
                  return durPerHour < bestPerHour ? dur : best;
                }).id
              : null;

            return (
              <div className="animate-in fade-in duration-200">
                <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground mb-2.5">
                  {t.booking.duration}
                </p>
                {minDuration2h && (
                  <p className="text-[12px] text-muted-foreground mb-2.5">
                    {t.booking?.minDuration2h || 'Duración mínima: 2 horas en fin de semana y temporada alta.'}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDurations.map((dur) => {
                    const isSelected = duration === dur.id;
                    const hours = parseFloat(dur.id);
                    const perHour = dur.price / hours;
                    const isBestValue = dur.id === bestValueId;
                    const isPopular = popularChoices && popularChoices.sampleSize > 0 && dur.id === popularChoices.popularDuration;
                    const isDisabledOneHour = minDuration2h && dur.id === "1h";

                    // One-badge rule: best value beats popular
                    const badge = !isSelected && !isDisabledOneHour
                      ? (isBestValue
                          ? { label: t.neuro?.bestValue || 'Mejor valor', tone: 'green' as const }
                          : isPopular
                            ? { label: t.neuro?.mostPopular || 'Más popular', tone: 'amber' as const }
                            : null)
                      : null;

                    return (
                      <button
                        key={dur.id}
                        type="button"
                        onClick={() => {
                          if (isDisabledOneHour) return;
                          userChangedDuration.current = true;
                          setDuration(dur.id);
                          trackDurationSelected(dur.id, selectedBoat);
                        }}
                        disabled={isDisabledOneHour}
                        aria-pressed={isSelected}
                        className={`relative p-3 rounded-xl text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                          isDisabledOneHour
                            ? 'bg-foreground/[0.02] text-muted-foreground/40 cursor-not-allowed'
                            : isSelected
                              ? 'bg-foreground text-background ring-2 ring-foreground'
                              : 'bg-background ring-1 ring-border hover:ring-foreground/30'
                        }`}
                        data-testid={`duration-card-${dur.id}`}
                      >
                        <div className="flex items-baseline justify-between mb-1">
                          <span className={`font-semibold text-[14px] tabular-nums ${isSelected ? 'text-background' : 'text-foreground'}`}>
                            {dur.label}
                          </span>
                          <span className={`font-semibold text-[14px] tabular-nums ${isSelected ? 'text-background' : 'text-foreground'}`}>
                            {dur.price}€
                          </span>
                        </div>
                        <div className={`text-[12px] tabular-nums ${isSelected ? 'text-background/75' : 'text-muted-foreground'}`}>
                          {perHour.toFixed(perHour % 1 === 0 ? 0 : 0)}€{t.neuro?.perHour || '/h'} · {Math.ceil(perHour / boatCapacity)}€/{t.boats?.perPerson || 'pers.'}
                        </div>
                        {badge && (
                          <span className={`absolute top-2 right-2 px-1.5 h-[18px] inline-flex items-center rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                            badge.tone === 'green'
                              ? 'bg-green-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}>
                            {badge.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </section>
      )}

      {/* Sticky CTA footer */}
      <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-8 -mb-6 px-5 sm:px-8 pt-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] bg-background/95 backdrop-blur-md border-t border-border/60">
        <Button
          onClick={() => {
            const boat = availableBoats.find(b => b.id === selectedBoat);
            const boatName = boat?.name || selectedBoat;
            const pricing = boat?.pricing as Record<string, { prices: Record<string, number> }> | null;
            const price = pricing ? (getMinActivePrice(pricing.BAJA?.prices) ?? 75) : 0;
            const utm = getStoredUtm();
            const boatLike = {
              id: selectedBoat,
              name: boatName,
              specifications: boat?.specifications,
              requiresLicense: boat?.requiresLicense,
            };
            const durationHours = parseInt(duration.replace('h', ''), 10) || null;
            const startTime = (selectedDate && selectedTime)
              ? new Date(`${selectedDate}T${selectedTime}:00`)
              : null;
            const meta = { durationHours, startTime };
            trackAddToCart(boatLike, price, meta);
            trackBeginCheckout(boatLike, price, utm, meta);
            trackBookingStarted(selectedBoat, boatName, utm);

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
          disabled={!canContinue}
          className="w-full h-12 rounded-full text-[15px] font-semibold disabled:opacity-40"
          data-testid="button-next-step"
        >
          <span>{t.booking.continue}</span>
          {continueHint && (
            <span className="ml-2 text-[13px] font-medium opacity-80 tabular-nums">· {continueHint}</span>
          )}
        </Button>
      </div>
    </div>
  );
}
