export {
  sendBookingConfirmation,
  sendBookingReminder,
  sendThankYouEmail,
  sendPreSeasonEmail,
  sendPasswordResetEmail,
  sendCancelationEmail,
} from "./emailService";
import { startScheduler } from "./schedulerService";
import { initBusinessStatsCache } from "../lib/businessStatsCache";
import { initFleetStatsCache } from "../lib/fleetStatsCache";
import { logger } from "../lib/logger";
import { BUSINESS_OSM_ID, BUSINESS_WIKIDATA_QID } from "../../shared/businessProfile";

/**
 * Start all scheduled background services.
 * Call this once during server startup after routes are registered.
 */
export function startScheduledServices(): void {
  startScheduler();
  // Warm up the GBP stats cache so SSR schemas have fresh values from request 0
  void initBusinessStatsCache();
  // Warm up the live fleet stats cache (active boat count + price floor) for SSR
  void initFleetStatsCache();
  // GEO entity-resolution reminder: ChatGPT/Claude/Perplexity read OpenStreetMap
  // (and Wikidata) to resolve physical businesses. While these IDs are empty the
  // JSON-LD sameAs[] omits them. Manual step: docs/handoff/2026-05-24-ai-pending-manual-steps.md
  if (!BUSINESS_OSM_ID && !BUSINESS_WIKIDATA_QID) {
    logger.info(
      "[seo] OSM/Wikidata IDs not set — JSON-LD sameAs omits them. Create the OSM node to strengthen AI entity resolution (see docs/handoff/2026-05-24-ai-pending-manual-steps.md)",
    );
  }
}
