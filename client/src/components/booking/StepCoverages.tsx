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
  t: Translations;
  /** Accent token: the mobile wizard uses `primary`, the desktop one `cta`. */
  variant?: "mobile" | "desktop";
}

/**
 * Full class names per variant. Tailwind scans source statically, so
 * `bg-${accent}/5` would never make it into the build — the classes have to be
 * written out.
 */
const ACCENT = {
  mobile: {
    tint: "bg-primary/5",
    text: "text-primary",
    onBox: "border-primary bg-primary/5",
    onDot: "border-primary bg-primary",
  },
  desktop: {
    tint: "bg-cta/5",
    text: "text-cta",
    onBox: "border-cta bg-cta/5",
    onDot: "border-cta bg-cta",
  },
} as const;

export default function StepCoverages({ coverages, t, variant = "mobile" }: StepCoveragesProps) {
  const { localizedPath } = useLanguage();
  const c = t.booking.coverages;
  const accent = ACCENT[variant];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-foreground">{c.stepTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{c.stepSubtitle}</p>
      </div>

      {/* The contrast. Two columns sharing one frame (not two cards): the point
          is the comparison, and a divider reads as "same subject, two outcomes". */}
      <div className="grid grid-cols-2 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card">
        <div className="p-3.5">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {c.withoutLabel}
          </p>
          <p className="mt-2 text-[13px] leading-snug text-muted-foreground">{c.withoutBody}</p>
        </div>
        <div className={`${accent.tint} p-3.5`}>
          <p className={`font-mono text-[10px] font-bold uppercase tracking-wider ${accent.text}`}>
            {c.withLabel}
          </p>
          <p className="mt-2 text-[13px] font-medium leading-snug text-foreground">{c.withBody}</p>
        </div>
      </div>

      <div className="space-y-2">
        {coverages.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={option.toggle}
            aria-pressed={option.on}
            className={`flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
              option.on ? accent.onBox : "border-border bg-background"
            }`}
          >
            <span
              aria-hidden="true"
              className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                option.on ? accent.onDot : "border-border"
              }`}
            >
              {option.on && <Check className="h-3 w-3 text-white" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold leading-tight text-foreground">{option.name}</span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{option.desc}</span>
            </span>
            <span className={`flex-shrink-0 text-sm font-bold ${accent.text}`}>{option.price}€</span>
          </button>
        ))}
      </div>

      {/* The objective threshold, in the page's own typographic signature. */}
      <dl className="space-y-1.5 border-t border-border pt-4">
        <div className="flex gap-3">
          <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {c.triggerAemetMark}
          </dt>
          <dd className="flex-1 text-xs text-muted-foreground">{c.triggerAemet}</dd>
        </div>
        <div className="flex gap-3">
          <dt className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {c.triggerWindMark}
          </dt>
          <dd className="flex-1 text-xs text-muted-foreground">{c.triggerWind}</dd>
        </div>
      </dl>

      <a
        href={localizedPath("garantias")}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-block text-xs font-medium ${accent.text} underline`}
      >
        {t.booking.coveragesMoreInfo}
      </a>
    </div>
  );
}
