import { Check, Package } from "lucide-react";
import { EXTRA_PACKS } from "@shared/boatData";
import { cn } from "@/lib/utils";
import { translateExtraName } from "@/utils/extraNameTranslations";
import type { BookingWizardMobileProps } from "@/components/BookingWizardMobile";

type StepExtrasProps = Pick<
  BookingWizardMobileProps,
  | "boatExtras"
  | "selectedExtras"
  | "selectedPack"
  | "extrasInPack"
  | "totalExtrasPrice"
  | "handlePackSelect"
  | "handleExtraToggle"
  | "calculatePackSavings"
  | "iconMap"
  | "isSpanishLang"
  | "language"
  | "t"
>;

// Whole euros as-is, fractions with one comma decimal ("2,5"): toFixed(0) rounded 2.5 up to 3 and overstated the saving.
const formatSavings = (amount: number): string =>
  Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace(".", ",");

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none";

/**
 * Step 4, "Mejora tu día" (desktop and mobile share it): packs as full-width selectable rows, single extras as
 * toggle pills that wrap, so a boat with six extras still fits a phone screen. "Sin pack" is a pill next to the
 * Packs label instead of a card of its own.
 */
export default function StepExtras({
  boatExtras,
  selectedExtras,
  selectedPack,
  extrasInPack,
  totalExtrasPrice,
  handlePackSelect,
  handleExtraToggle,
  calculatePackSavings,
  iconMap,
  isSpanishLang,
  language,
  t,
}: StepExtrasProps) {
  const copy = t.booking.extrasSection;
  const boatExtraNames = new Set(boatExtras.map(e => e.name));
  const availablePacks = EXTRA_PACKS.filter(pack =>
    pack.extras.every(name => boatExtraNames.has(name))
  );

  return (
    <div className="space-y-5 md:space-y-6 [@media(max-height:700px)]:space-y-3 [@media(max-height:660px)]:!space-y-2">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {t.bookingWizard?.steps?.upgradeYourDay || "Mejora tu día"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance [@media(max-height:700px)]:hidden">
          {copy.title}
        </p>
      </div>

      {availablePacks.length > 0 && (
        <section aria-label={copy.packs}>
          <div className="mb-2 flex items-center justify-between gap-3 [@media(max-height:660px)]:mb-1">
            <p className="text-sm font-medium text-muted-foreground">{copy.packs}</p>
            <button
              type="button"
              aria-pressed={!selectedPack}
              onClick={() => handlePackSelect("")}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-colors [@media(max-height:700px)]:min-h-10",
                FOCUS,
                !selectedPack
                  ? "border-cta bg-cta text-primary-foreground dark:text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/30"
              )}
            >
              {copy.noPack}
            </button>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2 [@media(max-height:700px)]:gap-2 [@media(max-height:620px)]:grid-cols-2">
            {availablePacks.map(pack => {
              const selected = selectedPack === pack.id;
              const savings = calculatePackSavings(pack.id);
              const PackIcon = iconMap[pack.icon] || Package;
              return (
                <button
                  key={pack.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handlePackSelect(pack.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-3xl border p-3 text-left transition-colors [@media(max-height:700px)]:py-2",
                    FOCUS,
                    selected
                      ? "border-cta ring-2 ring-cta"
                      : "border-border bg-card hover:border-foreground/30"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-full [@media(max-height:700px)]:size-9 [@media(max-height:620px)]:hidden",
                      selected
                        ? "bg-cta text-primary-foreground dark:text-background"
                        : "bg-muted text-foreground"
                    )}
                  >
                    <PackIcon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-tight text-foreground">
                      {isSpanishLang ? pack.name : pack.nameEN}
                    </span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground [@media(max-height:700px)]:hidden">
                      {pack.extras.map(e => translateExtraName(e, language)).join(", ")}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="flex items-baseline justify-end gap-1.5">
                      {savings > 0 && (
                        <s className="text-xs font-normal tabular-nums text-muted-foreground">
                          {formatSavings(pack.price + savings)}&euro;
                        </s>
                      )}
                      <span className="font-heading text-lg font-semibold leading-none tabular-nums text-foreground">
                        {pack.price}&euro;
                      </span>
                    </span>
                    {savings > 0 && (
                      <span className="mt-1 block text-xs font-medium leading-none tabular-nums text-success">
                        {copy.savings} {formatSavings(savings)}&euro;
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {boatExtras.length > 0 && (
        <section aria-label={copy.individual}>
          <div className="mb-2 flex items-center justify-between gap-3 [@media(max-height:660px)]:mb-1">
            <p className="text-sm font-medium text-muted-foreground">{copy.individual}</p>
            {totalExtrasPrice > 0 && (
              <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold tabular-nums text-foreground">
                +{totalExtrasPrice}&euro;
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 [@media(max-height:700px)]:gap-1.5 sm:flex-row sm:flex-wrap sm:justify-center">
            {boatExtras.map(extra => {
              const included = extrasInPack.has(extra.name);
              const checked = selectedExtras.includes(extra.name);
              const on = checked || included;
              const ExtraIcon = iconMap[extra.icon] || Package;
              return (
                <button
                  key={extra.name}
                  type="button"
                  aria-pressed={on}
                  disabled={included}
                  onClick={() => handleExtraToggle(extra.name)}
                  className={cn(
                    "inline-flex min-h-11 w-full items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors [@media(max-height:700px)]:min-h-10 sm:w-auto",
                    FOCUS,
                    included
                      ? "cursor-default border-border bg-muted text-muted-foreground"
                      : checked
                        ? "border-cta bg-cta text-primary-foreground dark:text-background"
                        : "border-border bg-background text-foreground hover:border-foreground/30"
                  )}
                >
                  {on ? (
                    <Check className="h-4 w-4 shrink-0" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <ExtraIcon className="h-4 w-4 shrink-0" />
                  )}
                  <span>{translateExtraName(extra.name, language)}</span>
                  <span
                    className={cn(
                      "ml-auto tabular-nums sm:ml-0",
                      on ? "opacity-80" : "text-muted-foreground"
                    )}
                  >
                    {included ? copy.included.toLowerCase() : extra.price}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
