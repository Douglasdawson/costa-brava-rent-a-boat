import { useState, useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, ExternalLink, GraduationCap, Plus } from "lucide-react";
import { SiWhatsapp } from "@/components/icons/BrandIcons";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { CourseRail } from "@/components/TitulinSection";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { trackFaqExpanded } from "@/utils/analytics";
import { generateHreflangLinks, generateCanonicalUrl, BASE_DOMAIN } from "@/utils/seo-config";
import { generateBreadcrumbSchema, generateFAQSchema } from "@/utils/seo-schemas";
import { getLocalizedPath } from "@shared/i18n-routes";
import { escolaNauticaHandoff } from "@shared/escolaNauticaLinks";
import { useBookingModal } from "@/hooks/bookingModalContext";
import { MobileStickyBar } from "@/components/MobileStickyBar";

const WHATSAPP_NUMBER = "34611500372";
const EASE = [0.22, 1, 0.36, 1] as const;

/** Navy band shared with the home (TitulinSection): brand navy, a shade lighter than the page in dark mode. */
const NAVY = "bg-primary text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground";
const NAVY_BG = "bg-primary dark:bg-[hsl(215_45%_16%)]";
/** Light panel that sits on a navy band. */
const PANEL_ON_NAVY = "rounded-2xl bg-background text-foreground dark:bg-[hsl(215_45%_22%)]";

const H2 = "font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance";
const SHEET = "rounded-b-2xl squircle-b";

/**
 * Entrance by translate only, never by opacity: the text is always painted, the reveal only
 * moves it into place, so a hidden tab or a slow observer can't leave a section blank.
 */
function Rise({
  children,
  className,
  x = 0,
  y = 24,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  x?: number;
  y?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { x, y }}
      whileInView={{ x: 0, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const itemVariants = {
  hidden: { y: 18 },
  show: { y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** One FAQ card. Born folded; the answer stays in the DOM (hidden from view and AT) for SEO. */
function FaqItem({
  id,
  question,
  answer,
  open,
  onToggle,
}: {
  id: string;
  question: string;
  answer: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border transition-colors duration-200",
        open
          ? "border-primary/40 bg-primary/5"
          : "border-border bg-card [@media(hover:hover)]:hover:border-foreground/25"
      )}
    >
      <h3>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className="group flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
        >
          <span className="flex-1 text-base font-semibold leading-snug text-foreground">
            {question}
          </span>
          <Plus
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-[transform,color] duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:text-foreground",
              open && "rotate-45"
            )}
            aria-hidden="true"
          />
        </button>
      </h3>
      <div
        id={`${id}-a`}
        role="region"
        aria-labelledby={`${id}-q`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <p
            className={cn(
              "px-5 pb-5 text-base leading-relaxed text-muted-foreground text-pretty",
              !open && "invisible"
            )}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Pillar page for the Licencia de Navegación (titulín): what it is, what it
 * allows, how to get it, and why it matters from 2026-10-01 (RD 1188/2025
 * requires every rental customer to hold a nautical title).
 *
 * Since the 2026-08 pivot this page sells the titulín + rental pack: we arrange
 * the course and combine it with the first rental. No price is published yet
 * (the nautical school side is still pre-launch), so every CTA routes to
 * WhatsApp for a quote. Add the price here when it is closed.
 *
 * Layout follows the home: stacked sheets with rounded bottom corners, each wrapped
 * in the colour of the next band so the corner reveals it; navy band for the course.
 */
export default function NavigationLicensePage() {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const { openBookingModal } = useBookingModal();
  const p = t.navigationLicensePage;
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const hreflangLinks = generateHreflangLinks("navigationLicense");
  const canonical = generateCanonicalUrl("navigationLicense", language);
  const licensedFleetPath = getLocalizedPath("categoryLicensed", language);
  const captainedPath = getLocalizedPath("categoryCaptained", language);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(p?.whatsappMessage || "")}`;
  // null fuera de es/ca/en: la escuela hermana existe solo en castellano. Es un enlace
  // SECUNDARIO (no vende: aun no esta autorizada); el CTA principal es reservar o ver las
  // lanchas con licencia. Fuera de esos 3 idiomas el secundario es el WhatsApp.
  const school = escolaNauticaHandoff(language, "titulin-course");
  const secondaryHref = school ? school.url : whatsappUrl;
  const secondaryLabel = school ? school.cta : p?.ctaButton;
  const SecondaryIcon = school ? ExternalLink : SiWhatsapp;

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const heroImage =
    "/images/boats/trimarchi/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-pareja-navegando.webp";
  const fleetImage =
    "/images/alquiler-barco-trimarchi-57s-rent-a-boat-costa-brava-blanes-amigos-snorkel.webp";

  const [whatIsLead = "", ...whatIsFacts] = (p?.whatIs?.body || "")
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

  const faq = p?.faq || [];
  const jsonLd = [
    generateBreadcrumbSchema([
      { name: t.nav.home, url: generateCanonicalUrl("home", language) },
      { name: p?.navLabel || "Titulín", url: canonical },
    ]),
    generateFAQSchema(faq.map(f => ({ question: f.q, answer: f.a }))),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={p?.seoTitle || p?.hero?.title || "Licencia de Navegación (Titulín)"}
        description={p?.seoDescription || p?.hero?.subtitle || ""}
        keywords={p?.navLabel}
        canonical={canonical}
        ogImage={`${BASE_DOMAIN}${heroImage}`}
        hreflang={hreflangLinks}
        jsonLd={jsonLd}
      />
      <Navigation />

      {/* HERO: photo sheet over the navy rule band */}
      <div className={NAVY_BG}>
        <section
          className={`relative isolate flex min-h-[100svh] items-center sm:min-h-[80svh] overflow-hidden ${SHEET} pb-16 pt-28`}
        >
          <img
            src={heroImage}
            alt={p?.hero?.title || "Licencia de Navegación en Blanes"}
            width={1180}
            height={750}
            decoding="async"
            draggable={false}
            className={`absolute inset-0 -z-10 h-full w-full object-cover will-change-transform transition-transform duration-[1200ms] ease-out motion-reduce:transition-none ${mounted ? "scale-100" : "scale-[1.06]"}`}
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

          <div
            className={`mx-auto w-full max-w-3xl px-4 text-center text-white transition-transform duration-700 ease-out motion-reduce:transition-none sm:px-6 ${mounted ? "translate-y-0" : "translate-y-4"}`}
          >
            <h1 className="font-heading text-display font-semibold text-balance [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.4)]">
              {p?.hero?.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 text-pretty [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
              {p?.hero?.subtitle}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <InteractiveHoverButton
                tone="dark"
                as={Link}
                href={licensedFleetPath}
                className="min-h-12 w-full px-8 text-base sm:w-auto"
                data-testid="cta-hero-titulin"
              >
                {p?.fleet?.cta}
              </InteractiveHoverButton>
              <a
                href={secondaryHref}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white/70 bg-white/10 px-6 text-base font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 motion-reduce:transition-none sm:w-auto"
                data-testid="link-hero-titulin-secondary"
              >
                {secondaryLabel}
                <SecondaryIcon className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            {/* Four facts as one ruled strip, not four loose pills. */}
            {(p?.chips || []).length > 0 && (
              <ul className="mx-auto mt-10 grid max-w-2xl grid-cols-2 overflow-hidden rounded-2xl border border-white/25 bg-black/25 text-sm text-white sm:grid-cols-4">
                {(p?.chips || []).map(chip => (
                  <li
                    key={chip}
                    className="flex items-center justify-center border-white/25 px-3 py-3.5 text-center leading-snug text-balance [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+2)]:border-l sm:[&:nth-child(n+3)]:border-t-0"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* NEW RULE (RD 1188/2025): navy band, the note as its own light panel */}
      <section className={`${SHEET} ${NAVY} py-16 sm:py-24`} aria-labelledby="titulin-rule-title">
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-[6fr_5fr] lg:gap-16">
          <Rise x={-24} y={0}>
            <h2 id="titulin-rule-title" className={H2}>
              {p?.newRule?.title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
              {p?.newRule?.body}
            </p>
          </Rise>
          <Rise x={24} y={0} delay={0.1}>
            <p
              className={`${PANEL_ON_NAVY} p-6 text-base font-medium leading-relaxed text-pretty sm:p-8 sm:text-lg`}
            >
              {p?.newRule?.note}
            </p>
          </Rise>
        </div>
      </section>

      {/* WHAT IT IS + WHAT IT ALLOWS */}
      <div className={NAVY_BG}>
        <section className={`${SHEET} bg-background py-16 sm:py-24`}>
          <div className="container mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-start lg:gap-20">
            <Rise>
              <h2 className={H2}>{p?.whatIs?.title}</h2>
              {/* El cuerpo es un solo parrafo de 3 frases: la primera es la definicion
                  (destacada) y cada una de las demas es un dato suelto, con su filete. */}
              <p className="mt-5 max-w-xl text-lg font-medium leading-snug text-foreground text-pretty sm:text-xl">
                {whatIsLead}
              </p>
              <ul className="mt-6 max-w-xl border-t border-border">
                {whatIsFacts.map(fact => (
                  <li
                    key={fact}
                    className="border-b border-border py-4 text-base leading-relaxed text-muted-foreground text-pretty"
                  >
                    {fact}
                  </li>
                ))}
              </ul>
            </Rise>
            <Rise delay={0.1}>
              <h2 className={H2}>{p?.allows?.title}</h2>
              <motion.ul
                variants={listVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                className="mt-6 overflow-hidden rounded-2xl border border-border bg-card"
              >
                {(p?.allows?.items || []).map(item => (
                  <motion.li
                    key={item}
                    variants={itemVariants}
                    className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
                  >
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-base leading-snug text-foreground text-pretty">
                      {item}
                    </span>
                  </motion.li>
                ))}
              </motion.ul>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
                {p?.allows?.note}
              </p>
            </Rise>
          </div>
        </section>
      </div>

      {/* COURSE: the same scroll-driven rail as the home (a real sequence: theory, practice, licence) */}
      <div className="bg-muted/40">
        <section
          className={`${SHEET} ${NAVY} py-16 sm:py-24`}
          aria-labelledby="titulin-course-title"
        >
          <div className="container mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-[6fr_5fr] lg:items-center lg:gap-20">
              <Rise>
                <h2 id="titulin-course-title" className={H2}>
                  {p?.course?.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
                  {p?.course?.note}
                </p>
              </Rise>
              {p?.course?.steps && <CourseRail steps={p.course.steps} />}
            </div>

            {school && (
              <Rise
                className={`${PANEL_ON_NAVY} mt-14 grid gap-6 p-6 sm:mt-16 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10`}
              >
                {/* Aqui el WhatsApp, no la escuela: los CTA grandes ya llevan alli, y este
                    bloque es justo el que explica que hacer si necesitas el titulo antes de
                    que la escuela abra. Sin el, la pagina se queda sin via de contacto. */}
                <div className="max-w-2xl">
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                    {school.title}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground text-pretty">
                    {school.body}
                  </p>
                </div>
                <InteractiveHoverButton
                  tone="dark"
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener"
                  className="min-h-12 px-7 text-base"
                  data-testid="link-titulin-whatsapp"
                >
                  {p?.ctaButton}
                </InteractiveHoverButton>
              </Rise>
            )}
          </div>
        </section>
      </div>

      {/* FLEET BRIDGE */}
      <section
        className={`${SHEET} bg-muted/40 py-16 sm:py-24`}
        aria-labelledby="titulin-fleet-title"
      >
        <div className="container mx-auto grid max-w-6xl items-center gap-10 px-4 lg:grid-cols-2 lg:gap-16">
          <Rise x={-24} y={0}>
            <div className="group/photo overflow-hidden rounded-2xl">
              <img
                src={fleetImage}
                alt={p?.fleet?.title || "Trimarchi 57S en la Costa Brava"}
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover/photo:scale-[1.03]"
              />
            </div>
          </Rise>
          <Rise x={24} y={0} delay={0.1}>
            <h2 id="titulin-fleet-title" className={H2}>
              {p?.fleet?.title}
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              {p?.fleet?.body}
            </p>
            <InteractiveHoverButton
              tone="dark"
              as={Link}
              href={licensedFleetPath}
              className="mt-8 min-h-12 px-7 text-base"
            >
              {p?.fleet?.cta}
            </InteractiveHoverButton>
          </Rise>
        </div>
      </section>

      {/* FAQ: navy aside + folded cards, as the home */}
      {faq.length > 0 && (
        <div className="bg-muted/40">
          <section
            className={`${SHEET} bg-background py-16 sm:py-24`}
            aria-labelledby="titulin-faq-title"
          >
            <div className="container mx-auto max-w-6xl px-4">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
                <aside className="flex flex-col justify-between gap-10 rounded-2xl bg-cta p-7 text-primary-foreground dark:text-background sm:p-9 lg:sticky lg:top-[calc(var(--nav-height,5rem)+1rem)] lg:self-start">
                  <div>
                    <h2 id="titulin-faq-title" className={H2}>
                      {p?.faqTitle}
                    </h2>
                    {t.faqPreview?.subtitle && (
                      <p className="mt-4 max-w-md text-base leading-relaxed opacity-80 text-pretty">
                        {t.faqPreview.subtitle}
                      </p>
                    )}
                  </div>
                  <a
                    href={localizedPath("faq")}
                    className="group inline-flex min-h-11 w-full items-center justify-between gap-4 rounded-full bg-background px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-cta motion-reduce:transition-none sm:w-auto sm:self-start"
                  >
                    {t.faqPreview?.viewAll}
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </a>
                </aside>

                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "0px 0px -8% 0px" }}
                  className="flex flex-col gap-3 sm:gap-4"
                >
                  {faq.map((f, i) => (
                    <motion.div key={f.q} variants={itemVariants}>
                      <FaqItem
                        id={`titulin-faq-${i}`}
                        question={f.q}
                        answer={f.a}
                        open={openFaq === i}
                        onToggle={() => {
                          const next = openFaq === i ? null : i;
                          setOpenFaq(next);
                          if (next !== null) trackFaqExpanded(`titulin-${i}`);
                        }}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* NO-LICENCE ALTERNATIVE (captained excursion) */}
      <section
        className={`${SHEET} bg-muted/40 py-16 sm:py-24`}
        aria-labelledby="titulin-alt-title"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <Rise className="grid gap-6 rounded-2xl border border-border bg-card p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
            <div className="max-w-2xl">
              <h2
                id="titulin-alt-title"
                className="font-heading text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
              >
                {p?.alternative?.title}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
                {p?.alternative?.body}
              </p>
            </div>
            <InteractiveHoverButton
              tone="dark"
              as={Link}
              href={captainedPath}
              className="min-h-12 px-7 text-base"
            >
              {p?.alternative?.cta}
            </InteractiveHoverButton>
          </Rise>
        </div>
      </section>

      {/* FINAL CTA: closes over the footer colour */}
      <div className="bg-foreground">
        <section
          className={`${SHEET} bg-background py-16 sm:py-24`}
          aria-labelledby="titulin-final-title"
        >
          <Rise className="container mx-auto max-w-6xl px-4 text-center">
            <h2 id="titulin-final-title" className={`${H2} xl:whitespace-nowrap`}>
              {p?.ctaTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              {p?.ctaText}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <InteractiveHoverButton
                tone="dark"
                href={whatsappUrl}
                target="_blank"
                rel="noopener"
                className="min-h-12 px-8 text-base"
                data-testid="cta-final-titulin"
              >
                {p?.ctaButton}
              </InteractiveHoverButton>
              {school && (
                <a
                  href={school.url}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none"
                  data-testid="link-final-titulin-school"
                >
                  {school.cta}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
            </div>
          </Rise>
        </section>

        {/* Sticky mobile CTA (its spacer sits inside the footer-coloured wrapper, so the sheet's corners stay clean) */}
        <MobileStickyBar>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 leading-tight">
              <GraduationCap className="h-4 w-4 flex-shrink-0 text-success" />
              <p className="text-sm font-bold text-foreground">{p?.chips?.[0]}</p>
            </div>
            <button
              type="button"
              onClick={() => openBookingModal()}
              className="inline-flex min-h-11 flex-shrink-0 items-center justify-center gap-2 rounded-full bg-cta px-6 text-sm font-semibold text-cta-foreground transition-colors hover:bg-cta/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2"
              data-testid="cta-sticky-titulin"
            >
              {t.nav.bookNow}
            </button>
          </div>
        </MobileStickyBar>
      </div>

      <Footer />
    </div>
  );
}
