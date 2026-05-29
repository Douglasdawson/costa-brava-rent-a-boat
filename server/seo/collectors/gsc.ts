// server/seo/collectors/gsc.ts
import { db } from "../../db";
import { seoKeywords, seoRankings } from "../../../shared/schema";
import { logger } from "../../lib/logger";
import { isConfigured } from "../../services/googleAnalyticsService";
import { google } from "googleapis";
import { config } from "../../config";
import { SUPPORTED_LANGUAGES } from "../../../shared/seoConstants";

const SUPPORTED_LANG_SET = new Set<string>(SUPPORTED_LANGUAGES);

// Derive language from the page's path prefix (/fr/, /de/, ...). The root and
// unprefixed paths serve Spanish. Replaces the old hardcoded "es" that
// mislabeled every foreign-language query.
function detectLanguageFromPath(pagePath: string): string {
  const code = pagePath.match(/^\/([a-z]{2})(?:\/|$)/)?.[1];
  return code && SUPPORTED_LANG_SET.has(code) ? code : "es";
}

// Rule-based cluster + intent tagging so the keyword radar is groupable and
// filterable without a paid keyword API. Deterministic from the query string
// (multilingual patterns since GSC queries arrive in 8 languages).
function clusterForKeyword(keyword: string): string {
  const k = keyword.toLowerCase();
  if (/sin licencia|without licen|sans permis|ohne f[üu]hrerschein|zonder vaarbewijs|senza patente|sense llic|без лиценз/.test(k)) return "sin-licencia";
  if (/con licencia|with licen|avec permis|mit f[üu]hrerschein|met vaarbewijs|con patente|amb llic|с лиценз/.test(k)) return "con-licencia";
  if (/snorkel|pesca|fishing|p[êe]che|atardecer|sunset|coucher|tramonto|famil|kinder|gezin/.test(k)) return "actividades";
  if (/blanes|lloret|tossa|malgrat|santa susanna|calella|pineda|palafolls|tordera|barcelona/.test(k)) return "local";
  if (/costa brava/.test(k)) return "costa-brava-broad";
  return "general";
}

function intentForKeyword(keyword: string): string {
  const k = keyword.toLowerCase();
  if (/alquil|rent|location|mieten|huren|noleggi|lloguer|аренд|charter|hire|precio|price|tarif|prezz|cost|cuesta|cu[áa]nto|preis|prijz/.test(k)) return "transactional";
  if (/qu[ée]|c[óo]mo|how |gu[íi]a|guide|best|mejor|d[óo]nde|where|consejo|tips/.test(k)) return "informational";
  return "commercial";
}

function getAuth() {
  return new google.auth.JWT({
    email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (config.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
  });
}

export async function collectGscData(): Promise<void> {
  if (!isConfigured()) {
    logger.warn("[SEO:GSC] Google API not configured, skipping");
    return;
  }

  const auth = getAuth();
  const searchconsole = google.searchconsole({ version: "v1", auth });
  const siteUrl = config.GSC_SITE_URL || "sc-domain:costabravarentaboat.com";

  // Fetch last 7 days of data (GSC has ~3 day delay)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 3);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  try {
    // Fetch keyword data with page dimensions
    const response = await searchconsole.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        dimensions: ["query", "page", "date"],
        rowLimit: 1000,
        dataState: "final",
      },
    });

    const rows = response.data.rows || [];
    logger.info(`[SEO:GSC] Fetched ${rows.length} keyword-page-date rows`);

    let keywordsUpserted = 0;
    let rankingsUpserted = 0;

    for (const row of rows) {
      const [keyword, page, date] = row.keys || [];
      if (!keyword || !page || !date) continue;

      // Strip domain from page URL to get path, then derive the language.
      const pagePath = page.replace(/^https?:\/\/[^/]+/, "") || "/";
      const language = detectLanguageFromPath(pagePath);
      const cluster = clusterForKeyword(keyword);
      const intent = intentForKeyword(keyword);

      // Upsert keyword (cluster/intent are deterministic, so safe to re-set on conflict)
      const [kw] = await db
        .insert(seoKeywords)
        .values({ keyword, language, cluster, intent })
        .onConflictDoUpdate({
          target: [seoKeywords.keyword, seoKeywords.language],
          set: { tracked: true, cluster, intent },
        })
        .returning({ id: seoKeywords.id });

      keywordsUpserted++;

      // Upsert ranking
      await db
        .insert(seoRankings)
        .values({
          keywordId: kw.id,
          date,
          position: String(row.position || 0),
          clicks: Math.round(row.clicks || 0),
          impressions: Math.round(row.impressions || 0),
          ctr: String(row.ctr || 0),
          page: pagePath,
          device: "all",
          source: "gsc",
        })
        .onConflictDoUpdate({
          target: [seoRankings.keywordId, seoRankings.date, seoRankings.device, seoRankings.source],
          set: {
            position: String(row.position || 0),
            clicks: Math.round(row.clicks || 0),
            impressions: Math.round(row.impressions || 0),
            ctr: String(row.ctr || 0),
            page: pagePath,
          },
        });

      rankingsUpserted++;
    }

    logger.info(`[SEO:GSC] Synced ${keywordsUpserted} keywords, ${rankingsUpserted} rankings`);
  } catch (error) {
    logger.error("[SEO:GSC] Failed to collect data", {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
