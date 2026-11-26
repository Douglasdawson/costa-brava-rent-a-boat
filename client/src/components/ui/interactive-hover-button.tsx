import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Pill button with a fill-on-hover motion: a small dot beside the label grows to
 * flood the button, the label slides out and a copy of it with an arrow slides in.
 *
 * Brand colours only (cta / background tokens): `dark` is the navy CTA that
 * floods to the page background; `light` is the white pill that floods to navy.
 * The effect runs only where a real hover exists (not on touch, where :hover
 * sticks after a tap) and on keyboard focus. Polymorphic: pass `as={Link}` or
 * `href` for links, nothing for a <button>.
 */
type Tone = "dark" | "light";

type InteractiveHoverButtonProps = {
  tone?: Tone;
  as?: React.ElementType;
  className?: string;
  children: React.ReactNode;
} & Omit<React.AllHTMLAttributes<HTMLElement>, "as" | "children" | "className">;

const TONES: Record<Tone, { base: string; dot: string; hoverLabel: string }> = {
  dark: {
    base: "border-cta bg-cta text-cta-foreground",
    dot: "bg-background",
    hoverLabel: "text-cta",
  },
  light: {
    base: "border-background bg-background text-foreground",
    dot: "bg-cta",
    hoverLabel: "text-cta-foreground",
  },
};

export function InteractiveHoverButton({
  tone = "dark",
  as,
  className,
  children,
  ...props
}: InteractiveHoverButtonProps) {
  const Comp: React.ElementType = as ?? (props.href ? "a" : "button");
  const t = TONES[tone];
  const extra = Comp === "button" && !props.type ? { type: "button" as const } : {};

  return (
    <Comp
      {...extra}
      {...props}
      className={cn(
        "group/ihb relative inline-flex min-h-11 cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap rounded-full border px-6 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        t.base,
        className
      )}
    >
      {/* Both layers share one grid cell and are each centred in it, so dot + label sit centred in the pill.
          The dot is in flow next to the label and, on hover, scales up from its own centre to flood the pill. */}
      <span className="relative z-10 inline-grid">
        <span className="col-start-1 row-start-1 flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className={cn(
              "h-2 w-2 shrink-0 rounded-full transition-transform duration-500 ease-out will-change-transform motion-reduce:transition-none",
              "group-focus-visible/ihb:scale-[120]",
              "[@media(hover:hover)]:group-hover/ihb:scale-[120]",
              t.dot
            )}
          />
          <span
            className={cn(
              "transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
              "group-focus-visible/ihb:-translate-x-3 group-focus-visible/ihb:opacity-0",
              "[@media(hover:hover)]:group-hover/ihb:-translate-x-3 [@media(hover:hover)]:group-hover/ihb:opacity-0"
            )}
          >
            {children}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={cn(
            "col-start-1 row-start-1 flex translate-x-3 items-center justify-center gap-2 opacity-0 transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none",
            "group-focus-visible/ihb:translate-x-0 group-focus-visible/ihb:opacity-100",
            "[@media(hover:hover)]:group-hover/ihb:translate-x-0 [@media(hover:hover)]:group-hover/ihb:opacity-100",
            t.hoverLabel
          )}
        >
          {children}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </span>
      </span>
    </Comp>
  );
}
