import { Check, Anchor, Ship, Lightbulb } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useQuery } from "@tanstack/react-query";
import type { Boat } from "@shared/schema";

export function LicenseComparisonSection() {
  const t = useTranslations();

  const { data: boats } = useQuery<Boat[]>({ queryKey: ['/api/boats'] });

  const noLicenseMinPrice = boats
    ?.filter(b => !b.requiresLicense && b.pricing)
    .reduce((min, b) => {
      const prices = Object.values(b.pricing!.BAJA.prices);
      const boatMin = Math.min(...prices);
      return boatMin < min ? boatMin : min;
    }, Infinity) || 70;

  const withLicenseMinPrice = boats
    ?.filter(b => b.requiresLicense && b.pricing)
    .reduce((min, b) => {
      const prices = Object.values(b.pricing!.BAJA.prices);
      const boatMin = Math.min(...prices);
      return boatMin < min ? boatMin : min;
    }, Infinity) || 150;

  // Extract max engine HP from licensed boats
  const maxEngineHP = boats
    ?.filter(b => b.requiresLicense && b.specifications?.engine)
    .reduce((max, b) => {
      const match = b.specifications!.engine.match(/(\d+)\s*(?:cv|hp|CV|HP)/i);
      const hp = match ? parseInt(match[1]) : 0;
      return hp > max ? hp : max;
    }, 0) || 150;

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 max-w-4xl">
        <h2 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground text-center tracking-tight mb-3">
          {t.comparison.title}
        </h2>
        <p className="text-muted-foreground text-center mb-10 max-w-2xl mx-auto">
          {t.comparison.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Without License Card */}
          <div className="bg-white rounded-2xl border border-border p-4 xs:p-6 sm:p-8 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
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
            <div className="mt-6 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{t.comparison.fromPrice}</span>
              <span className="text-xl font-heading font-medium text-foreground ml-1">{noLicenseMinPrice}€</span>
            </div>
          </div>

          {/* With License Card */}
          <div className="bg-white rounded-2xl border border-border p-4 xs:p-6 sm:p-8 relative overflow-hidden">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1 rounded-full mb-4">
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
            <div className="mt-6 pt-4 border-t border-border">
              <span className="text-xs text-muted-foreground">{t.comparison.fromPrice}</span>
              <span className="text-xl font-heading font-medium text-foreground ml-1">{withLicenseMinPrice}€</span>
            </div>
          </div>
        </div>

        {/* Captain's Pro Tip — free expert advice (reciprocity) */}
        <div className="mt-8 bg-amber-50/70 border-l-4 border-amber-400 rounded-r-xl p-4 sm:p-5 flex gap-3 items-start">
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-foreground text-sm">{t.reciprocity?.captainTip}</span>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.reciprocity?.captainTipText}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
