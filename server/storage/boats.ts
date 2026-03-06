import {
  db, eq,
  boats,
  type Boat, type InsertBoat,
} from "./base";
import memoize from "memoizee";

const _getAllBoatsCached = memoize(
  async (): Promise<Boat[]> => {
    return await db.select().from(boats).where(eq(boats.isActive, true));
  },
  { maxAge: 5 * 60 * 1000, promise: true }
);

const _getBoatCached = memoize(
  async (id: string): Promise<Boat | undefined> => {
    const [boat] = await db.select().from(boats).where(eq(boats.id, id));
    return boat || undefined;
  },
  { maxAge: 5 * 60 * 1000, promise: true }
);

function invalidateBoatCache() {
  _getAllBoatsCached.clear();
  _getBoatCached.clear();
}

export async function getAllBoats(): Promise<Boat[]> {
  return await _getAllBoatsCached();
}

export async function getBoat(id: string): Promise<Boat | undefined> {
  return await _getBoatCached(id);
}

export async function createBoat(boat: InsertBoat): Promise<Boat> {
  const [newBoat] = await db
    .insert(boats)
    .values(boat)
    .returning();
  invalidateBoatCache();
  return newBoat;
}

export async function updateBoat(id: string, boat: Partial<InsertBoat>): Promise<Boat | undefined> {
  const [updatedBoat] = await db
    .update(boats)
    .set(boat)
    .where(eq(boats.id, id))
    .returning();
  invalidateBoatCache();
  return updatedBoat || undefined;
}
