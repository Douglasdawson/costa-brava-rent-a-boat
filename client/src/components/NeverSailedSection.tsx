import { MapPin, GraduationCap, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/translations";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  { icon: MapPin, titleKey: "step1Title", descKey: "step1Desc" },
  { icon: GraduationCap, titleKey: "step2Title", descKey: "step2Desc" },
  { icon: Compass, titleKey: "step3Title", descKey: "step3Desc" },
] as const;

export default function NeverSailedSection() {
  const t = useTranslations();
  const { ref: revealRef, isVisible } = useScrollReveal();

  const handleCTA = () => {
    const fleet = document.getElementById("fleet");
    if (fleet) {
      fleet.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={revealRef} className={`below-fold py-16 md:py-24 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <div className="container mx-auto px-4 max-w-4xl text-center">
        {/* Header */}
        <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
          {t.neverSailed.title}
        </h2>
        <p className="text-muted-foreground text-lg md:text-xl mb-12 md:mb-16 max-w-2xl mx-auto">
          {t.neverSailed.subtitle}
        </p>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-10 md:gap-8 mb-12 md:mb-16">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-10 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border"
            aria-hidden="true"
          />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative flex flex-col items-center flex-1 max-w-xs"
              >
                {/* Step number + icon */}
                <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <Icon className="w-8 h-8 text-primary" strokeWidth={1.5} />
                </div>

                {/* Step number badge */}
                <span className="absolute top-0 right-[calc(50%-40px)] -translate-y-1 translate-x-[-4px] w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>

                {/* Text */}
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {t.neverSailed[step.titleKey]}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t.neverSailed[step.descKey]}
                </p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <Button
          onClick={handleCTA}
          size="lg"
          className="font-sans text-base px-8"
        >
          {t.neverSailed.cta}
        </Button>
      </div>
    </section>
  );
}
