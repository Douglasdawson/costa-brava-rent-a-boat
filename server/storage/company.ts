import { db } from "../db";
import { companyConfig, type CompanyConfig } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const DEFAULTS = {
  name: "Costa Brava Rent a Boat",
  email: "costabravarentaboat@gmail.com",
  phone: "+34 611 500 372",
  address: "Puerto de Blanes, Girona, Espana",
  primaryColor: "#2B3E50",
  secondaryColor: "#A8C4DD",
};

export async function getCompanyConfig(): Promise<CompanyConfig> {
  const rows = await db.select().from(companyConfig).limit(1);
  if (rows.length > 0) return rows[0];

  // Seed defaults on first access
  const [created] = await db.insert(companyConfig).values(DEFAULTS).returning();
  return created;
}

export async function updateCompanyConfig(
  data: Partial<Pick<CompanyConfig, "name" | "email" | "phone" | "address" | "logo" | "primaryColor" | "secondaryColor">>
): Promise<CompanyConfig> {
  const existing = await getCompanyConfig();
  const [updated] = await db
    .update(companyConfig)
    .set({ ...data, updatedAt: sql`now()` })
    .where(eq(companyConfig.id, existing.id))
    .returning();
  return updated;
}
