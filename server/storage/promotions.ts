import {
  db, eq, and, sql,
  giftCards, discountCodes,
  type GiftCard, type InsertGiftCard,
  type DiscountCode, type InsertDiscountCode,
} from "./base";

// ===== GIFT CARD METHODS =====

export async function getAllGiftCards(): Promise<GiftCard[]> {
  return await db.select().from(giftCards);
}

export async function getGiftCardByCode(code: string): Promise<GiftCard | undefined> {
  const [card] = await db.select().from(giftCards).where(eq(giftCards.code, code));
  return card;
}

export async function getGiftCardById(id: string): Promise<GiftCard | undefined> {
  const [card] = await db.select().from(giftCards).where(eq(giftCards.id, id));
  return card;
}

export async function createGiftCard(giftCard: InsertGiftCard): Promise<GiftCard> {
  const [created] = await db.insert(giftCards).values(giftCard).returning();
  return created;
}

export async function updateGiftCard(id: string, updates: Partial<GiftCard>): Promise<GiftCard | undefined> {
  const [updated] = await db.update(giftCards).set(updates).where(eq(giftCards.id, id)).returning();
  return updated;
}

// ===== DISCOUNT CODE METHODS =====

export async function createDiscountCode(data: InsertDiscountCode): Promise<DiscountCode> {
  const [created] = await db.insert(discountCodes).values(data).returning();
  return created;
}

export async function getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
  const [found] = await db
    .select()
    .from(discountCodes)
    .where(
      and(
        eq(discountCodes.code, code.toUpperCase().trim()),
        eq(discountCodes.isActive, true)
      )
    );
  return found || undefined;
}

export async function useDiscountCode(code: string, bookingId: string): Promise<DiscountCode | undefined> {
  const [updated] = await db
    .update(discountCodes)
    .set({ currentUses: sql`current_uses + 1` })
    .where(eq(discountCodes.code, code.toUpperCase().trim()))
    .returning();
  return updated || undefined;
}

export async function getDiscountCodes(): Promise<DiscountCode[]> {
  return await db.select().from(discountCodes);
}

export async function getDiscountCodesByEmail(email: string): Promise<DiscountCode[]> {
  return await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.customerEmail, email.toLowerCase().trim()));
}

export async function generateRepeatCustomerCode(email: string, bookingId: string): Promise<DiscountCode> {
  const emailHash = email.toLowerCase().trim().split("").reduce((hash, char) => {
    return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  }, 0);
  const hashStr = Math.abs(emailHash).toString(36).toUpperCase().slice(0, 6).padEnd(6, "X");
  const code = `REPEAT-${hashStr}`;

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  const [created] = await db
    .insert(discountCodes)
    .values({
      code,
      discountPercent: 10,
      maxUses: 1,
      customerEmail: email.toLowerCase().trim(),
      isActive: true,
      expiresAt,
    })
    .onConflictDoNothing({ target: discountCodes.code })
    .returning();

  if (!created) {
    const existing = await getDiscountCodeByCode(code);
    if (existing) return existing;
    const fallbackCode = `REPEAT-${hashStr}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
    const [fallback] = await db
      .insert(discountCodes)
      .values({
        code: fallbackCode,
        discountPercent: 10,
        maxUses: 1,
        customerEmail: email.toLowerCase().trim(),
        isActive: true,
        expiresAt,
      })
      .returning();
    return fallback;
  }

  return created;
}
