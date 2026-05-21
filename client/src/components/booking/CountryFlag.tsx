import { useEffect, useState } from "react";

// Why this component exists:
// Windows renders regional-indicator emoji as letters ("ES" instead of 🇪🇸)
// because the Segoe UI Emoji font ships without flag glyphs. The verifier
// shows ~58 flags in the country picker, so on Windows the entire list
// turns into a wall of two-letter codes. Same hint Slack/Discord use:
// detect the platform and substitute SVGs.
//
// Cost control: the SVG strings live in country-flag-icons (~1.6 MB for
// all 250 flags). We pay that cost only on Windows by dynamically
// importing the module — Vite emits it as a separate chunk that
// non-Windows users never download. The verifier panel itself is also
// lazy-loaded, so the chunk lands only when a Windows user opens the
// wizard's step 2 and the panel mounts.

const IS_WINDOWS =
  typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);

type FlagStringsModule = Record<string, string>;

let cachedFlagsPromise: Promise<FlagStringsModule> | null = null;

function loadFlagsModule(): Promise<FlagStringsModule> {
  if (!cachedFlagsPromise) {
    cachedFlagsPromise = import("country-flag-icons/string/3x2").then(
      (mod) => mod as unknown as FlagStringsModule,
    );
  }
  return cachedFlagsPromise;
}

interface CountryFlagProps {
  iso2: string;
  /** Emoji to render on non-Windows platforms (and as the fallback while
   * the SVG module is still loading on Windows). */
  emoji: string;
  /** Optional class to apply to the emoji span. The SVG box owns its own
   * sizing so the same class lets callers tune emoji typography only. */
  emojiClassName?: string;
  /** Optional class to apply to the SVG wrapper. Defaults to a 3:2 box that
   * lines up visually with the emoji at `text-lg leading-none`. */
  svgClassName?: string;
}

export default function CountryFlag({
  iso2,
  emoji,
  emojiClassName = "text-lg leading-none",
  svgClassName = "inline-block w-[1.125rem] h-3 overflow-hidden rounded-[2px] align-middle [&>svg]:w-full [&>svg]:h-full",
}: CountryFlagProps) {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!IS_WINDOWS || !iso2) return;
    let cancelled = false;
    loadFlagsModule().then((mod) => {
      if (cancelled) return;
      const flagSvg = mod[iso2.toUpperCase()];
      if (flagSvg) setSvg(flagSvg);
    });
    return () => {
      cancelled = true;
    };
  }, [iso2]);

  if (svg) {
    return (
      <span
        className={svgClassName}
        aria-hidden
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  return (
    <span className={emojiClassName} aria-hidden>
      {emoji}
    </span>
  );
}
