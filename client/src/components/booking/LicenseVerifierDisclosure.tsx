import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import type { UseLicenseVerifierResult } from "@/hooks/useLicenseVerifier";
import LicenseVerifierPanelSkeleton from "@/components/booking/LicenseVerifierPanelSkeleton";

const LicenseVerifierPanel = lazy(() => import("@/components/booking/LicenseVerifierPanel"));

/**
 * Secondary, folded entry to the license verifier inside the booking wizard:
 * the boat list is the task of the step, the check is optional help. Same
 * verifier state as before (it never gated "Next"); only the presentation
 * changed. A finished check shows its summary directly, no toggle.
 */
export default function LicenseVerifierDisclosure({
  verifier,
  onSwitchToUnlicensed,
}: {
  verifier: UseLicenseVerifierResult;
  onSwitchToUnlicensed?: () => void;
}) {
  const t = useTranslations();
  const tv = t.bookingWizard?.licenseVerifier;
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { dismissed, status } = verifier.state;
  const { undismiss } = verifier;

  // "Lo verifico más tarde" inside the panel folds it back.
  useEffect(() => {
    if (dismissed) {
      setOpen(false);
      undismiss();
    }
  }, [dismissed, undismiss]);

  // The panel is taller than the room left under the boat list: bring it into view when it opens.
  useEffect(() => {
    if (!open) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    panelRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }, [open]);

  if (open || status !== null) {
    return (
      <div ref={panelRef} className="scroll-mt-2">
        <Suspense fallback={<LicenseVerifierPanelSkeleton />}>
          <LicenseVerifierPanel verifier={verifier} onSwitchToUnlicensed={onSwitchToUnlicensed} />
        </Suspense>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-expanded={false}
      data-testid="button-license-verifier-toggle"
      className="flex w-full min-h-12 items-center gap-2.5 rounded-xl border border-border bg-background px-3.5 text-left text-sm font-medium text-foreground transition-colors hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="flex-1">{tv?.compactCta ?? "Verifica tu título en 30 s"}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
