import { Check, Users } from "lucide-react";
import type { Boat } from "@shared/schema";
import { getBoatCatalogMinPrice } from "@shared/pricing";
import { isCaptainedBoat } from "@shared/boatData";
import { isLicenseFreeEraActive } from "@shared/constants";
import { translateBoatText } from "@shared/boatTextTranslations";
import { getBoatImage } from "@/utils/boatImages";
import { getLocaleForLanguage } from "@/utils/intl-helpers";
import { cn } from "@/lib/utils";
import { useFleetAvailabilityForDate, type DayStatus } from "@/hooks/useFleetAvailabilityForDate";
import { PARTIAL_TONE, BOOKED_TONE } from "@/components/AvailabilityCalendar";
import { MultiBoatCombinations } from "@/components/booking-form/MultiBoatCombinations";
import LicenseVerifierDisclosure from "@/components/booking/LicenseVerifierDisclosure";
import type { Translations } from "@/lib/translations";
import type { BookingWizardMobileProps } from "@/components/BookingWizardMobile";

type StepBoatProps = Pick<
  BookingWizardMobileProps,
  | "licenseFilter"
  | "setLicenseFilter"
  | "licenseVerifier"
  | "selectedBoat"
  | "setSelectedBoat"
  | "selectedSecondaryBoat"
  | "setSelectedSecondaryBoat"
  | "filteredBoats"
  | "isBoatsLoading"
  | "preSelectedBoatId"
  | "selectedDate"
  | "numberOfPeople"
  | "showFieldError"
  | "getFieldError"
  | "t"
  | "language"
>;

const boatPhoto = (boat: Boat): string => {
  const first = boat.imageGallery?.[0]?.trim();
  if (first) return getBoatImage(first);
  return boat.imageUrl ? getBoatImage(boat.imageUrl) : "/placeholder-boat.jpg";
};

function LicenseSwitch({
  value,
  onChange,
  t,
}: {
  value: "with" | "without";
  onChange: (v: "with" | "without") => void;
  t: Translations;
}) {
  const options: Array<["without" | "with", string]> = [
    ["without", t.wizard.withoutLicense],
    ["with", t.wizard.withLicense],
  ];
  return (
    <div
      role="radiogroup"
      aria-label={t.a11y.filterByLicense}
      className="mx-auto flex w-full max-w-sm rounded-full bg-muted/60 p-1"
    >
      {options.map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          onClick={() => onChange(key)}
          className={cn(
            "min-h-11 flex-1 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:outline-none",
            value === key
              ? "bg-cta text-primary-foreground dark:text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BoatOption({
  boat,
  selected,
  fitsCapacity,
  dayStatus,
  onSelect,
  t,
  language,
}: {
  boat: Boat;
  selected: boolean;
  fitsCapacity: boolean;
  dayStatus?: DayStatus;
  onSelect: () => void;
  t: Translations;
  language: string;
}) {
  // "desde X€" is the catalog floor (cheapest active price of any season/duration), not tied to the chosen date.
  const price = getBoatCatalogMinPrice(boat.pricing);
  const engine = boat.specifications?.engine;
  const busy = dayStatus && dayStatus !== "available";
  // Who drives it is the question the customer is really answering at this step.
  const pilot = isCaptainedBoat(boat.id)
    ? t.bookingWizard?.boatReq?.captained
    : boat.requiresLicense
      ? t.bookingWizard?.boatReq?.licensed
      : undefined;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={fitsCapacity ? onSelect : undefined}
      disabled={!fitsCapacity}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border bg-card p-2 pr-4 text-left transition-colors focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none",
        !fitsCapacity
          ? "cursor-not-allowed border-border opacity-50"
          : selected
            ? "border-cta ring-2 ring-cta"
            : "border-border hover:border-foreground/30"
      )}
    >
      <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <img
          src={boatPhoto(boat)}
          alt=""
          loading="lazy"
          decoding="async"
          width={160}
          height={160}
          className="h-full w-full object-cover"
        />
        {selected && (
          <span
            aria-hidden="true"
            className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-cta text-primary-foreground dark:text-background"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </span>
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block font-heading text-base font-semibold leading-tight text-foreground">
          {translateBoatText(boat.name, language)}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {boat.capacity} {t.boats.people}
          </span>
          {engine && <span>{engine}</span>}
        </span>
        {pilot && (
          <span className="mt-0.5 block text-xs font-medium leading-snug text-foreground/80">{pilot}</span>
        )}
        {busy && (
          <span
            className={cn(
              "mt-1.5 inline-block rounded-full border px-2 py-0.5 text-xs font-medium",
              dayStatus === "partial" ? PARTIAL_TONE : BOOKED_TONE
            )}
          >
            {dayStatus === "partial"
              ? (t.bookingWizard?.boatStatus?.partial ?? "Pocas horas libres")
              : (t.bookingWizard?.boatStatus?.booked ?? "Completo ese día")}
          </span>
        )}
      </span>

      {price !== null && (
        <span className="shrink-0 text-right leading-none">
          <span className="block text-xs text-muted-foreground">{t.boats.from}</span>
          <span className="mt-1 block font-heading text-xl font-semibold tabular-nums text-foreground">
            {price}&euro;
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * Step 2, "Barco" (desktop and mobile share it): photo rows instead of a bare radio list, a pill switch for
 * the licence filter, and a sub-line that restates the date and group the boats were filtered for.
 */
export default function StepBoat({
  licenseFilter,
  setLicenseFilter,
  licenseVerifier,
  selectedBoat,
  setSelectedBoat,
  selectedSecondaryBoat,
  setSelectedSecondaryBoat,
  filteredBoats,
  isBoatsLoading,
  preSelectedBoatId,
  selectedDate,
  numberOfPeople,
  showFieldError,
  getFieldError,
  t,
  language,
}: StepBoatProps) {
  const people = parseInt(numberOfPeople || "1");
  const maxSingleCapacity = filteredBoats.reduce((max, b) => Math.max(max, b.capacity), 0);
  const needsMultiBoat = people > maxSingleCapacity && filteredBoats.length >= 2;
  // One request for the whole list so busy boats show up BEFORE the pick, not two steps later.
  const { boats: fleetAvailability } = useFleetAvailabilityForDate(selectedDate || undefined);

  const dateText = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString(getLocaleForLanguage(language), {
        day: "numeric",
        month: "long",
      })
    : "";
  const subtitle = needsMultiBoat
    ? (t.bookingWizard?.multiBoat?.subtitle || "Para {n} personas necesitamos 2 barcos").replace(
        "{n}",
        String(people)
      )
    : [dateText, `${people} ${t.boats.people}`].filter(Boolean).join(" · ");
  const showLicenseFilter = !preSelectedBoatId && isLicenseFreeEraActive();

  return (
    <div className="space-y-6 [@media(max-height:700px)]:space-y-4">
      <header className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl [@media(max-height:700px)]:text-xl">
          {needsMultiBoat
            ? t.bookingWizard?.multiBoat?.title || "Vuestros barcos"
            : t.wizard.chooseYourBoat}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance">{subtitle}</p>
      </header>

      {showLicenseFilter && (
        <div>
          <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
            {t.wizard.haveNauticalLicense}
          </p>
          <LicenseSwitch value={licenseFilter} onChange={setLicenseFilter} t={t} />
        </div>
      )}

      {needsMultiBoat ? (
        <MultiBoatCombinations
          filteredBoats={filteredBoats}
          peopleNum={people}
          selectedDate={selectedDate}
          selectedBoat={selectedBoat}
          selectedSecondaryBoat={selectedSecondaryBoat}
          onSelect={(primary, secondary) => {
            setSelectedBoat(primary);
            setSelectedSecondaryBoat(secondary);
          }}
          t={t}
        />
      ) : (
        <div>
          {isBoatsLoading ? (
            <div className="grid gap-3 md:grid-cols-2" aria-hidden="true">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/60" />
              ))}
            </div>
          ) : (
            <div
              role="radiogroup"
              aria-label={t.wizard.selectABoat}
              className="grid gap-3 md:grid-cols-2"
            >
              {filteredBoats.map(boat => (
                <BoatOption
                  key={boat.id}
                  boat={boat}
                  selected={selectedBoat === boat.id}
                  fitsCapacity={boat.capacity >= people}
                  dayStatus={fleetAvailability?.[boat.id]?.status}
                  onSelect={() => setSelectedBoat(boat.id)}
                  t={t}
                  language={language}
                />
              ))}
            </div>
          )}
          {showFieldError("boat") && (
            <p className="mt-2 text-center text-sm text-destructive">{getFieldError("boat")}</p>
          )}
        </div>
      )}

      {/* Optional help, after the choice that is the task of this step. A skippered boat
          needs no title, so the check is pointless once one is picked. */}
      {!preSelectedBoatId && licenseFilter === "with" && !(selectedBoat && isCaptainedBoat(selectedBoat)) && (
        <LicenseVerifierDisclosure
          verifier={licenseVerifier}
          onSwitchToUnlicensed={
            isLicenseFreeEraActive()
              ? () => {
                  setLicenseFilter("without");
                  setSelectedBoat("");
                  licenseVerifier.dismiss();
                }
              : undefined
          }
        />
      )}
    </div>
  );
}
