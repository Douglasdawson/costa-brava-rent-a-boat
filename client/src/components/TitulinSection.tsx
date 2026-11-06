import { Link } from "wouter";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { WHATSAPP_PHONE } from "@/lib/config";
import { isLicenseFreeEraActive } from "@shared/constants";
import { escolaNauticaHandoff } from "@shared/escolaNauticaLinks";

/**
 * Home: the titulín pitch. Sells what we arrange TODAY (the one-day course at an
 * authorised school near Blanes, combined with the first rental). Escola Nàutica
 * Blanes only appears through escolaNauticaHandoff(), whose copy is future tense
 * with a waiting list and is policed by shared/escolaNauticaLinks.test.ts:
 * never write the school's status, dates or prices here by hand.
 */
export default function TitulinSection() {
  const t = useTranslations();
  const { language, localizedPath } = useLanguage();
  const s = t.titulinSection;
  const p = t.navigationLicensePage;
  const school = escolaNauticaHandoff(language, "home");
  const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(p?.whatsappMessage || "")}`;

  return (
    <section
      id="titulin"
      className="bg-primary py-16 text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground sm:py-24"
      aria-labelledby="titulin-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-14 lg:grid-cols-[6fr_5fr] lg:items-center lg:gap-20">
          <div>
            <h2
              id="titulin-title"
              className="font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance lg:text-[clamp(2.25rem,3.2vw,3rem)]"
            >
              {s.title}
            </h2>
            <p className="mt-5 max-w-lg text-base text-primary-foreground/85 text-pretty sm:text-lg">
              {s.subtitle}
            </p>

            {p?.chips && (
              <ul className="mt-8 grid max-w-md grid-cols-1 gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                {p.chips.map(chip => (
                  <li key={chip} className="flex items-center gap-2.5 text-primary-foreground/90">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary-foreground/60" aria-hidden="true" />
                    {chip}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Button
                asChild
                size="lg"
                className="min-h-12 rounded-full bg-background px-7 text-base text-foreground hover:bg-background/90 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
                data-testid="button-titulin-page"
              >
                <Link href={localizedPath("navigationLicense")}>
                  {s.ctaPrimary}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 transition-opacity hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
                data-testid="button-titulin-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4" aria-hidden="true" />
                {p?.ctaButton}
              </a>
            </div>

            <p className="mt-8 text-sm text-primary-foreground/75">
              {s.captainedLine}{" "}
              <Link
                href={localizedPath("categoryCaptained")}
                className="inline-block py-3 -my-3 font-medium text-primary-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
              >
                {s.captainedCta}
              </Link>
            </p>
          </div>

          {/* The course IS a sequence, so the numbers carry information here:
              one continuous rail joins the three steps instead of three loose cards. */}
          <ol>
            {p?.course?.steps?.map((step, i) => (
              <li
                key={step.title}
                className="relative pb-10 pl-16 last:pb-0 before:absolute before:bottom-1 before:left-[19px] before:top-12 before:w-px before:bg-primary-foreground/25 last:before:hidden"
              >
                <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground font-heading text-base font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="font-heading text-xl font-semibold leading-tight lg:text-2xl">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-md text-base leading-relaxed text-primary-foreground/85 text-pretty">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>

        {school && (
          <div className="mt-16 flex flex-col gap-4 border-t border-primary-foreground/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="font-heading font-semibold">{school.finalTitle}</p>
              <p className="mt-1 text-sm leading-relaxed text-primary-foreground/90">
                {school.finalBody}
              </p>
            </div>
            <a
              href={school.url}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 flex-shrink-0 items-center gap-2 text-sm font-semibold underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
              data-testid="link-titulin-school"
            >
              {school.cta}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* Dated licence-free note: self-retires on 2026-10-01 (RD 1188/2025). */}
        {isLicenseFreeEraActive() && (
          <p className="mt-8 text-sm text-primary-foreground/75">
            {t.comparison.licenseFreeBannerTitle}.{" "}
            <Link
              href={localizedPath("categoryLicenseFree")}
              className="inline-block py-3 -my-3 font-medium text-primary-foreground underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
              data-testid="link-titulin-license-free"
            >
              {t.comparison.licenseFreeBannerCta}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
