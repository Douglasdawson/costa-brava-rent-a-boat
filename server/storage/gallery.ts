import {
  db, eq,
  clientPhotos,
  type ClientPhoto, type InsertClientPhoto,
} from "./base";

export async function getApprovedPhotos(): Promise<ClientPhoto[]> {
  return await db.select().from(clientPhotos).where(eq(clientPhotos.isApproved, true));
}

export async function getAllPhotos(): Promise<ClientPhoto[]> {
  return await db.select().from(clientPhotos);
}

export async function createClientPhoto(photo: InsertClientPhoto): Promise<ClientPhoto> {
  const [newPhoto] = await db.insert(clientPhotos).values(photo).returning();
  return newPhoto;
}

export async function updateClientPhoto(id: string, updates: Partial<ClientPhoto>): Promise<ClientPhoto | undefined> {
  const [updated] = await db.update(clientPhotos).set(updates).where(eq(clientPhotos.id, id)).returning();
  return updated || undefined;
}

export async function deleteClientPhoto(id: string): Promise<boolean> {
  const result = await db.delete(clientPhotos).where(eq(clientPhotos.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}
