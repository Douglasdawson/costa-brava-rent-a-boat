import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";

// Lightweight, visible "last reviewed" stamp for evergreen non-blog pages
// (pricing, routes, glossary). Emits a localized <time> so both humans and
// answer engines see a freshness signal. The date is a static per-page review
// date passed by the caller (ISO yyyy-mm-dd) — not auto-generated, so it only
// changes when the page content is actually reviewed.

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES", en: "en-GB", ca: "ca-ES", fr: "fr-FR",
  de: "de-DE", nl: "nl-NL", it: "it-IT", ru: "ru-RU",
};

interface LastUpdatedProps {
  /** ISO date string, e.g. "2026-05-31". */
  date: string;
  className?: string;
}

export function LastUpdated({ date, className = "" }: LastUpdatedProps) {
  const { language } = useLanguage();
  const t = useTranslations();
  const label = t.lastUpdated?.label ?? "Última actualización";

  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  const locale = LOCALE_MAP[language] ?? "es-ES";
  let formatted: string;
  try {
    formatted = d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    formatted = date;
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      {label}: <time dateTime={date}>{formatted}</time>
    </p>
  );
}
