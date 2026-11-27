import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { trackFaqExpanded } from "@/utils/analytics";

/**
 * Building blocks shared by the stacked-sheet pages (categories, pricing, guarantees,
 * destinations, boat detail). Same language as the home: every <section> is a "sheet"
 * with rounded bottom corners wrapped in a <div> coloured as the NEXT band, so the
 * corner reveals it. Entrances move by translate only, never by opacity.
 */

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Page-section headline: fine weight, tight tracking, balanced lines. */
export const H2 = "font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance";
export const SHEET = "rounded-b-2xl squircle-b";

/** Navy band shared with the home: brand navy, a shade lighter than the page in dark mode. */
export const NAVY =
  "bg-primary text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground";
/** Light panel that sits on a navy band. */
export const PANEL_ON_NAVY = "rounded-2xl bg-background text-foreground dark:bg-[hsl(215_45%_22%)]";
/** Opaque equivalent of bg-muted/40 (a translucent fill composes badly over a wrapper of another colour). */
export const MUTED_BG = "bg-[color-mix(in_srgb,hsl(var(--muted))_40%,hsl(var(--background)))]";

export type Tone = "background" | "muted" | "navy" | "footer";

export const TONE_BG: Record<Tone, string> = {
  background: "bg-background",
  muted: MUTED_BG,
  navy: "bg-primary dark:bg-[hsl(215_45%_16%)]",
  footer: "bg-foreground dark:bg-[hsl(215_45%_16%)]",
};

const TONE_SECTION: Record<Tone, string> = {
  background: "bg-background",
  muted: MUTED_BG,
  navy: NAVY,
  footer: "bg-foreground text-background dark:bg-[hsl(215_45%_16%)] dark:text-foreground",
};

/** Split a paragraph into sentences (first one = lead, the rest = loose facts). */
export function sentences(text: string | undefined): string[] {
  return (text || "").split(/(?<=[.!?])\s+/).filter(Boolean);
}

/** Entrance by translate only: the text is always painted, the reveal just moves it into place. */
export function Rise({
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

export const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
export const itemVariants = {
  hidden: { y: 18 },
  show: { y: 0, transition: { duration: 0.6, ease: EASE } },
};

/**
 * One stacked sheet: `tone` is its own colour, `next` the colour of the band that
 * follows (the wrapper), so the rounded bottom corners reveal it.
 */
export function Sheet({
  tone = "background",
  next = "background",
  className,
  children,
  ...rest
}: {
  tone?: Tone;
  next?: Tone;
  className?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <div className={TONE_BG[next]}>
      <section {...rest} className={cn(SHEET, TONE_SECTION[tone], "py-14 sm:py-20", className)}>
        {children}
      </section>
    </div>
  );
}

/** Ruled panel of rows (one per item) with a small success check. */
export function CheckPanel({
  items,
  className,
  testId,
}: {
  items: ReactNode[];
  className?: string;
  testId?: string;
}) {
  return (
    <ul
      data-testid={testId}
      className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}
    >
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-4 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-base leading-snug text-foreground text-pretty">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ruled panel of plain rows (no check). */
export function RuledPanel({ items, className }: { items: ReactNode[]; className?: string }) {
  return (
    <ul className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {items.map((item, i) => (
        <li
          key={i}
          className="border-b border-border px-5 py-3.5 text-base leading-snug text-muted-foreground last:border-b-0 sm:px-6"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Row of outline pills for internal links (children are <a> / <Link> built with PILL_LINK). */
export const PILL_LINK =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border border-border px-5 text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none [@media(hover:hover)]:hover:border-foreground/40 [@media(hover:hover)]:hover:bg-muted";

/** One FAQ card. Born folded; the answer stays in the DOM (hidden from view and AT) for SEO. */
export function FaqItem({
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
              "whitespace-pre-line px-5 pb-5 text-base leading-relaxed text-muted-foreground text-pretty",
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

/** FAQ sheet: navy aside with the title + folded cards (nothing open by default). */
export function FaqSheet({
  items,
  idPrefix,
  tone = "background",
  next = "background",
  title,
}: {
  items: Array<{ question: string; answer: string }>;
  idPrefix: string;
  tone?: Tone;
  next?: Tone;
  title?: string;
}) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <Sheet tone={tone} next={next} aria-labelledby={`${idPrefix}-title`}>
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
          <aside className="flex flex-col justify-between gap-10 rounded-2xl bg-cta p-7 text-primary-foreground dark:text-background sm:p-9 lg:sticky lg:top-[calc(var(--nav-height,5rem)+1rem)] lg:self-start">
            <div>
              <h2 id={`${idPrefix}-title`} className={H2}>
                {title || t.faqPreview?.title}
              </h2>
              {t.faqPreview?.subtitle && (
                <p className="mt-4 max-w-md text-base leading-relaxed opacity-80 text-pretty dark:opacity-100">
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
            {items.map((f, i) => (
              <motion.div key={f.question} variants={itemVariants}>
                <FaqItem
                  id={`${idPrefix}-${i}`}
                  question={f.question}
                  answer={f.answer}
                  open={open === i}
                  onToggle={() => {
                    const next = open === i ? null : i;
                    setOpen(next);
                    if (next !== null) trackFaqExpanded(`${idPrefix}-${i}`);
                  }}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </Sheet>
  );
}

/** First sentence as a highlighted lead, the rest as loose facts with rules (less wall of text). */
export function LeadFacts({
  text,
  className,
  onNavy = false,
}: {
  text: string | undefined;
  className?: string;
  onNavy?: boolean;
}) {
  const [lead = "", ...facts] = sentences(text);
  if (!lead) return null;
  return (
    <div className={className}>
      <p
        className={cn(
          "max-w-2xl text-lg font-medium leading-snug text-pretty sm:text-xl",
          onNavy ? "text-primary-foreground dark:text-foreground" : "text-foreground"
        )}
      >
        {lead}
      </p>
      {facts.length > 0 && (
        <ul
          className={cn(
            "mt-5 max-w-2xl border-t",
            onNavy ? "border-primary-foreground/25 dark:border-foreground/20" : "border-border"
          )}
        >
          {facts.map(fact => (
            <li
              key={fact}
              className={cn(
                "border-b py-3.5 text-base leading-relaxed text-pretty",
                onNavy
                  ? "border-primary-foreground/25 text-primary-foreground/85 dark:border-foreground/20 dark:text-foreground/85"
                  : "border-border text-muted-foreground"
              )}
            >
              {fact}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Title / description rows in one ruled panel (replaces grids of identical cards). */
export function DefList({
  items,
  className,
}: {
  items: Array<{ title: string; desc: ReactNode }>;
  className?: string;
}) {
  return (
    <dl className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className="grid gap-1 border-b border-border px-5 py-4 last:border-b-0 sm:px-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8"
        >
          <dt className="font-heading text-base font-semibold leading-snug text-foreground text-balance">
            {item.title}
          </dt>
          <dd className="text-base leading-relaxed text-muted-foreground text-pretty">
            {item.desc}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Numbered rows with rules: a real sequence, no decorative numbered circles. */
export function StepList({
  steps,
  className,
}: {
  steps: Array<{ title?: string; text?: string }>;
  className?: string;
}) {
  return (
    <ol className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {steps.map((step, i) => (
        <li
          key={i}
          className="grid grid-cols-[2rem_minmax(0,1fr)] gap-3 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[2.5rem_minmax(0,1fr)] sm:px-6"
        >
          <span className="pt-0.5 font-heading text-sm font-semibold tabular-nums text-muted-foreground">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            {step.title && (
              <h3 className="font-heading text-base font-semibold leading-snug text-foreground text-balance">
                {step.title}
              </h3>
            )}
            {step.text && (
              <p
                className={cn(
                  "text-base leading-relaxed text-muted-foreground text-pretty",
                  step.title && "mt-1"
                )}
              >
                {step.text}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Callout panel (replaces amber/green boxes): neutral tint that works in dark mode. */
export function Callout({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "rounded-2xl border border-primary/20 bg-primary/5 p-5 text-base font-medium leading-relaxed text-foreground text-pretty",
        className
      )}
    >
      {children}
    </p>
  );
}

/** Full-bleed photo as its own sheet. */
export function PhotoSheet({
  src,
  alt,
  next = "background",
  width = 1920,
  height = 600,
}: {
  src: string;
  alt: string;
  next?: Tone;
  width?: number;
  height?: number;
}) {
  return (
    <div className={TONE_BG[next]}>
      <div className={cn(SHEET, "overflow-hidden")}>
        <img
          src={src}
          alt={alt}
          className="h-[32vh] max-h-[380px] min-h-[220px] w-full object-cover"
          loading="lazy"
          width={width}
          height={height}
        />
      </div>
    </div>
  );
}

/** Text-only hero on a navy sheet; `facts` render as one ruled strip (no loose pills). */
export function NavyHero({
  title,
  subtitle,
  facts = [],
  next = "background",
  children,
  titleId,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  facts?: string[];
  next?: Tone;
  children?: ReactNode;
  titleId?: string;
}) {
  return (
    <div className={TONE_BG[next]}>
      <section
        className={cn(
          SHEET,
          NAVY,
          "flex min-h-[100svh] flex-col justify-center pb-14 pt-32 sm:block sm:min-h-0 sm:pb-20 sm:pt-40"
        )}
      >
        <div className="container mx-auto w-full max-w-3xl px-4 text-center">
          <h1 id={titleId} className="font-heading text-display font-semibold text-balance">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/85 text-pretty dark:text-foreground/85">
              {subtitle}
            </p>
          )}
          {children}
          {facts.length > 0 && (
            <ul className="mx-auto mt-9 grid max-w-2xl overflow-hidden rounded-2xl border border-primary-foreground/25 text-sm sm:grid-flow-col sm:auto-cols-fr dark:border-foreground/20">
              {facts.map(chip => (
                <li
                  key={chip}
                  className="flex items-center justify-center border-primary-foreground/25 px-4 py-3.5 text-center leading-snug text-balance dark:border-foreground/20 [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
