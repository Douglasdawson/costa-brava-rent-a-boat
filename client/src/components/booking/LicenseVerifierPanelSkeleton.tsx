/**
 * Lazy-load placeholder for the LicenseVerifierPanel. Renders the same vertical
 * footprint as the real panel so the wizard layout doesn't shift while the
 * chunk is being fetched.
 */
export default function LicenseVerifierPanelSkeleton() {
  return (
    <section
      aria-hidden
      data-testid="license-verifier-skeleton"
      className="p-4 sm:p-5 rounded-2xl bg-card/40 space-y-6 motion-safe:animate-pulse"
    >
      <div className="space-y-2">
        <div className="h-3 w-32 rounded-full bg-foreground/10" />
        <div className="h-3.5 w-64 max-w-full rounded-full bg-foreground/10" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-40 rounded-full bg-foreground/10" />
        <div className="h-11 rounded-md bg-foreground/[0.06]" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 rounded-full bg-foreground/10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="h-16 rounded-xl bg-foreground/[0.06]" />
          <div className="h-16 rounded-xl bg-foreground/[0.06]" />
        </div>
      </div>
      <div className="flex items-center justify-end">
        <div className="h-11 w-28 rounded-full bg-foreground/[0.08]" />
      </div>
    </section>
  );
}
