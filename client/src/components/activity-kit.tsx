import { useState, useEffect, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, Plus } from "lucide-react";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the activity / jet ski / bridge pages, in the home's "stacked sheets"
 * language (see licencia-navegacion.tsx): every section is a sheet with rounded bottom corners,
 * wrapped in the colour of the NEXT section so the corner reveals it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export const H2 = "font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance";
export const H3 = "font-heading text-lg font-semibold leading-snug tracking-tight text-balance";

/** Opaque version of a 40% muted tint: a translucent bg inside a wrapper of another colour composes badly. */
const MUTED_OPAQUE = "bg-[color-mix(in_srgb,hsl(var(--muted))_40%,hsl(var(--background)))]";
const NAVY = "bg-primary text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground";
const NAVY_BG = "bg-primary dark:bg-[hsl(215_45%_16%)]";

export type Tone = "page" | "muted" | "navy";
export type NextTone = Tone | "footer";

const SECTION_BG: Record<Tone, string> = { page: "bg-background", muted: MUTED_OPAQUE, navy: NAVY };
const WRAP_BG: Record<NextTone, string> = {
  page: "bg-background",
  muted: MUTED_OPAQUE,
  navy: NAVY_BG,
  footer: "bg-foreground dark:bg-[hsl(215_45%_16%)]",
};

/** Soft text on a navy band. */
export const ON_NAVY_SOFT = "text-primary-foreground/85 dark:text-foreground/85";
/** Light panel sitting on a navy band. */
export const PANEL_ON_NAVY = "rounded-2xl bg-background text-foreground dark:bg-[hsl(215_45%_22%)]";

/**
 * Entrance by translate only, never by opacity: the text is always painted, the reveal only
 * moves it into place, so a hidden tab or a slow observer can't leave a section blank.
 */
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

/** One sheet of the stack. `next` is the tone of whatever follows, so the rounded corner reveals it. */
export function Sheet({
  tone = "page",
  next = "page",
  className,
  containerClassName,
  children,
  ...rest
}: {
  tone?: Tone;
  next?: NextTone;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
} & Omit<React.HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <div className={WRAP_BG[next]}>
      <section
        className={cn("rounded-b-2xl squircle-b py-16 sm:py-24", SECTION_BG[tone], className)}
        {...rest}
      >
        <div className={cn("container mx-auto max-w-6xl px-4", containerClassName)}>{children}</div>
      </section>
    </div>
  );
}

/** Split a paragraph into sentences. */
export function sentences(text: string | undefined): string[] {
  return (text || "").split(/(?<=[.!?])\s+/).filter(Boolean);
}

/** A paragraph whose first sentence is the point and the rest is the detail. */
export function LeadText({
  text,
  className,
  onNavy = false,
}: {
  text: string | undefined;
  className?: string;
  onNavy?: boolean;
}) {
  const [lead, ...rest] = sentences(text);
  if (!lead) return null;
  return (
    <p className={cn("text-base leading-relaxed text-pretty", className)}>
      <span className={cn("font-medium", !onNavy && "text-foreground")}>{lead}</span>
      {rest.length > 0 && (
        <span className={onNavy ? ON_NAVY_SOFT : "text-muted-foreground"}> {rest.join(" ")}</span>
      )}
    </p>
  );
}

/** Title + text block with a rule above it. Use inside a grid. */
export function Feature({
  title,
  text,
  meta,
  children,
}: {
  title?: string;
  text?: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="border-t border-border pt-5">
      <h3 className={H3}>{title}</h3>
      {meta && (
        <div className="mt-1.5 text-sm font-medium text-primary dark:text-chart-1">{meta}</div>
      )}
      {text && <LeadText text={text} className="mt-2.5" />}
      {children}
    </div>
  );
}

/** Panel of ruled rows with a small check. */
export function CheckPanel({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {items.map(item => (
        <li
          key={item}
          className="flex items-center gap-4 border-b border-border px-5 py-3.5 last:border-b-0 sm:px-6"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="text-base leading-snug text-foreground text-pretty">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** One ruled strip of facts for the hero (not loose pills). */
export function FactStrip({ items }: { items: Array<string | undefined> }) {
  const list = items.filter((i): i is string => Boolean(i));
  if (list.length === 0) return null;
  return (
    <ul className="mx-auto mt-10 flex max-w-2xl flex-col divide-y divide-white/25 overflow-hidden rounded-2xl border border-white/25 bg-black/25 text-sm text-white sm:flex-row sm:divide-x sm:divide-y-0">
      {list.map(item => (
        <li
          key={item}
          className="flex flex-1 items-center justify-center px-3 py-3.5 text-center leading-snug text-balance"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Photo hero sheet. `media` is an <img> or <picture>; the h1 sits on it, centred. */
export function PhotoHero({
  media,
  title,
  subtitle,
  actions,
  facts,
  next = "page",
  minHeight = "sm:min-h-[80svh]",
  mediaClassName,
  extra,
}: {
  media: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  facts?: Array<string | undefined>;
  next?: NextTone;
  minHeight?: string;
  mediaClassName?: string;
  extra?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className={WRAP_BG[next]}>
      <section
        className={cn(
          "relative isolate flex min-h-[100svh] items-center overflow-hidden rounded-b-2xl squircle-b pb-16 pt-28",
          minHeight
        )}
      >
        <div
          className={cn(
            "absolute inset-0 -z-10 will-change-transform transition-transform duration-[1200ms] ease-out motion-reduce:transition-none [&_picture]:block [&_picture]:h-full [&_picture]:w-full [&_img]:h-full [&_img]:w-full [&_img]:object-cover",
            mounted ? "scale-100" : "scale-[1.06]",
            mediaClassName
          )}
        >
          {media}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />

        <div
          className={cn(
            "mx-auto w-full max-w-3xl px-4 text-center text-white transition-transform duration-700 ease-out motion-reduce:transition-none sm:px-6",
            mounted ? "translate-y-0" : "translate-y-4"
          )}
        >
          {extra}
          <h1 className="font-heading text-display font-semibold text-balance [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.4)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 text-pretty [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
              {subtitle}
            </p>
          )}
          {actions && (
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {actions}
            </div>
          )}
          {facts && <FactStrip items={facts} />}
        </div>
      </section>
    </div>
  );
}

/** Secondary pill on a photo (white outline). */
export const HERO_SECONDARY =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white/70 bg-white/10 px-6 text-base font-medium text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 motion-reduce:transition-none sm:w-auto";
/** Secondary pill on the light page. */
export const PILL_SECONDARY =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-base font-medium text-foreground transition-colors hover:border-foreground/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 motion-reduce:transition-none";
/** Secondary pill on a navy band. */
export const PILL_ON_NAVY =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-foreground/40 px-6 text-base font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary motion-reduce:transition-none dark:text-foreground";

/** Light-on-navy primary button (button or link). */
export function NavyButton(props: React.ComponentProps<typeof InteractiveHoverButton>) {
  return (
    <InteractiveHoverButton
      tone="light"
      {...props}
      className={cn("min-h-12 px-8 text-base", props.className)}
    />
  );
}

/** Centred closing band on navy: title, text and one or two actions. */
export function CtaSheet({
  title,
  text,
  actions,
  next = "page",
}: {
  title: ReactNode;
  text?: ReactNode;
  actions: ReactNode;
  next?: NextTone;
}) {
  return (
    <Sheet tone="navy" next={next}>
      <Rise className="mx-auto max-w-3xl text-center">
        <h2 className={H2}>{title}</h2>
        {text && (
          <p
            className={cn(
              "mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty sm:text-lg",
              ON_NAVY_SOFT
            )}
          >
            {text}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actions}
        </div>
      </Rise>
    </Sheet>
  );
}

/** Ruled list of internal links, in columns on desktop. */
export function LinkList({
  title,
  links,
}: {
  title?: ReactNode;
  links: Array<{ href: string; label: ReactNode }>;
}) {
  return (
    <div>
      {title && (
        <h3 className="font-heading text-xl font-semibold tracking-tight text-balance">{title}</h3>
      )}
      <ul
        className={cn(
          "grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3",
          title && "mt-5"
        )}
      >
        {links.map((l, i) => (
          <li key={i} className="bg-card">
            <a
              href={l.href}
              className="group flex min-h-12 items-center justify-between gap-3 px-5 py-3.5 text-base text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta motion-reduce:transition-none [@media(hover:hover)]:hover:bg-muted"
            >
              <span className="text-pretty">{l.label}</span>
              <ArrowRight
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

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
        "rounded-2xl border transition-colors duration-200 motion-reduce:transition-none",
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

/** Folded FAQ cards (nothing open by default). */
export function FoldedFaq({
  idPrefix,
  items,
  className,
}: {
  idPrefix: string;
  items: Array<{ q: string; a: string }>;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className={cn("flex flex-col gap-3 sm:gap-4", className)}>
      {items.map((f, i) => (
        <FaqItem
          key={f.q}
          id={`${idPrefix}-${i}`}
          question={f.q}
          answer={f.a}
          open={open === i}
          onToggle={() => setOpen(open === i ? null : i)}
        />
      ))}
    </div>
  );
}

/** FAQ sheet: cta-coloured aside with the title and the link to the full FAQ, folded cards beside it. */
export function FaqSheet({
  idPrefix,
  title,
  items,
  tone = "page",
  next = "page",
}: {
  idPrefix: string;
  title: ReactNode;
  items: Array<{ q: string; a: string }>;
  tone?: Tone;
  next?: NextTone;
}) {
  const { localizedPath } = useLanguage();
  const t = useTranslations();
  if (items.length === 0) return null;
  return (
    <Sheet tone={tone} next={next} aria-labelledby={`${idPrefix}-title`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
        <aside className="flex flex-col justify-between gap-10 rounded-2xl bg-cta p-7 text-primary-foreground dark:text-background sm:p-9 lg:sticky lg:top-[calc(var(--nav-height,5rem)+1rem)] lg:self-start">
          <div>
            <h2 id={`${idPrefix}-title`} className={H2}>
              {title}
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
        <FoldedFaq idPrefix={idPrefix} items={items} />
      </div>
    </Sheet>
  );
}
