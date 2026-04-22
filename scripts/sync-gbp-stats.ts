/**
 * Manual one-shot sync from Google Places API → DB.
 * Uses GOOGLE_PLACES_API_KEY + GOOGLE_PLACES_PLACE_ID from .env.
 */
import "dotenv/config";
import { syncGbpStats } from "../server/services/gbpSync";
import { storage } from "../server/storage";

async function main() {
  console.log("[sync] Calling Places API...");
  const result = await syncGbpStats();

  if (!result.success) {
    console.error("[sync] FAILED:", result.error);
    process.exit(1);
  }

  console.log("[sync] OK:", {
    rating: result.rating,
    userRatingCount: result.userRatingCount,
    lastSyncedAt: result.lastSyncedAt,
  });

  // Verify in DB
  const row = await storage.getBusinessStats();
  console.log("[sync] DB row:", {
    rating: row?.rating,
    userRatingCount: row?.userRatingCount,
    displayName: row?.displayName,
    websiteUri: row?.websiteUri,
    lastSyncedAt: row?.lastSyncedAt,
    recentReviewsCount: Array.isArray(row?.recentReviews) ? row.recentReviews.length : 0,
  });
  process.exit(0);
}

main().catch((err) => {
  console.error("[sync] CRASH", err);
  process.exit(1);
});
