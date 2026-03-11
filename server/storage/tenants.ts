import {
  db, sql, eq, isNull,
  tenants,
  type Tenant, type InsertTenant, type UpdateTenant,
} from "./base";

export async function getTenant(id: string): Promise<Tenant | undefined> {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
  return tenant || undefined;
}

export async function getTenantBySlug(slug: string): Promise<Tenant | undefined> {
  const [tenant] = await db.select().from(tenants).where(eq(tenants.slug, slug));
  return tenant || undefined;
}

export async function createTenant(data: InsertTenant): Promise<Tenant> {
  const [tenant] = await db
    .insert(tenants)
    .values(data)
    .returning();
  return tenant;
}

export async function updateTenant(id: string, data: UpdateTenant): Promise<Tenant | undefined> {
  const [tenant] = await db
    .update(tenants)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(tenants.id, id))
    .returning();
  return tenant || undefined;
}

export async function getAllTenants(): Promise<Tenant[]> {
  return await db.select().from(tenants);
}

/**
 * Creates the default "Costa Brava Rent a Boat" tenant and migrates
 * all existing data to belong to this tenant. Idempotent - safe to call multiple times.
 */
export async function seedDefaultTenant(): Promise<Tenant> {
  const slug = "costa-brava-rent-a-boat";

  const existing = await getTenantBySlug(slug);
  if (existing) {
    await migrateDataToTenant(existing.id);
    return existing;
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: "Costa Brava Rent a Boat",
      slug,
      email: "costabravarentaboat@gmail.com",
      phone: "+34 611 500 372",
      address: "Puerto de Blanes, Girona, España",
      primaryColor: "#0077B6",
      secondaryColor: "#00B4D8",
      settings: {
        timezone: "Europe/Madrid",
        currency: "EUR",
        languages: ["es", "en", "fr", "de", "nl", "it", "pt", "ru"],
        seasonDates: {
          low: { start: "04-01", end: "05-31" },
          mid: { start: "06-01", end: "06-30" },
          high: { start: "07-01", end: "10-31" },
        },
      },
      plan: "enterprise",
      status: "active",
    })
    .returning();

  await migrateDataToTenant(tenant.id);
  return tenant;
}

/**
 * Updates all rows with NULL tenant_id to the specified tenant.
 */
async function migrateDataToTenant(tenantId: string): Promise<void> {
  // Whitelist of allowed table names to prevent injection via sql.identifier()
  const ALLOWED_TABLES = new Set([
    "admin_users", "customers", "boats", "bookings", "booking_extras",
    "page_visits", "testimonials", "blog_posts", "destinations",
    "client_photos", "gift_cards", "discount_codes",
    "chatbot_conversations", "ai_chat_sessions", "ai_chat_messages",
    "knowledge_base", "crm_customers", "checkins",
    "maintenance_logs", "boat_documents", "inventory_items", "inventory_movements",
  ]);

  const tableNames = Array.from(ALLOWED_TABLES);

  for (const tableName of tableNames) {
    if (!ALLOWED_TABLES.has(tableName)) {
      throw new Error(`Invalid table name for tenant migration: ${tableName}`);
    }
    await db.execute(
      sql`UPDATE ${sql.identifier(tableName)} SET tenant_id = ${tenantId} WHERE tenant_id IS NULL`
    );
  }
}
