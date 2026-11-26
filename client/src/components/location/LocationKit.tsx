import { useState, type ReactNode } from "react";
import { Link } from "wouter";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Plus, Star, type LucideIcon } from "lucide-react";
import { HeroImage } from "@/components/HeroImage";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { trackFaqExpanded } from "@/utils/analytics";
import {
  BUSINESS_RATING_STR,
  BUSINESS_REVIEW_COUNT_STR,
  GBP_PROFILE_URL,
} from "@shared/businessProfile";

/**
 * Visual kit shared by the town landing pages (LocationTemplate + location-*.tsx).
 * Same language as the home: stacked "sheets" with rounded bottom corners, each
 * wrapped in the colour of the NEXT band so the corner reveals it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

export type Tone = "page" | "muted" | "navy" | "ink";

/** Opaque tint (never a translucent bg-muted/40 inside a wrapper of another colour). */
const MUTED = "bg-[color-mix(in_srgb,hsl(var(--muted))_40%,hsl(var(--background)))]";
const NAVY = "bg-primary text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground";
const NAVY_BG = "bg-primary dark:bg-[hsl(215_45%_16%)]";

const FILL: Record<Tone, string> = {
  page: "bg-background",
  muted: MUTED,
  navy: NAVY,
  ink: "bg-foreground",
};
const WRAP: Record<Tone, string> = {
  page: "bg-background",
  muted: MUTED,
  navy: NAVY_BG,
  ink: "bg-foreground",
};

/** Colour class of a tone, for the sections that are not rendered through <Sheet> (e.g. PopularBoatsSection). */
export const TONE_BG = FILL;

const H2 = "font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance";
const SHEET = "rounded-b-2xl squircle-b";

/** Entrance by translate only, never by opacity: text is always painted. */
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

const listVariants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const itemVariants = {
  hidden: { y: 18 },
  show: { y: 0, transition: { duration: 0.6, ease: EASE } },
};

/** One sheet: wrapper in the colour of the next band + the rounded-bottom section. */
export function Sheet({
  tone,
  next,
  id,
  labelledBy,
  className,
  children,
}: {
  tone: Tone;
  next: Tone;
  id?: string;
  labelledBy?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={WRAP[next]}>
      <section
        id={id}
        aria-labelledby={labelledBy}
        className={cn(SHEET, FILL[tone], "py-16 sm:py-24", className)}
      >
        <div className="container mx-auto max-w-6xl px-4">{children}</div>
      </section>
    </div>
  );
}

/** Rounds the bottom of an external section (PopularBoatsSection...) and wraps it in the next colour. */
export function SheetWrap({ next, children }: { next: Tone; children: ReactNode }) {
  return (
    <div className={WRAP[next]}>
      <div className={cn("overflow-hidden", SHEET)}>{children}</div>
    </div>
  );
}

/** First sentence of a paragraph + the rest (used to give a long paragraph a hierarchy without dropping text). */
function sentences(text?: string): [string, string] {
  const [lead = "", ...rest] = (text || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  return [lead, rest.join(" ")];
}

/** Section intro: one highlighted sentence, the rest smaller and muted. */
export function Lead({ text, className }: { text?: string; className?: string }) {
  if (!text) return null;
  const [lead, rest] = sentences(text);
  return (
    <div className={cn("max-w-xl", className)}>
      <p className="text-lg font-medium leading-snug text-foreground text-pretty sm:text-xl">
        {lead}
      </p>
      {rest && (
        <p className="mt-3 text-base leading-relaxed text-muted-foreground text-pretty">{rest}</p>
      )}
    </div>
  );
}

export function SectionTitle({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2 id={id} className={H2}>
      {children}
    </h2>
  );
}

export interface FactItem {
  title?: string;
  desc?: string;
  icon?: LucideIcon;
  href?: string;
  /** Extra line shown under the title (a time, a price). */
  meta?: ReactNode;
  /** Same as `meta` but trusted HTML coming from i18n (a bold duration). */
  metaHtml?: string;
  /** Pre-split lines (first one highlighted) instead of splitting `desc` by sentence. */
  lines?: Array<string | undefined>;
  /** Short items rendered as a list with their own small icons. */
  list?: Array<{ text?: string; icon?: LucideIcon }>;
  /** Right-aligned detail (price, license). */
  aside?: string;
  testId?: string;
}

function FactRow({ item }: { item: FactItem }) {
  const Icon = item.icon;
  const [sLead, sRest] = sentences(item.desc);
  const given = (item.lines ?? []).filter((l): l is string => Boolean(l));
  const lead = item.lines ? (given[0] ?? "") : sLead;
  const rest = item.lines ? given.slice(1) : sRest ? [sRest] : [];
  const body = (
    <>
      <div className="flex items-start gap-3">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold leading-snug tracking-tight text-foreground">
            {item.title}
          </h3>
          {item.meta && <p className="mt-0.5 text-sm text-muted-foreground">{item.meta}</p>}
          {item.metaHtml && (
            <p
              className="mt-0.5 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: item.metaHtml }}
            />
          )}
        </div>
      </div>
      {item.list && (
        <ul className="space-y-2.5">
          {item.list.map(entry => (
            <li
              key={entry.text}
              className="flex items-start gap-2.5 text-base leading-snug text-foreground text-pretty"
            >
              {entry.icon && (
                <entry.icon
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              {entry.text}
            </li>
          ))}
        </ul>
      )}
      {(lead || item.aside || item.href) && (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {lead && <p className="text-base leading-snug text-foreground text-pretty">{lead}</p>}
            {rest.map(line => (
              <p
                key={line}
                className="mt-1.5 text-sm leading-relaxed text-muted-foreground text-pretty"
              >
                {line}
              </p>
            ))}
          </div>
          {item.aside && (
            <span className="shrink-0 text-sm font-semibold text-foreground">{item.aside}</span>
          )}
          {item.href && (
            <ArrowRight
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover/row:translate-x-0.5 [@media(hover:hover)]:group-hover/row:text-foreground"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </>
  );
  return item.href ? (
    <Link
      href={item.href}
      data-testid={item.testId}
      className="group/row grid min-h-11 gap-1.5 px-5 py-5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cta motion-reduce:transition-none sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8 sm:px-6 [@media(hover:hover)]:hover:bg-muted/50"
    >
      {body}
    </Link>
  ) : (
    <div className="grid gap-1.5 px-5 py-5 sm:grid-cols-[minmax(0,13rem)_1fr] sm:gap-8 sm:px-6">
      {body}
    </div>
  );
}

/** Data as a ruled panel: title column + one highlighted sentence, the rest muted. */
export function FactPanel({ items, className }: { items: FactItem[]; className?: string }) {
  return (
    <motion.ul
      variants={listVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}
    >
      {items.map((item, i) => (
        <motion.li
          key={`${item.title}-${i}`}
          variants={itemVariants}
          className="border-b border-border last:border-b-0"
        >
          <FactRow item={item} />
        </motion.li>
      ))}
    </motion.ul>
  );
}

/** Related links: an internal-linking paragraph (trusted HTML from i18n) + the links as rows. */
export function RelatedLinks({
  id,
  title,
  html,
  children,
  listTitle,
  links,
}: {
  id: string;
  title?: string;
  html?: string;
  /** Paragraph as JSX (when it carries router links) instead of `html`. */
  children?: ReactNode;
  listTitle?: string;
  links: Array<{ label?: string; href: string }>;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
      <Rise>
        <SectionTitle id={id}>{title}</SectionTitle>
        {html && (
          <p
            className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
        {children && (
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">
            {children}
          </p>
        )}
      </Rise>
      <Rise delay={0.1}>
        {listTitle && (
          <h3 className="mb-3 font-heading text-base font-semibold tracking-tight text-foreground">
            {listTitle}
          </h3>
        )}
        <FactPanel items={links.map(l => ({ title: l.label, href: l.href }))} />
      </Rise>
    </div>
  );
}

/** Photo with a gentle hover zoom, rounded like the cards. */
export function Photo({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn("group/photo overflow-hidden rounded-2xl", className)}>
      <img
        src={src}
        alt={alt}
        width={800}
        height={600}
        loading="lazy"
        decoding="async"
        className="aspect-[4/3] w-full object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover/photo:scale-[1.03] lg:aspect-[4/5]"
      />
    </div>
  );
}

/** Photo-led hero sheet (or navy when the page has no photo): title, one line, a primary CTA, a ruled strip of facts. */
export function LocationHero({
  basePath,
  imageAlt,
  title,
  subtitle,
  facts,
  bookLabel,
  onBook,
  next = "page",
}: {
  basePath?: string;
  imageAlt?: string;
  title?: string;
  subtitle?: string;
  facts: Array<string | undefined>;
  bookLabel: string;
  onBook: () => void;
  next?: Tone;
}) {
  const shown = facts.filter((f): f is string => Boolean(f));
  return (
    <div className={WRAP[next]}>
      <section
        className={cn(
          "relative isolate flex min-h-[100svh] items-center sm:min-h-[72svh] overflow-hidden pb-16 pt-28",
          SHEET,
          !basePath && NAVY
        )}
      >
        {basePath && (
          <>
            <HeroImage basePath={basePath} alt={imageAlt ?? title ?? ""} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/65" />
          </>
        )}
        <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center text-white sm:px-6">
          <h1 className="font-heading text-display font-semibold text-balance [text-shadow:0_1px_2px_rgba(0,0,0,0.35),0_4px_24px_rgba(0,0,0,0.4)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/90 text-pretty [text-shadow:0_1px_10px_hsl(215_45%_12%/0.45)]">
              {subtitle}
            </p>
          )}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <InteractiveHoverButton
              tone="dark"
              onClick={onBook}
              className="min-h-12 w-full px-8 text-base sm:w-auto"
              data-testid="button-location-hero-book"
            >
              {bookLabel}
            </InteractiveHoverButton>
            <a
              href={GBP_PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-2 border-white/70 bg-white/10 px-6 text-base font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 motion-reduce:transition-none sm:w-auto [@media(hover:hover)]:hover:bg-white/20"
              data-testid="link-location-hero-rating"
            >
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {BUSINESS_RATING_STR}/5 · {BUSINESS_REVIEW_COUNT_STR}+ · Google
            </a>
          </div>
          {shown.length > 0 && (
            <ul className="mx-auto mt-10 flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/25 bg-black/25 text-sm text-white sm:flex-row">
              {shown.map(fact => (
                <li
                  key={fact}
                  className="flex flex-1 items-center justify-center border-white/25 px-4 py-3.5 text-center leading-snug text-balance [&:not(:first-child)]:border-t sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:border-t-0"
                >
                  {fact}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/** Closing navy band: title, one line, one button. */
export function LocationCta({
  title,
  desc,
  buttonLabel,
  onClick,
  testId,
  secondary,
  next,
}: {
  title?: string;
  desc?: string;
  buttonLabel?: string;
  onClick: () => void;
  testId?: string;
  /** Optional second action as an outlined pill link. */
  secondary?: { label?: string; href: string };
  next: Tone;
}) {
  return (
    <Sheet tone="navy" next={next}>
      <Rise className="mx-auto max-w-3xl text-center">
        <h2 className={H2}>{title}</h2>
        {desc && (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-primary-foreground/85 text-pretty sm:text-lg dark:text-foreground/85">
            {desc}
          </p>
        )}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <InteractiveHoverButton
            tone="light"
            onClick={onClick}
            className="min-h-12 px-8 text-base"
            data-testid={testId}
          >
            {buttonLabel}
          </InteractiveHoverButton>
          {secondary && (
            <Link
              href={secondary.href}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-foreground/40 px-6 text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background motion-reduce:transition-none [@media(hover:hover)]:hover:bg-primary-foreground/10"
            >
              {secondary.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </Rise>
    </Sheet>
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

/** FAQ sheet: navy-ish aside with the title + folded cards (none open by default), as the home. */
export function LocationFaq({
  id,
  title,
  items,
  next,
  tone = "page",
}: {
  id: string;
  /** Falls back to the shared "Preguntas frecuentes" string. */
  title?: string;
  items: Array<{ question: string; answer: string }>;
  next: Tone;
  tone?: Tone;
}) {
  const t = useTranslations();
  const { localizedPath } = useLanguage();
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <Sheet tone={tone} next={next} labelledBy={`${id}-title`}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-10">
        <aside className="flex flex-col justify-between gap-10 rounded-2xl bg-cta p-7 text-primary-foreground dark:text-background sm:p-9 lg:sticky lg:top-[calc(var(--nav-height,5rem)+1rem)] lg:self-start">
          <div>
            <h2 id={`${id}-title`} className={H2}>
              {title ?? t.faqPreview?.title}
            </h2>
            {t.faqPreview?.subtitle && (
              <p className="mt-4 max-w-md text-base leading-relaxed opacity-80 text-pretty">
                {t.faqPreview.subtitle}
              </p>
            )}
          </div>
          <a
            href={localizedPath("faq")}
            className="group inline-flex min-h-11 w-full items-center justify-between gap-4 rounded-full bg-background px-6 py-3.5 text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background focus-visible:ring-offset-2 focus-visible:ring-offset-cta motion-reduce:transition-none sm:w-auto sm:self-start [@media(hover:hover)]:hover:bg-background/90"
          >
            {t.faqPreview?.viewAll}
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0.5"
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
                id={`${id}-${i}`}
                question={f.question}
                answer={f.answer}
                open={open === i}
                onToggle={() => {
                  const nextOpen = open === i ? null : i;
                  setOpen(nextOpen);
                  if (nextOpen !== null) trackFaqExpanded(`${id}-${i}`);
                }}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </Sheet>
  );
}
