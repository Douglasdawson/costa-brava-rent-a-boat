import { ArrowRight, ExternalLink } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { useTranslations } from "@/lib/translations";
import {
  ACTIVITATUM_PICKS,
  activitatumPicksBySlot,
  activitatumTopicUrl,
  activitatumUrl,
  type ActivitatumTopic,
  type ActivitatumSurface,
} from "@shared/activitatumLinks";

interface ActivitatumTeaserProps {
  /** Which Activitatum town collection this page belongs to. */
  topic: ActivitatumTopic;
  /** Where the link is being rendered from — becomes utm_campaign. */
  surface: ActivitatumSurface;
}

/**
 * "And the rest of the day?" strip: what there is to do around the port that we
 * do not rent ourselves. Deliberately not another card — RelatedContent right
 * below is already a card grid, and a fifth identical card would read as more of
 * the same instead of as a different kind of answer.
 *
 * The main link goes to our own bridge page (keeps the click on our site and the
 * internal linking tidy); the secondary one goes straight to Activitatum for the
 * visitor who already knows what they want.
 */
export default function ActivitatumTeaser({ topic, surface }: ActivitatumTeaserProps) {
  const { language, localizedPath } = useLanguage();
  const t = useTranslations();
  const s = t.activitiesPage;

  if (!s) return null;

  const picks = activitatumPicksBySlot("afterBoat").slice(0, 3);
  const topicUrl = activitatumTopicUrl(topic, language, surface);
  const topicCta = topic === "blanes" ? s.cta : s.ctaSecondary;

  return (
    <section className="px-4 pb-14 sm:px-6">
      <div className="mx-auto max-w-4xl border-t border-border pt-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="max-w-prose">
            <h2 className="font-heading text-xl font-bold text-foreground">
              {s.teaserTitle}
            </h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.teaserText}</p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
              {picks.map((key) => {
                const copy = s.activities?.[key];
                if (!copy) return null;
                return (
                  <li key={key}>
                    <a
                      href={activitatumUrl(ACTIVITATUM_PICKS[key].path, language, surface)}
                      target="_blank"
                      rel="noopener"
                      className="text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
                    >
                      {copy.name}{" "}
                      <span className="whitespace-nowrap">
                        {ACTIVITATUM_PICKS[key].priceEur}&euro;
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-shrink-0 flex-col gap-2">
            <a
              href={localizedPath("activities")}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
            >
              {s.navLabel}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={topicUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
            >
              {topicCta}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
