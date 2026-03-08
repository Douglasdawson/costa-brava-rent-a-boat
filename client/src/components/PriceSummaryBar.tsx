import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Translations } from "@/lib/translations";

interface PriceSummaryBarProps {
  boatName: string;
  duration: string;
  basePrice: number;
  extrasPrice: number;
  discount: number;
  discountLabel?: string;
  t: Translations;
  /** "desktop" renders a card; "mobile" renders a compact sticky bar */
  variant: "desktop" | "mobile";
}

/**
 * Persistent price summary shown during booking steps 2-4.
 * Desktop: compact card with full breakdown.
 * Mobile: single-line bar, expandable on tap to show breakdown.
 */
export default function PriceSummaryBar({
  boatName,
  duration,
  basePrice,
  extrasPrice,
  discount,
  discountLabel,
  t,
  variant,
}: PriceSummaryBarProps) {
  const [expanded, setExpanded] = useState(false);

  const total = basePrice + extrasPrice - discount;
  const ps = t.priceSummary;
  const baseLabel = ps?.base || "Base";
  const extrasLabel = ps?.extras || "Extras";
  const discountText = ps?.discount || "Discount";
  const totalLabel = ps?.total || "Total";
  const seeDetailsLabel = ps?.seeDetails || "See details";

  // --- DESKTOP: compact card with breakdown ---
  if (variant === "desktop") {
    return (
      <div className="border border-[#A8C4DD]/40 rounded-xl bg-[#A8C4DD]/5 px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium truncate mr-2">
            {boatName} · {duration}
          </span>
          <span className="text-lg font-bold text-foreground flex-shrink-0">{total}€</span>
        </div>
        <div className="space-y-0.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{baseLabel}</span>
            <span className="text-foreground">{basePrice}€</span>
          </div>
          {extrasPrice > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{extrasLabel}</span>
              <span className="text-foreground">+{extrasPrice}€</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {discountLabel || discountText}
              </span>
              <span className="text-green-600 font-medium">-{discount}€</span>
            </div>
          )}
          {(extrasPrice > 0 || discount > 0) && (
            <>
              <div className="border-t border-[#A8C4DD]/30 my-1" />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-foreground">{totalLabel}</span>
                <span className="text-foreground">{total}€</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // --- MOBILE: compact sticky bar, expandable ---
  return (
    <div className="border-t border-gray-200 bg-[#0D0D2B] text-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm"
        aria-expanded={expanded}
        aria-label={seeDetailsLabel}
      >
        <span className="truncate mr-2 opacity-80">
          {boatName} · {duration}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          <span className="font-bold">{totalLabel}: {total}€</span>
          {(extrasPrice > 0 || discount > 0) && (
            expanded
              ? <ChevronUp className="w-3.5 h-3.5 opacity-60" />
              : <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          )}
        </span>
      </button>
      {expanded && (extrasPrice > 0 || discount > 0) && (
        <div className="px-4 pb-2 space-y-0.5 text-sm border-t border-white/10">
          <div className="flex justify-between pt-1.5">
            <span className="opacity-70">{baseLabel}</span>
            <span>{basePrice}€</span>
          </div>
          {extrasPrice > 0 && (
            <div className="flex justify-between">
              <span className="opacity-70">{extrasLabel}</span>
              <span>+{extrasPrice}€</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between">
              <span className="opacity-70">{discountLabel || discountText}</span>
              <span className="text-green-400">-{discount}€</span>
            </div>
          )}
          <div className="border-t border-white/20 mt-1 pt-1 flex justify-between font-bold">
            <span>{totalLabel}</span>
            <span>{total}€</span>
          </div>
        </div>
      )}
    </div>
  );
}
