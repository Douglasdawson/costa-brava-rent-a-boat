import { Check, Ship, GraduationCap, Anchor, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";
import { getMinActivePrice } from "@shared/pricing";
import { isJetSkiProduct } from "@shared/jetskiProducts";
import { isLicenseFreeEraActive } from "@shared/constants";

export default function LicenseComparisonSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();
  // RD 1188/2025: the license-free card retires itself on 2026-10-01.
  const licenseFreeEra = isLicenseFreeEraActive();

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });

  const noLicenseMinPriceRaw = boats
    ?.filter(b => !b.requiresLicense && b.pricing && !isJetSkiProduct(b.id))
    .reduce((min, b) => {
      const boatMin = getMinActivePrice(b.pricing!.BAJA?.prices);
      return boatMin !== null && boatMin < min ? boatMin : min;
    }, Infinity);
  const noLicenseMinPrice =
    noLicenseMinPriceRaw && Number.isFinite(noLicenseMinPriceRaw) ? noLicenseMinPriceRaw : 70;

  const withLicenseMinPriceRaw = boats
    ?.filter(b => b.requiresLicense && b.pricing)
    .reduce((min, b) => {
      const boatMin = getMinActivePrice(b.pricing!.BAJA?.prices);
      return boatMin !== null && boatMin < min ? boatMin : min;
    }, Infinity);
  const withLicenseMinPrice =
    withLicenseMinPriceRaw && Number.isFinite(withLicenseMinPriceRaw)
      ? withLicenseMinPriceRaw
      : 150;

  // Extract max engine HP from licensed boats
  const maxEngineHP =
    boats
      ?.filter(b => b.requiresLicense && b.specifications?.engine)
      .reduce((max, b) => {
        const match = b.specifications!.engine.match(/(\d+)\s*(?:cv|hp|CV|HP)/i);
        const hp = match ? parseInt(match[1]) : 0;
        return hp > max ? hp : max;
      }, 0) || 150;

  const scrollToFleetWithFilter = (license: "no" | "yes") => {
    const fleet = document.getElementById("fleet");
    if (fleet) {
      fleet.scrollIntoView({ behavior: "smooth", block: "start" });
      // Dispatch custom event so FleetSection can pick up the filter
      window.dispatchEvent(new CustomEvent("fleet-filter", { detail: { license } }));
    }
  };

  return (
    <section
      ref={revealRef}
      className={`py-16 sm:py-20 lg:py-24 bg-muted/30 transition-[opacity,transform,filter] duration-500 ${isVisible ? "opacity-100 translate-y-0 blur-none" : "opacity-0 translate-y-8 blur-[2px]"}`}
    >
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground text-center tracking-tight mb-3">
          {t.comparison.title}
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          {t.comparison.subtitle}
        </p>

        {/* Captain's Pro Tip — free expert advice (reciprocity) */}
        <div className="mb-8 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl p-4 sm:p-5 flex gap-3 items-start">
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-foreground text-sm">{t.reciprocity?.captainTip}</span>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {t.reciprocity?.captainTipText}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Licensed fleet — leads the block since the 2026 pivot */}
          <div className="bg-card rounded-2xl border-2 border-cta/40 p-4 xs:p-6 sm:p-7 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {t.comparison.licenseRequired}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Ship className="w-8 h-8 text-cta flex-shrink-0" />
              <h3 className="font-heading text-lg sm:text-xl font-medium">
                {t.comparison.withLicense}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t.comparison.withLicenseDesc}</p>
            <ul className="space-y-3">
              {[
                t.comparison.licenseFeature1.replace("{maxHP}", String(maxEngineHP)),
                t.comparison.licenseFeature2,
                t.comparison.licenseFeature3,
                t.comparison.licenseFeature4,
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2">
              <div>
                <span className="text-xs text-muted-foreground">{t.comparison.fromPrice}</span>
                <span className="text-xl font-heading font-medium text-foreground ml-1">
                  {withLicenseMinPrice}€
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => scrollToFleetWithFilter("yes")}
                className="rounded-full text-sm"
                data-testid="button-comparison-licensed"
              >
                {t.comparison.viewBoats}
              </Button>
            </div>
          </div>

          {/* 2. Titulín pack — course + rental, no price published */}
          <div className="bg-card rounded-2xl border border-card-border p-4 xs:p-6 sm:p-7 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {t.comparison.titulinBadge}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="w-8 h-8 text-cta flex-shrink-0" />
              <h3 className="font-heading text-lg sm:text-xl font-medium">
                {t.comparison.titulin}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t.comparison.titulinDesc}</p>
            <ul className="space-y-3">
              {[
                t.comparison.titulinFeature1,
                t.comparison.titulinFeature2,
                t.comparison.titulinFeature3,
                t.comparison.titulinFeature4,
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button
                asChild
                variant="outline"
                className="rounded-full text-sm"
                data-testid="button-comparison-titulin"
              >
                <a href={localizedPath("navigationLicense")}>{t.comparison.titulinCta}</a>
              </Button>
            </div>
          </div>

          {/* 3. Captained excursion — never affected by RD 1188/2025 */}
          <div className="bg-card rounded-2xl border border-card-border p-4 xs:p-6 sm:p-7 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {t.comparison.captainedBadge}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Anchor className="w-8 h-8 text-cta flex-shrink-0" />
              <h3 className="font-heading text-lg sm:text-xl font-medium">
                {t.comparison.captained}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t.comparison.captainedDesc}</p>
            <ul className="space-y-3">
              {[
                t.comparison.captainedFeature1,
                t.comparison.captainedFeature2,
                t.comparison.captainedFeature3,
                t.comparison.captainedFeature4,
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border flex justify-end">
              <Button
                asChild
                variant="outline"
                className="rounded-full text-sm"
                data-testid="button-comparison-captained"
              >
                <a href={localizedPath("categoryCaptained")}>{t.comparison.captainedCta}</a>
              </Button>
            </div>
          </div>
        </div>

        {/* License-free banner — self-retires on 2026-10-01 (RD 1188/2025) */}
        {licenseFreeEra && (
          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 sm:p-5">
            <p className="font-medium text-foreground text-sm">
              {t.comparison.licenseFreeBannerTitle}
            </p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {t.comparison.licenseFreeBannerBody}
            </p>
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground">
                {t.comparison.fromPrice}{" "}
                <span className="font-heading font-medium text-foreground">
                  {noLicenseMinPrice}€
                </span>
              </span>
              <a
                href={localizedPath("categoryLicenseFree")}
                className="text-sm font-medium text-cta underline underline-offset-2 hover:opacity-80"
                data-testid="link-comparison-license-free"
              >
                {t.comparison.licenseFreeBannerCta}
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
