import { Link } from "wouter";
import { useRef } from "react";
import { Check } from "lucide-react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
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
interface CourseStep {
  title: string;
  description: string;
}

/**
 * One step of the course rail, driven by the scroll progress of the whole list (0..1), never by a timed
 * reveal: nothing can stay hidden, the text is only dimmed until the thread reaches it. The thread fills
 * down to each node, the node disc springs in (small overshoot), the number swaps to dark on the light disc.
 */
function CourseStepItem({
  step,
  index,
  total,
  progress,
}: {
  step: CourseStep;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const span = 0.9 / Math.max(total - 1, 1);
  const a = index * span; // progress at which this node starts to light
  const b = a + 0.06;
  const next = (index + 1) * span; // where the thread reaches the next node

  const disc = useSpring(useTransform(progress, [a, b], [0, 1]), {
    stiffness: 320,
    damping: 17,
    mass: 0.7,
  });
  const numLight = useTransform(progress, [a, b], [1, 0]);
  const numDark = useTransform(progress, [a, b], [0, 1]);
  const textOpacity = useTransform(progress, [a, a + 0.1], [0.4, 1]);
  const textY = useTransform(progress, [a, a + 0.1], [8, 0]);
  const thread = useTransform(progress, [b, next], [0, 1]);

  return (
    <li className="relative pb-10 pl-16 last:pb-0">
      {index < total - 1 && (
        <>
          <span
            aria-hidden="true"
            className="absolute bottom-1 left-[19px] top-12 w-px bg-primary-foreground/20"
          />
          <motion.span
            aria-hidden="true"
            style={{ scaleY: thread }}
            className="absolute bottom-1 left-[19px] top-12 w-px origin-top bg-primary-foreground"
          />
        </>
      )}
      <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/40 font-heading text-base font-semibold">
        <motion.span
          aria-hidden="true"
          style={{ scale: disc }}
          className="absolute -inset-px rounded-full bg-primary-foreground"
        />
        <motion.span style={{ opacity: numLight }} className="relative text-primary-foreground/70">
          {index + 1}
        </motion.span>
        <motion.span
          aria-hidden="true"
          style={{ opacity: numDark }}
          className="absolute text-primary dark:text-chart-1"
        >
          {index + 1}
        </motion.span>
      </span>
      <motion.div style={{ opacity: textOpacity, y: textY }}>
        <h3 className="font-heading text-xl font-semibold leading-tight lg:text-2xl">
          {step.title}
        </h3>
        <p className="mt-2 max-w-md text-base leading-relaxed text-primary-foreground/85 text-pretty">
          {step.description}
        </p>
      </motion.div>
    </li>
  );
}

export function CourseRail({ steps }: { steps: CourseStep[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 60%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });
  const lit = useMotionValue(1); // reduced motion: everything already lit, static
  const progress = reduce ? lit : smooth;

  return (
    <ol ref={ref}>
      {steps.map((step, i) => (
        <CourseStepItem
          key={step.title}
          step={step}
          index={i}
          total={steps.length}
          progress={progress}
        />
      ))}
    </ol>
  );
}

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
      className="bg-primary py-16 text-primary-foreground rounded-b-2xl squircle-b dark:bg-[hsl(215_45%_16%)] dark:text-foreground sm:py-24"
      aria-labelledby="titulin-title"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-14 lg:grid-cols-[6fr_5fr] lg:items-center lg:gap-20">
          <div className="text-center">
            <h2
              id="titulin-title"
              className="font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance lg:text-[clamp(2.25rem,3.2vw,3rem)]"
            >
              {s.title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-primary-foreground/85 text-pretty sm:text-lg">
              {s.subtitle}
            </p>

            {/* Four facts as one ruled strip: equal cells, one hairline grid. */}
            {p?.chips && (
              <ul className="mx-auto mt-8 grid max-w-lg grid-cols-2 overflow-hidden rounded-2xl border border-primary-foreground/20 text-sm sm:text-base">
                {p.chips.map(chip => (
                  <li
                    key={chip}
                    className="flex items-center justify-center gap-2.5 border-primary-foreground/20 px-3 py-4 text-center text-primary-foreground/95 text-balance [&:nth-child(even)]:border-l [&:nth-child(n+3)]:border-t"
                  >
                    <Check
                      className="h-4 w-4 flex-shrink-0 text-primary-foreground/70"
                      aria-hidden="true"
                    />
                    {chip}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <InteractiveHoverButton
                tone="light"
                as={Link}
                href={localizedPath("navigationLicense")}
                className="min-h-12 px-7 text-base"
                data-testid="button-titulin-page"
              >
                {s.ctaPrimary}
              </InteractiveHoverButton>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary-foreground/40 px-6 text-base font-medium transition-colors hover:border-primary-foreground hover:bg-primary-foreground/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground motion-reduce:transition-none"
                data-testid="button-titulin-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5" aria-hidden="true" />
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
          {p?.course?.steps && <CourseRail steps={p.course.steps} />}
        </div>

        {/* Cross-sell to the sister school: its own light panel on the navy band,
            so it reads as a destination and not as a footnote. Copy is policed by
            escolaNauticaLinks.test.ts; never hand-write status, dates or prices. */}
        {school && (
          <div className="mt-14 grid gap-6 rounded-2xl bg-background p-6 text-foreground dark:bg-[hsl(215_45%_22%)] sm:mt-16 sm:p-8 md:grid-cols-[1fr_auto] md:items-center md:gap-10">
            <div className="max-w-2xl">
              <h3 className="font-heading text-xl font-semibold tracking-tight text-balance sm:text-2xl">
                {school.finalTitle}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground text-pretty">
                {school.finalBody}
              </p>
            </div>
            <InteractiveHoverButton
              tone="dark"
              href={school.url}
              target="_blank"
              rel="noopener"
              className="min-h-12 px-7 text-base"
              data-testid="link-titulin-school"
            >
              {school.cta}
            </InteractiveHoverButton>
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
