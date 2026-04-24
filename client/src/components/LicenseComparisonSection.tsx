import { Check, Anchor, Ship, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Boat } from "@shared/schema";
import { getMinActivePrice } from "@shared/pricing";

export default function LicenseComparisonSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();

  const { data: boats } = useQuery<Boat[]>({ queryKey: ['/api/boats'] });

  const noLicenseMinPriceRaw = boats
    ?.filter(b => !b.requiresLicense && b.pricing)
    .reduce((min, b) => {
      const boatMin = getMinActivePrice(b.pricing!.BAJA?.prices);
      return boatMin !== null && boatMin < min ? boatMin : min;
    }, Infinity);
  const noLicenseMinPrice = noLicenseMinPriceRaw && Number.isFinite(noLicenseMinPriceRaw)
    ? noLicenseMinPriceRaw
    : 70;

  const withLicenseMinPriceRaw = boats
    ?.filter(b => b.requiresLicense && b.pricing)
    .reduce((min, b) => {
      const boatMin = getMinActivePrice(b.pricing!.BAJA?.prices);
      return boatMin !== null && boatMin < min ? boatMin : min;
    }, Infinity);
  const withLicenseMinPrice = withLicenseMinPriceRaw && Number.isFinite(withLicenseMinPriceRaw)
    ? withLicenseMinPriceRaw
    : 150;

  // Extract max engine HP from licensed boats
  const maxEngineHP = boats
    ?.filter(b => b.requiresLicense && b.specifications?.engine)
    .reduce((max, b) => {
      const match = b.specifications!.engine.match(/(\d+)\s*(?:cv|hp|CV|HP)/i);
      const hp = match ? parseInt(match[1]) : 0;
      return hp > max ? hp : max;
    }, 0) || 150;

  const scrollToFleetWithFilter = (license: 'no' | 'yes') => {
    const fleet = document.getElementById('fleet');
    if (fleet) {
      fleet.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Dispatch custom event so FleetSection can pick up the filter
      window.dispatchEvent(new CustomEvent('fleet-filter', { detail: { license } }));
    }
  };

  return (
    <section ref={revealRef} className={`py-16 sm:py-20 lg:py-24 bg-muted/30 transition-[opacity,transform] duration-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
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
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.reciprocity?.captainTipText}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Without License Card */}
          <div className="bg-background rounded-2xl border border-border p-4 xs:p-6 sm:p-8 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {t.comparison.noLicenseNeeded}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Anchor className="w-8 h-8 text-cta" />
              <h3 className="font-heading text-xl font-medium">{t.comparison.withoutLicense}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t.comparison.withoutLicenseDesc}</p>
            <ul className="space-y-3">
              {[
                t.comparison.noLicenseFeature1,
                t.comparison.noLicenseFeature2,
                t.comparison.noLicenseFeature3,
                t.comparison.noLicenseFeature4,
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">{t.comparison.fromPrice}</span>
                <span className="text-xl font-heading font-medium text-foreground ml-1">{noLicenseMinPrice}€</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => scrollToFleetWithFilter('no')}
                  className="rounded-full text-sm"
                >
                  {t.comparison.viewBoats}
                </Button>
                <Link href={localizedPath("categoryLicenseFree")}>
                  <Button variant="ghost" className="rounded-full text-sm text-muted-foreground hover:text-foreground">
                    {t.comparison.viewAll}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* With License Card */}
          <div className="bg-background rounded-2xl border border-border p-4 xs:p-6 sm:p-8 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-xs font-medium px-3 py-1 rounded-full mb-4">
              {t.comparison.licenseRequired}
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Ship className="w-8 h-8 text-cta" />
              <h3 className="font-heading text-xl font-medium">{t.comparison.withLicense}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t.comparison.withLicenseDesc}</p>
            <ul className="space-y-3">
              {[
                t.comparison.licenseFeature1.replace('{maxHP}', String(maxEngineHP)),
                t.comparison.licenseFeature2,
                t.comparison.licenseFeature3,
                t.comparison.licenseFeature4,
              ].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <Check className={`w-4 h-4 flex-shrink-0 ${i === 3 ? 'text-amber-500' : 'text-green-500'}`} />
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">{t.comparison.fromPrice}</span>
                <span className="text-xl font-heading font-medium text-foreground ml-1">{withLicenseMinPrice}€</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => scrollToFleetWithFilter('yes')}
                  className="rounded-full text-sm"
                >
                  {t.comparison.viewBoats}
                </Button>
                <Link href={localizedPath("categoryLicensed")}>
                  <Button variant="ghost" className="rounded-full text-sm text-muted-foreground hover:text-foreground">
                    {t.comparison.viewAll}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
