import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Plus } from "lucide-react";
import { useTranslations } from "@/lib/translations";
import { useLanguage } from "@/hooks/use-language";
import { trackFaqExpanded } from "@/utils/analytics";
import { computeFaqVars, substituteFaqVars } from "@/utils/faqVars";
import type { Boat } from "@shared/schema";

/** Number of items shown on the homepage preview (two columns of four). */
const PREVIEW_COUNT = 8;
const EASE = [0.22, 1, 0.36, 1] as const;

export default function FAQPreview() {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const reduce = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: boats } = useQuery<Boat[]>({ queryKey: ["/api/boats"] });
  const faqPreview = t.faqPreview!;
  const items = useMemo(() => {
    const vars = computeFaqVars(boats);
    return faqPreview.items.slice(0, PREVIEW_COUNT).map(item => ({
      ...item,
      question: substituteFaqVars(item.question, vars),
      answer: substituteFaqVars(item.answer, vars),
    }));
  }, [faqPreview.items, boats]);

  const half = Math.ceil(items.length / 2);
  const columns = [items.slice(0, half), items.slice(half)];

  const toggle = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) trackFaqExpanded(next);
  };

  return (
    <section className="bg-muted/40 py-16 sm:py-24" aria-labelledby="faq-preview-title">
      <div className="container mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <aside className="flex flex-col justify-between gap-10 rounded-2xl bg-cta p-7 text-primary-foreground dark:text-background sm:p-9 lg:sticky lg:top-[calc(var(--nav-height,5rem)+1rem)] lg:self-start">
            <div>
              <h2
                id="faq-preview-title"
                className="font-heading text-h2 font-semibold tracking-tight text-balance"
              >
                {faqPreview.title}
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed opacity-80 text-pretty">
                {faqPreview.subtitle}
              </p>
            </div>
            <a
              href={localizedPath("faq")}
              className="group inline-flex w-full items-center justify-between gap-4 rounded-full bg-background px-6 py-3.5 min-h-11 text-sm font-medium text-foreground transition-colors hover:bg-background/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-cta sm:w-auto sm:self-start"
            >
              {faqPreview.viewAll}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </a>
          </aside>

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 sm:gap-4">
            {columns.map((column, ci) => (
              <div key={ci} className="flex flex-col gap-3 sm:gap-4">
                {column.map(item => {
                  const isOpen = openId === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border transition-colors duration-200 ${
                        isOpen
                          ? "border-primary/40 bg-primary/5"
                          : "border-border bg-card hover:border-foreground/25"
                      }`}
                    >
                      <h3>
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={`faq-answer-${item.id}`}
                          onClick={() => toggle(item.id)}
                          className="group flex w-full cursor-pointer items-start justify-between gap-4 rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
                        >
                          <span className="flex-1 text-sm sm:text-base font-semibold leading-snug text-foreground">
                            {item.question}
                          </span>
                          <motion.span
                            animate={{ rotate: isOpen ? 45 : 0 }}
                            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                            className="mt-0.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                          </motion.span>
                        </button>
                      </h3>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            id={`faq-answer-${item.id}`}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: reduce ? 0 : 0.35, ease: EASE }}
                            className="overflow-hidden"
                          >
                            <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                              {item.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
