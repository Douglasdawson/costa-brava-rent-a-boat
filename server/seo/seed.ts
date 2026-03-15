import { db } from "../db";
import { seoCompetitors } from "@shared/schema";
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
