import { Shield, ShieldCheck, Award, Anchor, ChevronRight } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { isLicenseFreeEraActive } from "@shared/constants";

export default function FeaturesSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Main Features */}
        <div className="mb-10 max-w-2xl sm:mb-12">
          <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl md:text-4xl">
            {t.features.whyUs}
          </h2>
          <p className="mt-3 text-base text-muted-foreground text-pretty sm:text-lg">
            {t.features.whyUsSub}
          </p>
        </div>

        {/* Authority Trust Strip */}
        <div className="bg-muted/50 rounded-lg py-5 px-4 mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">
                {t.authority?.fleetInsured || "Seguro de RC y accidentes incluido"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">
                {t.authority?.zeroIncidents || "0 incidentes de seguridad"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Award className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">
                {t.authority?.certifiedCaptains || "Capitanes certificados"}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Anchor className="w-4 h-4 flex-shrink-0 text-foreground/60" />
              <span className="text-xs sm:text-sm font-medium">
                {t.authority?.officialPort || "Puerto oficial de Blanes"}
              </span>
            </div>
          </div>
        </div>

        {/* Internal Links - Explore More */}
        <div className="border-t border-border pt-8 sm:pt-12 mt-8 sm:mt-12">
          <h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground tracking-tight text-center mb-6">
            {t.features.exploreMore || "Explora nuestros servicios"}
          </h3>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            {/* The licence-free category retires on 2026-10-01 (RD 1188/2025): no link after that. */}
            {isLicenseFreeEraActive() && (
              <a
                href={localizedPath("categoryLicenseFree")}
                className="text-primary dark:text-sky-300 hover:underline flex items-center gap-1 text-sm sm:text-base whitespace-nowrap pointer-coarse:py-3"
              >
                <ChevronRight className="w-4 h-4" />
                {t.features.exploreLinks?.licenseFree || "Barcos sin licencia"}
              </a>
            )}
            <a
              href={localizedPath("categoryLicensed")}
              className="text-primary dark:text-sky-300 hover:underline flex items-center gap-1 text-sm sm:text-base whitespace-nowrap pointer-coarse:py-3"
            >
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.licensed || "Barcos con licencia"}
            </a>
            <a
              href={localizedPath("navigationLicense")}
              className="text-primary dark:text-sky-300 hover:underline flex items-center gap-1 text-sm sm:text-base whitespace-nowrap pointer-coarse:py-3"
            >
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.navigationLicense || "Licencia de Navegación (titulín)"}
            </a>
            <a
              href={localizedPath("pricing")}
              className="text-primary dark:text-sky-300 hover:underline flex items-center gap-1 text-sm sm:text-base whitespace-nowrap pointer-coarse:py-3"
            >
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.pricing || "Precios y tarifas"}
            </a>
            <a
              href={localizedPath("locationCostaBrava")}
              className="text-primary dark:text-sky-300 hover:underline flex items-center gap-1 text-sm sm:text-base whitespace-nowrap pointer-coarse:py-3"
            >
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.costaBrava || "Alquiler barcos Costa Brava"}
            </a>
            <a
              href={localizedPath("blog")}
              className="text-primary dark:text-sky-300 hover:underline flex items-center gap-1 text-sm sm:text-base whitespace-nowrap pointer-coarse:py-3"
            >
              <ChevronRight className="w-4 h-4" />
              {t.features.exploreLinks?.blog || "Blog de navegación"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
