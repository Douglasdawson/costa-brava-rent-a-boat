import { Shield, ShieldCheck, Award, Anchor, ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { isLicenseFreeEraActive } from "@shared/constants";

export default function FeaturesSection() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const reduce = useReducedMotion();

  const trust = [
    { Icon: Shield, text: t.authority?.fleetInsured || "Seguro de RC y accidentes incluido" },
    { Icon: ShieldCheck, text: t.authority?.zeroIncidents || "0 incidentes de seguridad" },
    { Icon: Award, text: t.authority?.certifiedCaptains || "Capitanes certificados" },
    { Icon: Anchor, text: t.authority?.officialPort || "Puerto oficial de Blanes" },
  ];

  const links = [
    // The licence-free category retires on 2026-10-01 (RD 1188/2025): no link after that.
    ...(isLicenseFreeEraActive()
      ? [
          {
            href: localizedPath("categoryLicenseFree"),
            label: t.features.exploreLinks?.licenseFree || "Barcos sin licencia",
          },
        ]
      : []),
    {
      href: localizedPath("categoryLicensed"),
      label: t.features.exploreLinks?.licensed || "Barcos con licencia",
    },
    {
      href: localizedPath("navigationLicense"),
      label: t.features.exploreLinks?.navigationLicense || "Licencia de Navegación (titulín)",
    },
    {
      href: localizedPath("pricing"),
      label: t.features.exploreLinks?.pricing || "Precios y tarifas",
    },
    {
      href: localizedPath("locationCostaBrava"),
      label: t.features.exploreLinks?.costaBrava || "Alquiler barcos Costa Brava",
    },
    { href: localizedPath("blog"), label: t.features.exploreLinks?.blog || "Blog de navegación" },
  ];

  return (
    <div className="bg-muted/40">
      <section className="rounded-b-2xl squircle-b bg-background py-16 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto mb-12 max-w-2xl text-center lg:max-w-none sm:mb-14">
            <h2 className="font-heading text-h2 font-semibold tracking-tight text-foreground text-balance lg:whitespace-nowrap">
              {t.features.whyUs}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
              {t.features.whyUsSub}
            </p>
          </div>

          {/* Authority: four proof points, each led by its own icon. Text is never gated on opacity
            (it only drifts 14px); the icon disc lands with a small overshoot and fires one ring. */}
          <motion.ul
            className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4 lg:gap-x-10"
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
          >
            {trust.map(({ Icon, text }) => (
              <motion.li
                key={text}
                variants={{
                  hidden: { y: 14 },
                  show: { y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="group/trust flex flex-col items-center gap-4 text-center"
              >
                <motion.span
                  variants={{
                    hidden: { scale: 0.6, opacity: 0 },
                    show: {
                      scale: 1,
                      opacity: 1,
                      transition: { type: "spring", stiffness: 260, damping: 16, mass: 0.8 },
                    },
                  }}
                  className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground/80 transition-colors duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover/trust:bg-cta [@media(hover:hover)]:group-hover/trust:text-cta-foreground"
                >
                  {!reduce && (
                    <motion.span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full border border-foreground/30"
                      variants={{
                        hidden: { scale: 1, opacity: 0 },
                        show: {
                          scale: [1, 1.7],
                          opacity: [0.7, 0],
                          transition: { duration: 1.1, delay: 0.35, ease: "easeOut" },
                        },
                      }}
                    />
                  )}
                  <Icon
                    className="h-6 w-6 transition-transform duration-300 motion-reduce:transition-none [@media(hover:hover)]:group-hover/trust:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </motion.span>
                <span className="max-w-[14rem] text-base font-medium leading-snug text-foreground text-balance">
                  {text}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Internal links: real touch targets instead of loose blue text. */}
          <nav
            aria-label={t.features.exploreMore || "Explora nuestros servicios"}
            className="mt-14 border-t border-border pt-10 sm:mt-16 sm:pt-12"
          >
            <h3 className="mb-6 text-center font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {t.features.exploreMore || "Explora nuestros servicios"}
            </h3>
            {/* Text stays visible (only a small rise on entry); the arrow and fill respond on real hover only. */}
            <motion.ul
              className="flex flex-wrap justify-center gap-2.5"
              initial={reduce ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            >
              {links.map(link => (
                <motion.li
                  key={link.href}
                  variants={{
                    hidden: { y: 10 },
                    show: { y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <a
                    href={link.href}
                    className="group/link inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border bg-background pl-4 pr-3 text-sm font-medium text-foreground transition-[background-color,color,border-color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 active:scale-[0.98] [@media(hover:hover)]:hover:border-cta [@media(hover:hover)]:hover:bg-cta [@media(hover:hover)]:hover:text-cta-foreground"
                  >
                    {link.label}
                    <ArrowUpRight
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-[transform,color] duration-200 [@media(hover:hover)]:group-hover/link:-translate-y-0.5 [@media(hover:hover)]:group-hover/link:translate-x-0.5 [@media(hover:hover)]:group-hover/link:text-current"
                      aria-hidden="true"
                    />
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </nav>
        </div>
      </section>
    </div>
  );
}
