import { lazy, Suspense, useEffect, useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLicenseVerifier } from "@/hooks/useLicenseVerifier";
import LicenseVerifierPanelSkeleton from "@/components/booking/LicenseVerifierPanelSkeleton";

const LicenseVerifierPanel = lazy(() => import("@/components/booking/LicenseVerifierPanel"));

/**
 * Discoverable entry point for the nautical license verifier outside the
 * booking wizard. Renders a discreet text CTA; clicking it lazy-mounts the
 * standalone LicenseVerifierPanel inline (the panel only needs the
 * useLicenseVerifier hook, no wizard state).
 */
export default function LicenseVerifierInline({ className = "" }: { className?: string }) {
  const t = useTranslations();
  const tv = t.bookingWizard?.licenseVerifier;
  const [open, setOpen] = useState(false);
  const verifier = useLicenseVerifier();

  // "Lo verifico más tarde" inside the panel sets dismissed — treat it as a
  // request to collapse this inline instance, then clear the flag so the
  // panel renders normally if reopened.
  const { dismissed } = verifier.state;
  const { undismiss } = verifier;
  useEffect(() => {
    if (dismissed) {
      setOpen(false);
      undismiss();
    }
  }, [dismissed, undismiss]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm min-h-11"
        data-testid="button-license-verifier-discover"
      >
        <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
        {tv?.discoverCta ?? "¿Te vale tu licencia? Compruébalo en 1 minuto"}
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="mt-3 max-w-xl">
          <Suspense fallback={<LicenseVerifierPanelSkeleton />}>
            <LicenseVerifierPanel verifier={verifier} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
