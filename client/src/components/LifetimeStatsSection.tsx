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
    <section className="pt-6 pb-10 sm:pb-12 lg:pb-14 bg-background" id="stats">
      <div className="container mx-auto px-3 sm:px-4 max-w-5xl">
        <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 px-2 text-balance">
          {copy.subtitle}
        </p>
        <motion.ul
          className="grid grid-cols-3 gap-2 sm:gap-4"
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.14 } } }}
        >
          {cards.map(c => (
            <motion.li
              key={c.title}
              variants={{
                hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="rounded-2xl bg-muted px-2 py-4 sm:px-6 sm:py-6 text-center sm:text-left"
            >
              <div className="font-heading font-semibold tracking-tight tabular-nums text-2xl sm:text-5xl text-foreground">
                <CountUp value={c.value} locale={language} />
              </div>
              <div className="mt-1.5 sm:mt-2 text-sm sm:text-base font-medium text-foreground leading-tight">
                {c.title}
              </div>
              <div className="hidden sm:block text-sm text-muted-foreground leading-snug text-balance">
                {c.label}
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
