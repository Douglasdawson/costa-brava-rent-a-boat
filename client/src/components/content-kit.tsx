import { type HTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Building blocks for the content pages (about, faq, gallery, blog, routes...), in the
 * same language as the home: stacked "sheets" with rounded bottom corners, each wrapped
 * in the colour of the NEXT band so the corner reveals it.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Navy band shared with the home: brand navy, a shade lighter than the page in dark mode. */
export const NAVY =
  "bg-primary text-primary-foreground dark:bg-[hsl(215_45%_16%)] dark:text-foreground";
export const NAVY_BG = "bg-primary dark:bg-[hsl(215_45%_16%)]";
/** Opaque 40% muted: a translucent bg-muted/40 composes badly inside a wrapper of another colour. */
export const MUTED_BG = "bg-[color-mix(in_srgb,hsl(var(--muted))_40%,hsl(var(--background)))]";

export const H2 = "font-heading text-h2 font-semibold leading-[1.08] tracking-tight text-balance";
export const SHEET = "rounded-b-2xl squircle-b";

export type Tone = "background" | "muted" | "navy" | "foot";

const TONE_SECTION: Record<Tone, string> = {
  background: "bg-background text-foreground",
  muted: `${MUTED_BG} text-foreground`,
  navy: NAVY,
  foot: "bg-foreground text-background",
};
const TONE_WRAPPER: Record<Tone, string> = {
  background: "bg-background",
  muted: MUTED_BG,
  navy: NAVY_BG,
  foot: "bg-foreground",
};

/** Text colours that read on a navy band (light and dark mode). */
export const ON_NAVY_MUTED = "text-primary-foreground/85 dark:text-foreground/85";

/**
 * Entrance by translate only, never by opacity: the text is always painted, the reveal
 * only moves it into place, so a hidden tab or a slow observer can't leave a section blank.
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

/**
 * One sheet. `tone` is its own colour, `next` the colour of whatever comes after it
 * (the wrapper), so the rounded bottom corners reveal it.
 */
export function Sheet({
  tone,
  next,
  className,
  children,
  as: Tag = "section",
  ...rest
}: {
  tone: Tone;
  next: Tone;
  className?: string;
  children: ReactNode;
  as?: "section" | "header";
} & Omit<HTMLAttributes<HTMLElement>, "className" | "children">) {
  return (
    <div className={TONE_WRAPPER[next]}>
      <Tag className={cn(SHEET, TONE_SECTION[tone], "py-16 sm:py-24", className)} {...rest}>
        {children}
      </Tag>
    </div>
  );
}

/** Page header: a navy sheet with the h1 (and optional subtitle / extra content). */
export function PageHeader({
  title,
  subtitle,
  next = "background",
  children,
  align = "center",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  next?: Tone;
  children?: ReactNode;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <Sheet tone="navy" next={next} as="header" className="pb-14 pt-28 sm:pb-20 sm:pt-36">
      <div className={cn("container mx-auto max-w-4xl px-4", center ? "text-center" : "text-left")}>
        <h1 className="font-heading text-h1 font-semibold tracking-tight text-balance">{title}</h1>
        {subtitle && (
          <p
            className={cn(
              "mt-4 max-w-2xl text-base text-pretty sm:text-lg",
              ON_NAVY_MUTED,
              center && "mx-auto"
            )}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </Sheet>
  );
}

/** Full-width photo as its own sheet (replaces the edge-to-edge "photo break" strips). */
export function PhotoBand({
  src,
  webp,
  alt,
  tone = "background",
  next,
}: {
  src: string;
  webp?: string;
  alt: string;
  tone?: Tone;
  next: Tone;
}) {
  return (
    <Sheet tone={tone} next={next} className="py-0 pb-16 sm:pb-24">
      <div className="container mx-auto max-w-6xl px-4">
        <Rise>
          <picture>
            {webp && <source type="image/webp" srcSet={webp} />}
            <img
              src={src}
              alt={alt}
              className="h-[32vh] min-h-[220px] max-h-[380px] w-full rounded-2xl object-cover"
              loading="lazy"
              decoding="async"
              width={1920}
              height={600}
            />
          </picture>
        </Rise>
      </div>
    </Sheet>
  );
}

/** Split a paragraph into sentences: the first is the lead, the rest are loose facts. */
export function splitSentences(text: string | undefined | null): [string, string[]] {
  const [lead = "", ...rest] = (text || "").split(/(?<=[.!?])\s+/).filter(Boolean);
  return [lead, rest];
}

/**
 * Folded disclosure. Born closed; the answer stays in the DOM (hidden from view and AT)
 * for SEO. `flat` = a row inside a ruled panel, otherwise a card of its own.
 */
export function Fold({
  id,
  title,
  open,
  onToggle,
  flat = false,
  headingLevel = 3,
  testId,
  children,
}: {
  id: string;
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  flat?: boolean;
  headingLevel?: 2 | 3;
  testId?: string;
  children: ReactNode;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div
      data-testid={testId}
      className={cn(
        "transition-colors duration-200",
        flat
          ? "border-b border-border last:border-b-0"
          : cn(
              "rounded-2xl border",
              open
                ? "border-primary/40 bg-primary/5"
                : "border-border bg-card [@media(hover:hover)]:hover:border-foreground/25"
            )
      )}
    >
      <Heading>
        <button
          type="button"
          id={`${id}-q`}
          aria-expanded={open}
          aria-controls={`${id}-a`}
          onClick={onToggle}
          className={cn(
            "group flex w-full cursor-pointer items-start justify-between gap-4 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta",
            flat ? "rounded-2xl sm:px-6" : "rounded-2xl"
          )}
        >
          <span className="flex-1 text-base font-semibold leading-snug text-foreground">
            {title}
          </span>
          <Plus
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-[transform,color] duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:text-foreground",
              open && "rotate-45"
            )}
            aria-hidden="true"
          />
        </button>
      </Heading>
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
          <div
            className={cn(
              "px-5 pb-5 text-base leading-relaxed text-muted-foreground text-pretty",
              flat && "sm:px-6",
              !open && "invisible"
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
