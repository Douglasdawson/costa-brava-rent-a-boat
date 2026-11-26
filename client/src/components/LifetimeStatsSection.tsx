import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "motion/react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { useLifetimeStats } from "@/hooks/useLifetimeStats";

/** Counts up to `value` once the element is on screen (instant if reduced motion). */
function CountUp({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setN(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, value]);

  return (
    <span ref={ref} aria-label={`+${value.toLocaleString(locale)}`}>
      +{n.toLocaleString(locale)}
    </span>
  );
}

export default function LifetimeStatsSection() {
  const t = useTranslations();
  const { language } = useLanguage();
  const { data, isLoading } = useLifetimeStats();
  const reduce = useReducedMotion();

  // Never invent numbers: no CRM data, no section.
  if (!isLoading && !data?.available) return null;
  if (!data?.available) return <div className="min-h-[220px] below-fold" aria-hidden="true" />;

  const copy = t.lifetimeStats;
  const cards = [
    {
      title: copy.seasons,
      value: data.seasons,
      label: copy.seasonsLabel.replace("{year}", String(data.sinceYear)),
    },
    { title: copy.rentals, value: data.rentals, label: copy.rentalsLabel },
    { title: copy.customers, value: data.customers, label: copy.customersLabel },
  ];

  return (
    <div className="bg-muted">
      <section
        className="rounded-b-2xl squircle-b bg-background pb-12 pt-4 sm:pb-16 sm:pt-6 lg:pb-20 lg:pt-6"
        id="stats"
        aria-labelledby="stats-title"
      >
        <div className="container mx-auto max-w-5xl px-4">
          <h2
            id="stats-title"
            className="text-center font-heading text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl"
          >
            {copy.title}
          </h2>

          {/* The figures lead; hairlines separate them instead of three boxes. */}
          <motion.ul
            className="mt-8 grid grid-cols-3 divide-x divide-border sm:mt-10"
            initial={reduce ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
          >
            {cards.map(c => (
              <motion.li
                key={c.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="px-2 text-center sm:px-8"
              >
                <div className="font-heading text-2xl font-semibold tracking-tight tabular-nums text-foreground min-[480px]:text-3xl sm:text-6xl">
                  <CountUp value={c.value} locale={language} />
                </div>
                <div className="mt-2 text-sm font-medium leading-tight text-foreground sm:mt-3 sm:text-lg">
                  {c.title}
                </div>
                <div className="mx-auto mt-1 hidden max-w-[16rem] text-base leading-snug text-muted-foreground text-balance sm:block">
                  {c.label}
                </div>
              </motion.li>
            ))}
          </motion.ul>

          {/* Provenance, as a quiet footnote under the figures. */}
          <p className="mx-auto mt-8 max-w-xl px-2 text-center text-sm text-muted-foreground text-balance sm:mt-10">
            {copy.subtitle}
          </p>
        </div>
      </section>
    </div>
  );
}
