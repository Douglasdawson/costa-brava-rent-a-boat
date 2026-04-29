import { useTranslations } from "@/lib/translations";
import { getAuthor } from "@shared/authors";

interface AuthorBylineProps {
  authorName?: string | null;
  publishedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  language?: string;
}

function formatDate(value: string | Date | null | undefined, locale: string): string | null {
  if (!value) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return null;
  try {
    return d.toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });
  } catch {
    return d.toISOString().split("T")[0];
  }
}

const LOCALE_MAP: Record<string, string> = {
  es: "es-ES", en: "en-GB", ca: "ca-ES", fr: "fr-FR",
  de: "de-DE", nl: "nl-NL", it: "it-IT", ru: "ru-RU",
};

export function AuthorByline({ authorName, publishedAt, updatedAt, language = "es" }: AuthorBylineProps) {
  const t = useTranslations();
  const byline = t.blogAuthorByline ?? {
    writtenBy: "Por",
    publishedOn: "Publicado el",
    updatedOn: "Actualizado el",
    readMore: "Más sobre el autor",
    verifiedProfilesLabel: "Perfiles verificados",
  };

  const author = (() => {
    const name = (authorName ?? "").trim();
    if (!name) return getAuthor();
    return getAuthor(name.toLowerCase().replace(/\s+/g, "-"));
  })();

  const locale = LOCALE_MAP[language] ?? "es-ES";
  const publishedFmt = formatDate(publishedAt, locale);
  const updatedFmt = formatDate(updatedAt, locale);
  const showUpdated = updatedFmt && updatedFmt !== publishedFmt;

  return (
    <div
      className="flex items-start gap-4 mb-8 pb-6 border-b border-border/50"
      data-testid="author-byline"
    >
      <img
        src={author.image}
        alt={author.name}
        width={56}
        height={56}
        className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-muted"
        loading="lazy"
        onError={(e) => {
          // Fallback to initials avatar if image missing
          const target = e.currentTarget;
          target.style.display = "none";
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="text-muted-foreground">{byline.writtenBy} </span>
          <a
            href={author.url}
            className="font-semibold text-foreground hover:text-cta transition-colors"
            data-testid="author-byline-name"
          >
            {author.name}
          </a>
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{author.jobTitle}</p>
        {(publishedFmt || updatedFmt) && (
          <p className="text-xs text-muted-foreground mt-1">
            {publishedFmt && (
              <>
                {byline.publishedOn} <time dateTime={typeof publishedAt === "string" ? publishedAt : publishedAt?.toISOString()}>{publishedFmt}</time>
              </>
            )}
            {showUpdated && (
              <>
                {publishedFmt ? " · " : ""}
                {byline.updatedOn} <time dateTime={typeof updatedAt === "string" ? updatedAt : updatedAt?.toISOString()}>{updatedFmt}</time>
              </>
            )}
          </p>
        )}
        {author.sameAs.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            <span className="sr-only">{byline.verifiedProfilesLabel}: </span>
            {author.sameAs.map((url, i) => {
              let label = "Profile";
              try {
                const host = new URL(url).hostname.replace(/^www\./, "");
                label = host.split(".")[0];
              } catch {
                /* keep default */
              }
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="hover:text-foreground transition-colors capitalize"
                >
                  {i > 0 && <span className="mx-1.5">·</span>}
                  {label}
                </a>
              );
            })}
          </p>
        )}
      </div>
    </div>
  );
}
