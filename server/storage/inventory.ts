import {
  db, eq, and, gte, lte, inArray, sql, isNull,
  checkins, maintenanceLogs, boatDocuments,
  inventoryItems, inventoryMovements, bookingExtras,
  type Checkin, type InsertCheckin,
  type MaintenanceLog, type InsertMaintenanceLog, type UpdateMaintenanceLog,
  type BoatDocument, type InsertBoatDocument, type UpdateBoatDocument,
  type InventoryItem, type InsertInventoryItem, type UpdateInventoryItem,
  type InventoryMovement, type InsertInventoryMovement,
} from "./base";

// ===== CHECKIN METHODS =====

export async function createCheckin(data: InsertCheckin): Promise<Checkin> {
  const [newCheckin] = await db
    .insert(checkins)
    .values({
      bookingId: data.bookingId,
      boatId: data.boatId,
      type: data.type,
      performedBy: data.performedBy || null,
      fuelLevel: data.fuelLevel,
      condition: data.condition,
      engineHours: data.engineHours || null,
      notes: data.notes || null,
      photos: data.photos || null,
      signatureUrl: data.signatureUrl || null,
      checklist: data.checklist || null,
    })
    .returning();
  return newCheckin;
}

export async function getCheckinsByBooking(bookingId: string): Promise<Checkin[]> {
  return await db
    .select()
    .from(checkins)
    .where(eq(checkins.bookingId, bookingId))
    .orderBy(sql`${checkins.performedAt} ASC`);
}

export async function getLatestCheckin(bookingId: string, type: string): Promise<Checkin | undefined> {
  const [result] = await db
    .select()
    .from(checkins)
    .where(
      and(
        eq(checkins.bookingId, bookingId),
        eq(checkins.type, type)
      )
    )
    .orderBy(sql`${checkins.performedAt} DESC`)
    .limit(1);
  return result || undefined;
}

// ===== MAINTENANCE METHODS =====

export async function createMaintenanceLog(data: InsertMaintenanceLog): Promise<MaintenanceLog> {
  const [log] = await db
    .insert(maintenanceLogs)
    .values({
      boatId: data.boatId,
      type: data.type,
      description: data.description,
      cost: data.cost || null,
      date: data.date,
      nextDueDate: data.nextDueDate || null,
      status: data.status || "scheduled",
      notes: data.notes || null,
      createdBy: data.createdBy || null,
    })
    .returning();
  return log;
}

export async function getMaintenanceLogs(boatId?: string): Promise<MaintenanceLog[]> {
  const conditions = [];
  if (boatId) {
    conditions.push(eq(maintenanceLogs.boatId, boatId));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(maintenanceLogs)
    .where(whereClause)
    .orderBy(sql`${maintenanceLogs.date} DESC`);
}

export async function getMaintenanceLog(id: string): Promise<MaintenanceLog | undefined> {
  const [log] = await db.select().from(maintenanceLogs).where(eq(maintenanceLogs.id, id));
  return log || undefined;
}

export async function updateMaintenanceLog(id: string, data: UpdateMaintenanceLog): Promise<MaintenanceLog | undefined> {
  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.cost !== undefined) updateData.cost = data.cost || null;
  if (data.date !== undefined) updateData.date = data.date;
  if (data.nextDueDate !== undefined) updateData.nextDueDate = data.nextDueDate || null;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const [updated] = await db
    .update(maintenanceLogs)
    .set(updateData)
    .where(eq(maintenanceLogs.id, id))
    .returning();
  return updated || undefined;
}

export async function deleteMaintenanceLog(id: string): Promise<boolean> {
  const result = await db.delete(maintenanceLogs).where(eq(maintenanceLogs.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getUpcomingMaintenance(): Promise<MaintenanceLog[]> {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return await db
    .select()
    .from(maintenanceLogs)
    .where(
      and(
        inArray(maintenanceLogs.status, ["scheduled", "in_progress"]),
        lte(maintenanceLogs.date, thirtyDaysFromNow)
      )
    )
    .orderBy(sql`${maintenanceLogs.date} ASC`);
}

// ===== BOAT DOCUMENT METHODS =====

export async function createBoatDocument(data: InsertBoatDocument): Promise<BoatDocument> {
  const [doc] = await db
    .insert(boatDocuments)
    .values({
      boatId: data.boatId,
      type: data.type,
      name: data.name,
      fileUrl: data.fileUrl || null,
      expiryDate: data.expiryDate || null,
      notes: data.notes || null,
    })
    .returning();
  return doc;
}

export async function getBoatDocuments(boatId?: string): Promise<BoatDocument[]> {
  const conditions = [];
  if (boatId) {
    conditions.push(eq(boatDocuments.boatId, boatId));
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return await db
    .select()
    .from(boatDocuments)
    .where(whereClause)
    .orderBy(sql`${boatDocuments.expiryDate} ASC NULLS LAST`);
}

export async function getBoatDocument(id: string): Promise<BoatDocument | undefined> {
  const [doc] = await db.select().from(boatDocuments).where(eq(boatDocuments.id, id));
  return doc || undefined;
}

export async function updateBoatDocument(id: string, data: UpdateBoatDocument): Promise<BoatDocument | undefined> {
  const updateData: Record<string, unknown> = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl || null;
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const [updated] = await db
    .update(boatDocuments)
    .set(updateData)
    .where(eq(boatDocuments.id, id))
    .returning();
  return updated || undefined;
}

export async function deleteBoatDocument(id: string): Promise<boolean> {
  const result = await db.delete(boatDocuments).where(eq(boatDocuments.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

export async function getExpiringDocuments(daysAhead: number): Promise<BoatDocument[]> {
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  return await db
    .select()
    .from(boatDocuments)
    .where(
      and(
        lte(boatDocuments.expiryDate!, futureDate),
        gte(boatDocuments.expiryDate!, new Date(0))
      )
    )
    .orderBy(sql`${boatDocuments.expiryDate} ASC`);
}

// ===== INVENTORY METHODS =====

function calculateInventoryStatus(available: number, minAlert: number): string {
  if (available <= 0) return "out_of_stock";
  if (available <= minAlert) return "low_stock";
  return "available";
}

export async function createInventoryItem(data: InsertInventoryItem): Promise<InventoryItem> {
  const status = calculateInventoryStatus(data.availableStock ?? 0, data.minStockAlert ?? 1);
  const [item] = await db
    .insert(inventoryItems)
    .values({
      name: data.name,
      description: data.description || null,
      category: data.category,
      totalStock: data.totalStock ?? 0,
      availableStock: data.availableStock ?? 0,
      pricePerUnit: data.pricePerUnit || null,
      status,
      minStockAlert: data.minStockAlert ?? 1,
      imageUrl: data.imageUrl || null,
    })
    .returning();
  return item;
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  return await db
    .select()
    .from(inventoryItems)
    .orderBy(sql`${inventoryItems.category} ASC, ${inventoryItems.name} ASC`);
}

export async function getInventoryItem(id: string): Promise<InventoryItem | undefined> {
  const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
  return item || undefined;
}

export async function updateInventoryItem(id: string, data: UpdateInventoryItem): Promise<InventoryItem | undefined> {
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.totalStock !== undefined) updateData.totalStock = data.totalStock;
  if (data.availableStock !== undefined) updateData.availableStock = data.availableStock;
  if (data.pricePerUnit !== undefined) updateData.pricePerUnit = data.pricePerUnit || null;
  if (data.minStockAlert !== undefined) updateData.minStockAlert = data.minStockAlert;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl || null;

  const current = await getInventoryItem(id);
  if (current) {
    const available = (data.availableStock !== undefined ? data.availableStock : current.availableStock) as number;
    const minAlert = (data.minStockAlert !== undefined ? data.minStockAlert : current.minStockAlert) as number;
    updateData.status = calculateInventoryStatus(available, minAlert);
  }

  const [updated] = await db
    .update(inventoryItems)
    .set(updateData)
    .where(eq(inventoryItems.id, id))
    .returning();
  return updated || undefined;
}

export async function deleteInventoryItem(id: string): Promise<boolean> {
  await db.delete(inventoryMovements).where(eq(inventoryMovements.itemId, id));
  const result = await db.delete(inventoryItems).where(eq(inventoryItems.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

export async function createInventoryMovement(data: InsertInventoryMovement): Promise<InventoryMovement> {
  const item = await getInventoryItem(data.itemId);
  if (!item) throw new Error("Item de inventario no encontrado");

  let newAvailable = item.availableStock;
  let newTotal = item.totalStock;

  if (data.type === "in") {
    newAvailable += data.quantity;
    newTotal += data.quantity;
  } else if (data.type === "out") {
    newAvailable -= data.quantity;
    if (newAvailable < 0) newAvailable = 0;
  } else {
    newAvailable = data.quantity;
    newTotal = data.quantity;
  }

  const [movement] = await db
    .insert(inventoryMovements)
    .values({
      itemId: data.itemId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason || null,
      bookingId: data.bookingId || null,
      createdBy: data.createdBy || null,
    })
    .returning();

  const status = calculateInventoryStatus(newAvailable, item.minStockAlert);
  await db
    .update(inventoryItems)
    .set({
      availableStock: newAvailable,
      totalStock: newTotal,
      status,
      updatedAt: new Date(),
    })
    .where(eq(inventoryItems.id, data.itemId));

  return movement;
}

export async function getInventoryMovements(itemId: string): Promise<InventoryMovement[]> {
  return await db
    .select()
    .from(inventoryMovements)
    .where(eq(inventoryMovements.itemId, itemId))
    .orderBy(sql`${inventoryMovements.createdAt} DESC`);
}

export async function getLowStockItems(): Promise<InventoryItem[]> {
  return await db
    .select()
    .from(inventoryItems)
    .where(inArray(inventoryItems.status, ["low_stock", "out_of_stock"]));
}

export async function decrementExtrasStock(bookingId: string): Promise<void> {
  const extras = await db
    .select()
    .from(bookingExtras)
    .where(eq(bookingExtras.bookingId, bookingId));

  if (extras.length === 0) return;

  const extraNames = extras.map(e => e.extraName);
  const items = await db.select().from(inventoryItems)
    .where(inArray(inventoryItems.name, extraNames));
  const itemMap = new Map(items.map(i => [i.name, i]));

  await db.transaction(async (tx) => {
    for (const extra of extras) {
      const item = itemMap.get(extra.extraName);
      if (!item) continue;

      const qty = extra.quantity || 1;

      await tx
        .update(inventoryItems)
        .set({
          availableStock: sql`GREATEST(${inventoryItems.availableStock} - ${qty}, 0)`,
          status: sql`CASE
            WHEN ${inventoryItems.availableStock} - ${qty} <= 0 THEN 'out_of_stock'
            WHEN ${inventoryItems.availableStock} - ${qty} <= ${inventoryItems.minStockAlert} THEN 'low_stock'
            ELSE 'available'
          END`,
        })
        .where(eq(inventoryItems.id, item.id));

      await tx.insert(inventoryMovements).values({
        itemId: item.id,
        type: "OUT",
        quantity: qty,
        reason: `booking:${bookingId}`,
      });
    }
  });
}
