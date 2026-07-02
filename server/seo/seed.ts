import { db } from "../db";
import { seoCompetitors, seoKeywords } from "@shared/schema";
import { logger } from "../lib/logger";

const COMPETITORS = [
  { domain: "clickandboat.com", name: "Click&Boat", type: "platform" },
  { domain: "samboat.es", name: "SamBoat", type: "platform" },
  { domain: "blanesboats.com", name: "Blanes Boats", type: "local" },
  { domain: "ericboatsblanes.com", name: "Eric Boats", type: "local" },
  { domain: "rentaboatblanes.com", name: "Rent a Boat Blanes", type: "local" },
];

export async function seedCompetitors(): Promise<void> {
  for (const comp of COMPETITORS) {
    await db
      .insert(seoCompetitors)
      .values({
        domain: comp.domain,
        name: comp.name,
        type: comp.type,
        active: true,
      })
      .onConflictDoUpdate({
        target: seoCompetitors.domain,
        set: { name: comp.name, type: comp.type, active: true },
      });
  }
  logger.info(`[SEO] Seeded ${COMPETITORS.length} competitors`);
}

// Target keywords for the 6 priority towns (Blanes, Lloret, Malgrat, Santa
// Susanna, Calella, Pineda). GSC only upserts keywords that already generate
// impressions, so low-visibility town queries never enter the radar on their
// own; seeding them tracked=true makes SERP snapshots and the radar cover
// them from day one. cluster/intent mirror the deterministic rules in
// collectors/gsc.ts so a later GSC upsert does not flip the values.
const TRACKED_KEYWORDS: Array<{
  keyword: string;
  language: string;
  cluster: string;
  intent: string;
}> = [
  { keyword: "alquiler barco lloret de mar", language: "es", cluster: "local", intent: "transactional" },
  { keyword: "alquiler barco sin licencia lloret de mar", language: "es", cluster: "sin-licencia", intent: "transactional" },
  { keyword: "alquiler barco malgrat de mar", language: "es", cluster: "local", intent: "transactional" },
  { keyword: "alquiler barco santa susanna", language: "es", cluster: "local", intent: "transactional" },
  { keyword: "alquiler barco calella", language: "es", cluster: "local", intent: "transactional" },
  { keyword: "alquiler barco pineda de mar", language: "es", cluster: "local", intent: "transactional" },
  { keyword: "alquiler barco maresme", language: "es", cluster: "general", intent: "transactional" },
  { keyword: "boot huren lloret de mar", language: "nl", cluster: "local", intent: "transactional" },
  { keyword: "boot huren malgrat de mar", language: "nl", cluster: "local", intent: "transactional" },
  { keyword: "boottocht santa susanna", language: "nl", cluster: "local", intent: "commercial" },
  { keyword: "boottocht blanes", language: "nl", cluster: "local", intent: "commercial" },
  { keyword: "boot mieten lloret de mar", language: "de", cluster: "local", intent: "transactional" },
  { keyword: "boot mieten calella", language: "de", cluster: "local", intent: "transactional" },
  { keyword: "boat rental lloret de mar", language: "en", cluster: "local", intent: "transactional" },
  { keyword: "rent a boat lloret de mar", language: "en", cluster: "local", intent: "transactional" },
  { keyword: "location bateau lloret de mar", language: "fr", cluster: "local", intent: "transactional" },
];

export async function seedTrackedKeywords(): Promise<void> {
  for (const kw of TRACKED_KEYWORDS) {
    await db
      .insert(seoKeywords)
      .values({ ...kw, tracked: true })
      .onConflictDoUpdate({
        target: [seoKeywords.keyword, seoKeywords.language],
        set: { tracked: true },
      });
  }
  logger.info(`[SEO] Seeded ${TRACKED_KEYWORDS.length} tracked target keywords`);
}
