import { Loader2 } from "lucide-react";
import { isBestValueSeasonForLongDuration } from "@shared/pricing";
import { translateBoatText } from "@shared/boatTextTranslations";
import { cn } from "@/lib/utils";
import { BOOKED_TONE } from "@/components/AvailabilityCalendar";
import { formatBookingDate } from "@/utils/intl-helpers";
import type { BookingWizardMobileProps } from "@/components/BookingWizardMobile";

interface DurationOption {
  value: string;
  label: string;
  price?: number;
  disabled?: boolean;
  disabledReason?: string;
}

type StepDepartureProps = Pick<
  BookingWizardMobileProps,
  | "selectedDate"
  | "selectedDuration"
  | "onDurationSelectFromUser"
  | "preferredTime"
  | "onTimeSelectFromUser"
  | "selectedBoatInfo"
  | "timeSlots"
  | "unavailableTimeSlots"
  | "tooShortTimeSlots"
  | "slotMaxDuration"
  | "selectedTimeMaxDuration"
  | "isAvailabilityLoading"
  | "preSelectedBoatId"
  | "onGoToStep"
  | "language"
  | "showFieldError"
  | "getFieldError"
  | "handleBlur"
  | "t"
> & {
  durationOptions: DurationOption[];
  maxCapacity: number;
};

const ACTION_PILL =
  "inline-flex min-h-11 items-center rounded-full border border-current/25 px-4 text-sm font-semibold transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none";

/**
 * Step 3, "Salida y duración" (desktop and mobile share it): the start time is a grid of time pills (one tap
 * instead of opening a native select) and each duration is a pill with its price. Durations that do not fit the
 * chosen start time are removed, never shown struck through.
 */
export default function StepDeparture({
  selectedDate,
  selectedDuration,
  onDurationSelectFromUser,
  preferredTime,
  onTimeSelectFromUser,
  selectedBoatInfo,
  durationOptions,
  maxCapacity,
  timeSlots,
  unavailableTimeSlots,
  tooShortTimeSlots,
  slotMaxDuration,
  selectedTimeMaxDuration,
  isAvailabilityLoading,
  preSelectedBoatId,
  onGoToStep,
  language,
  showFieldError,
  getFieldError,
  handleBlur,
  t,
}: StepDepartureProps) {
  const noSlotsAvailable =
    !isAvailabilityLoading &&
    timeSlots.length > 0 &&
    timeSlots.every(time => unavailableTimeSlots.has(time) || tooShortTimeSlots.has(time));

  // "Best value" only in true low season: in peak, shorter slots sell on their own and turnover wins.
  const enabledWithPrice = durationOptions.filter(o => !o.disabled && o.price);
  const allowBestValue = isBestValueSeasonForLongDuration(
    selectedDate ? new Date(`${selectedDate}T12:00:00`) : null
  );
  const bestValueId =
    allowBestValue && enabledWithPrice.length > 1
      ? enabledWithPrice.reduce((best, dur) =>
          dur.price! / parseFloat(dur.value) < best.price! / parseFloat(best.value) ? dur : best
        ).value
      : null;

  const bookable = durationOptions.filter(opt => {
    const hours = parseInt(opt.value.replace("h", ""));
    const exceedsMax = selectedTimeMaxDuration !== null && hours > selectedTimeMaxDuration;
    return !exceedsMax && !opt.disabled;
  });

  const timeSuffix = t.booking.timeSuffix ?? "h";
  const timeError = showFieldError("time");

  return (
    <div className="space-y-5 md:space-y-6 [@media(max-height:620px)]:space-y-3">
      <header className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {t.bookingWizard?.steps?.departureDuration || "Salida y duración"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance [@media(max-height:620px)]:hidden">
          {selectedBoatInfo
            ? (t.endowment?.yourTripIn || "Tu viaje en {boat}").replace(
                "{boat}",
                translateBoatText(selectedBoatInfo.name, language)
              )
            : t.wizard.howLongHowMany}
        </p>
      </header>

      {noSlotsAvailable && (
        <div role="alert" className={cn("rounded-3xl border p-4 text-sm", BOOKED_TONE)}>
          <p className="font-medium">
            {(
              t.bookingWizard?.hints?.boatNotAvailableForDate ??
              "Sin disponibilidad para {date}. Mira otro día o cambia de barco."
            ).replace("{date}", formatBookingDate(selectedDate, language))}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => onGoToStep(1)} className={ACTION_PILL}>
              {t.bookingWizard?.boatStatus?.changeDate ?? "Cambiar fecha"}
            </button>
            {!preSelectedBoatId && (
              <button type="button" onClick={() => onGoToStep(2)} className={ACTION_PILL}>
                {t.bookingWizard?.boatStatus?.seeOtherBoat ?? "Ver otro barco"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Time first: the chosen start time decides which durations still fit. */}
      {!noSlotsAvailable && (
        <>
          <div id="field-time">
            <p
              id="departure-time-label"
              className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground"
            >
              <span>{t.wizard.departureTime}</span>
              {isAvailabilityLoading && (
                <span className="inline-flex items-center gap-1 text-xs font-normal">
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  {t.bookingWizard?.slotConflict?.checking ?? "Comprobando disponibilidad…"}
                </span>
              )}
            </p>
            <div
              role="radiogroup"
              aria-labelledby="departure-time-label"
              aria-required="true"
              aria-busy={isAvailabilityLoading ? "true" : "false"}
              aria-invalid={timeError ? "true" : "false"}
              aria-describedby={timeError ? "error-departure-time" : undefined}
              className={cn(
                // Phones: one swipeable row (a 19-slot grid would push the step past the viewport); desktop: wrapping grid.
                "-mx-1 flex snap-x gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:py-0",
                timeError && "ring-2 ring-destructive ring-offset-4 ring-offset-background"
              )}
            >
              {timeSlots.map(time => {
                const isUnavailable = unavailableTimeSlots.has(time);
                const isTooShort = !isUnavailable && tooShortTimeSlots.has(time);
                const maxDur = slotMaxDuration.get(time);
                const selected = preferredTime === time;
                const note = isUnavailable
                  ? (t.booking.timeSlotReservedSuffix ?? " · Reservado")
                  : isTooShort && maxDur != null
                    ? (t.booking.timeSlotMaxDurationSuffix ?? " · solo {n}h").replace(
                        "{n}",
                        String(maxDur)
                      )
                    : "";
                return (
                  <button
                    key={time}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`${time}${timeSuffix}${note}`}
                    title={note ? note.replace(/^\s*·\s*/, "") : undefined}
                    disabled={isUnavailable || isTooShort}
                    onClick={() => onTimeSelectFromUser(time)}
                    onBlur={() => handleBlur("time")}
                    className={cn(
                      "inline-flex min-h-11 min-w-[4.5rem] shrink-0 snap-start items-center justify-center rounded-full border px-3 text-sm font-semibold tabular-nums transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none md:min-w-0",
                      selected
                        ? "border-cta bg-cta text-primary-foreground dark:text-background"
                        : isUnavailable
                          ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground line-through opacity-60"
                          : isTooShort
                            ? "cursor-not-allowed border-border bg-muted/40 text-muted-foreground opacity-60"
                            : "border-border bg-background text-foreground hover:border-foreground/30"
                    )}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
            {timeError && (
              <p id="error-departure-time" className="mt-2 text-xs text-destructive">
                {getFieldError("time")}
              </p>
            )}
          </div>

          <div id="field-duration">
            <p className="mb-2 text-sm font-medium text-muted-foreground">{t.wizard.duration}</p>
            <div
              role="radiogroup"
              aria-label={t.wizard.duration}
              className="grid grid-cols-2 gap-x-2.5 gap-y-3.5 pt-1.5 [@media(max-height:620px)]:gap-y-3"
            >
              {bookable.map(opt => {
                const parts = opt.label.split(" - ");
                const last = parts[parts.length - 1];
                const priceText = parts.length > 1 && last.includes("€") ? last : null;
                const labelText = priceText ? parts.slice(0, -1).join(" · ") : opt.label;
                const [durationLabel, ...rest] = labelText.split(" · ");
                const descriptor = rest.length ? rest.join(" · ") : null;
                const selected = selectedDuration === opt.value;
                const badge =
                  opt.value === bestValueId
                    ? {
                        text: t.neuro?.bestValue || "Mejor valor",
                        tone: "bg-background text-success",
                      }
                    : opt.value === "4h"
                      ? { text: t.wizard.mostPopular, tone: "bg-background text-muted-foreground" }
                      : null;
                const perHour = opt.price ? Math.round(opt.price / parseFloat(opt.value)) : null;
                const perPerson = opt.price
                  ? Math.ceil(opt.price / parseFloat(opt.value) / maxCapacity)
                  : null;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onDurationSelectFromUser(opt.value)}
                    className={cn(
                      "relative flex min-h-[4.75rem] [@media(max-height:620px)]:min-h-[4rem] flex-col items-center justify-center rounded-3xl border px-2 py-2.5 text-center transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none",
                      selected
                        ? "border-cta ring-2 ring-cta"
                        : "border-border bg-card hover:border-foreground/30"
                    )}
                  >
                    {badge && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] font-medium leading-none",
                          badge.tone
                        )}
                      >
                        {badge.text}
                      </span>
                    )}
                    <span className="flex items-baseline justify-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{durationLabel}</span>
                      {priceText && (
                        <span className="font-heading text-lg font-semibold leading-none tabular-nums text-foreground">
                          {priceText}
                        </span>
                      )}
                    </span>
                    {descriptor && (
                      <span className="mt-0.5 text-xs text-muted-foreground [@media(max-height:620px)]:hidden">
                        {descriptor}
                      </span>
                    )}
                    {perHour !== null && perPerson !== null && (
                      <span className="mt-0.5 whitespace-nowrap text-[11px] text-muted-foreground tabular-nums">
                        {perHour}€{t.neuro?.perHour || "/hora"} · {perPerson}€/
                        {t.boats?.perPerson || "pers."}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {showFieldError("duration") && (
              <p id="error-departure-duration" className="mt-2 text-xs text-destructive">
                {getFieldError("duration")}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
