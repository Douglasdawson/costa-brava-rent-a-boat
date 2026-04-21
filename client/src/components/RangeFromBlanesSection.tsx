import { Anchor, MapPin, ChevronRight, Compass } from "lucide-react";
import { Link } from "wouter";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// Structural data, not translatable. Proper nouns (place names) stay in
// Spanish/Catalan regardless of locale because they are geographic names.
interface CalaStop {
  n: number;
  name: string;
  time: string;
  nm: number;
  limit?: boolean;
}
const SIN_LICENCIA_CALAS: readonly CalaStop[] = [
  { n: 1, name: "Sa Forcanera", time: "5 min", nm: 0.4 },
  { n: 2, name: "Cala Sant Francesc (Blanes)", time: "8 min", nm: 0.7 },
  { n: 3, name: "Cala de s'Agulla", time: "12 min", nm: 1.2 },
  { n: 4, name: "Cala Treumal", time: "15 min", nm: 1.6 },
  { n: 5, name: "Playa de Santa Cristina", time: "18 min", nm: 2.0 },
  { n: 6, name: "Cala Sa Boadella", time: "22 min", nm: 2.4 },
  { n: 7, name: "Playa de Fenals", time: "25 min", nm: 2.8, limit: true },
];

interface RangeFromBlanesSectionProps {
  variant?: "home" | "lloret";
}

export default function RangeFromBlanesSection({ variant = "home" }: RangeFromBlanesSectionProps) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const { ref: revealRef, isVisible } = useScrollReveal();

  const r = t.rangeFromBlanes;
  const eyebrow = variant === "lloret" ? r?.eyebrowLloret : r?.eyebrowHome;
  const headline = variant === "lloret" ? r?.headlineLloret : r?.headlineHome;
  const intro = variant === "lloret" ? r?.introLloret : r?.introHome;

  return (
    <section
      ref={revealRef}
      className={`py-16 sm:py-20 lg:py-24 bg-background transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      aria-labelledby="range-from-blanes-title"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          {eyebrow && (
            <span className="inline-block text-xs font-semibold tracking-widest text-primary uppercase mb-3">
              {eyebrow}
            </span>
          )}
          <h2
            id="range-from-blanes-title"
            className="font-heading text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-4"
          >
            {headline}
          </h2>
          {intro && (
            <p className="text-muted-foreground text-base sm:text-lg max-w-3xl mx-auto leading-relaxed">
              {intro}
            </p>
          )}
        </div>

        {/* Sin licencia — timeline */}
        <div className="mb-12">
          <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Anchor className="w-5 h-5 text-green-600" />
            {r?.sinLicenciaTitle}
          </h3>

          {/* Mobile: vertical timeline; Desktop: horizontal cards */}
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 sm:gap-4">
            {SIN_LICENCIA_CALAS.map((c) => (
              <li
                key={c.n}
                className={`relative rounded-xl border p-4 ${c.limit ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : "bg-muted/30 border-border"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${c.limit ? "bg-amber-500 text-white" : "bg-primary/10 text-primary"}`}>
                    {c.n}
                  </span>
                  {c.limit && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      {r?.limitLabel}
                    </span>
                  )}
                </div>
                <div className="font-semibold text-sm text-foreground leading-tight">
                  {c.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {c.time} · {c.nm} nm
                </div>
              </li>
            ))}
          </ol>

          {/* Note about Fenals being the limit */}
          <div className="mt-6 bg-amber-50/70 dark:bg-amber-950/30 border-l-4 border-amber-400 rounded-r-xl p-4 sm:p-5">
            <div className="font-semibold text-sm text-foreground mb-1">{r?.limitBoxTitle}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{r?.limitBoxBody}</p>
            <p className="text-xs text-muted-foreground mt-2 italic">{r?.noteNorthOfFenals}</p>
          </div>
        </div>

        {/* Con licencia — extension */}
        <div className="mb-10">
          <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground mb-3 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            {r?.conLicenciaTitle}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base mb-4 leading-relaxed">
            {r?.conLicenciaIntro}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-3xl">
            {[
              r?.ext?.lloretCenter,
              r?.ext?.canyelles,
              r?.ext?.morisca,
              r?.ext?.tossa,
              r?.ext?.platjaAro,
            ].filter(Boolean).map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8">
          <button
            type="button"
            onClick={() => {
              const fleet = document.getElementById("fleet");
              if (fleet) fleet.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-cta hover:bg-cta/90 text-white font-semibold text-sm transition-colors"
          >
            <Anchor className="w-4 h-4" />
            {r?.ctaFleet}
          </button>
          <Link
            href={localizedPath("categoryLicensed")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:border-primary/40 text-foreground font-semibold text-sm transition-colors"
          >
            <Compass className="w-4 h-4" />
            {r?.ctaLicensed}
          </Link>
        </div>

        {/* Internal links (only on home variant — lloret page has its own links) */}
        {variant === "home" && r?.internalLinks && (
          <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
            <MapPin className="w-4 h-4 inline-block mr-1 -mt-0.5 text-primary/70" />
            <span dangerouslySetInnerHTML={{ __html: r.internalLinks }} />
          </p>
        )}
      </div>
    </section>
  );
}
