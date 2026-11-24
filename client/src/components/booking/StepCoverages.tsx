import { Check } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import type { Translations } from "@/lib/translations";

/**
 * Step 5 — Coverages. Its own screen since 2026-07-25: while these two options
 * lived at the foot of step 4 (extras) customers scrolled past them.
 *
 * The screen earns its place by showing the CONTRAST first (what happens with
 * and without the guarantee) and only then the two options. Without that
 * comparison the price has nothing to argue against.
 *
 * Legal, non-negotiable: these are commercial guarantees, never insurance —
 * no "seguro" / "insurance" / "Versicherung" wording in any locale — and the
 * options ship UNCHECKED (EU Consumer Rights Directive art. 22: additional
 * payments need express consent, pre-ticked boxes are void).
 */
export interface CoverageOption {
  key: string;
  name: string;
  desc: string;
  price: number;
  on: boolean;
  toggle: () => void;
}

interface StepCoveragesProps {
  coverages: CoverageOption[];
  /** Weather guarantee price, shown inside the "with guarantee" column. */
  weatherPrice?: number;
  t: Translations;
}

const FOCUS =
  "focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 focus-visible:outline-none";

export default function StepCoverages({ coverages, weatherPrice, t }: StepCoveragesProps) {
  const { localizedPath } = useLanguage();
  const c = t.booking.coverages;

  return (
    <div className="space-y-5 md:space-y-6 [@media(max-height:820px)]:space-y-3">
      <header className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl [@media(max-height:820px)]:text-xl">
          {c.stepTitle}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground text-balance [@media(max-height:820px)]:hidden">
          {c.stepSubtitle}
        </p>
      </header>

      {/* The contrast. Two columns sharing one frame (not two cards): the point is the comparison. */}
      <div className="grid grid-cols-2 overflow-hidden rounded-3xl border border-border bg-card">
        <div className="p-4 [@media(max-height:820px)]:p-3">
          <p className="text-sm font-semibold text-muted-foreground">{c.withoutLabel}</p>
          <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground [@media(max-height:820px)]:text-xs">
            {c.withoutBody}
          </p>
        </div>
        <div className="border-l border-border bg-cta/5 p-4 [@media(max-height:820px)]:p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{c.withLabel}</p>
            {weatherPrice != null && (
              <span className="shrink-0 rounded-full bg-cta px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground dark:text-background">
                {weatherPrice}&euro;
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] font-medium leading-snug text-foreground">
            {c.withBody}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 [@media(max-height:820px)]:space-y-2">
        {coverages.map(option => (
          <button
            key={option.key}
            type="button"
            onClick={option.toggle}
            aria-pressed={option.on}
            className={`flex w-full items-center gap-3 rounded-3xl border p-3.5 text-left [@media(max-height:820px)]:py-2.5 transition-colors ${FOCUS} ${
              option.on
                ? "border-cta ring-2 ring-cta"
                : "border-border bg-card hover:border-foreground/30"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                option.on
                  ? "border-cta bg-cta text-primary-foreground dark:text-background"
                  : "border-border bg-background text-transparent"
              }`}
            >
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-tight text-foreground">
                {option.name}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {option.desc}
              </span>
            </span>
            <span className="shrink-0 rounded-full bg-muted px-3 py-1 font-heading text-base font-semibold tabular-nums text-foreground">
              {option.price}&euro;
            </span>
          </button>
        ))}
      </div>

      {/* One line, not a table: /garantias develops the full rule. */}
      <p className="text-center text-xs leading-snug text-muted-foreground [@media(max-height:820px)]:hidden">
        {c.criteriaShort ?? `${c.triggerAemetMark} · ${c.triggerAemet}`}{" "}
        <a
          href={localizedPath("garantias")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          {t.booking.coveragesMoreInfo}
        </a>
      </p>

      {t.bookingWizard?.hints?.noOnlinePayment && (
        <p className="text-center text-[11px] text-muted-foreground [@media(max-height:820px)]:hidden">
          {t.bookingWizard.hints.noOnlinePayment}
        </p>
      )}
    </div>
  );
}
