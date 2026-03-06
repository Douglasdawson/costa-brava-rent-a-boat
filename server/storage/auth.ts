import {
  db, eq, and, or, sql, isNull, lte,
  users, refreshTokens, passwordResetTokens,
  adminUsers, customerUsers, customers,
  adminSessions, tokenBlacklist,
  type SaasUser, type InsertUser,
  type RefreshToken, type PasswordResetToken,
  type AdminUser, type InsertAdminUser,
  type CustomerUser, type UpsertCustomerUser,
  type Customer, type InsertCustomer,
} from "./base";
import { getTenant } from "./tenants";

// ===== SAAS USER METHODS =====

export async function getUserById(id: string): Promise<SaasUser | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user || undefined;
}

export async function getUserByEmail(email: string, tenantId: string): Promise<SaasUser | undefined> {
  const [user] = await db.select().from(users).where(
    and(eq(users.email, email.toLowerCase().trim()), eq(users.tenantId, tenantId))
  );
  return user || undefined;
}

export async function getUsersByTenant(tenantId: string): Promise<SaasUser[]> {
  return await db.select().from(users).where(eq(users.tenantId, tenantId));
}

export async function createUser(data: InsertUser): Promise<SaasUser> {
  const [user] = await db.insert(users).values({
    ...data,
    email: data.email.toLowerCase().trim(),
  }).returning();
  return user;
}

export async function updateUser(id: string, data: Partial<SaasUser>): Promise<SaasUser | undefined> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user || undefined;
}

// ===== REFRESH TOKEN METHODS =====

export async function createRefreshToken(userId: string, token: string, expiresAt: Date): Promise<RefreshToken> {
  const [rt] = await db.insert(refreshTokens).values({ userId, token, expiresAt }).returning();
  return rt;
}

export async function getRefreshToken(token: string): Promise<RefreshToken | undefined> {
  const [rt] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
  return rt || undefined;
}

export async function deleteRefreshToken(token: string): Promise<boolean> {
  const result = await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  return result.rowCount !== null && result.rowCount > 0;
}

export async function deleteUserRefreshTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const result = await db.delete(refreshTokens).where(lte(refreshTokens.expiresAt, new Date()));
  return result.rowCount ?? 0;
}

// ===== PASSWORD RESET TOKEN METHODS =====

export async function createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
  const [prt] = await db.insert(passwordResetTokens).values({ userId, token, expiresAt }).returning();
  return prt;
}

export async function getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
  const [prt] = await db.select().from(passwordResetTokens).where(
    and(eq(passwordResetTokens.token, token), isNull(passwordResetTokens.usedAt))
  );
  return prt || undefined;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
}

// ===== MIGRATION: admin_users -> users =====

export async function migrateAdminUsersToUsers(tenantId: string): Promise<{ migrated: number; skipped: number }> {
  const tenant = await getTenant(tenantId);
  if (!tenant) {
    throw new Error("Tenant no encontrado");
  }

  const admins = await db
    .select()
    .from(adminUsers)
    .where(
      or(
        eq(adminUsers.tenantId, tenantId),
        isNull(adminUsers.tenantId),
      )
    );

  let migrated = 0;
  let skipped = 0;

  for (const admin of admins) {
    const email = `${admin.username}@${tenant.slug}.nauticflow.app`;

    const existing = await getUserByEmail(email, tenantId);
    if (existing) {
      if (admin.tenantId !== tenantId) {
        await db
          .update(adminUsers)
          .set({ tenantId })
          .where(eq(adminUsers.id, admin.id));
      }
      skipped++;
      continue;
    }

    const displayName = (admin.displayName || admin.username).trim();
    const [firstName, ...rest] = displayName.split(/\s+/);
    const lastName = rest.length > 0 ? rest.join(" ") : null;
    const normalizedUsername = admin.username.toLowerCase();
    const role = admin.role === "admin"
      ? (normalizedUsername === "ivan" ? "owner" : "admin")
      : "employee";

    await db.insert(users).values({
      tenantId,
      email,
      passwordHash: admin.passwordHash,
      role,
      firstName,
      lastName,
      isActive: admin.isActive,
      lastLoginAt: admin.lastLoginAt,
    });

    if (admin.tenantId !== tenantId) {
      await db
        .update(adminUsers)
        .set({ tenantId })
        .where(eq(adminUsers.id, admin.id));
    }

    migrated++;
  }

  return { migrated, skipped };
}

// ===== ADMIN USER METHODS =====

export async function getAdminUser(id: string): Promise<AdminUser | undefined> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
  return user || undefined;
}

export async function getAdminUserByUsername(username: string): Promise<AdminUser | undefined> {
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
  return user || undefined;
}

export async function createAdminUser(insertUser: InsertAdminUser): Promise<AdminUser> {
  const [user] = await db
    .insert(adminUsers)
    .values(insertUser)
    .returning();
  return user;
}

export async function updateAdminUser(id: string, updates: Partial<AdminUser>): Promise<AdminUser | undefined> {
  const [user] = await db
    .update(adminUsers)
    .set(updates)
    .where(eq(adminUsers.id, id))
    .returning();
  return user || undefined;
}

export async function getAllAdminUsers(): Promise<AdminUser[]> {
  return await db.select().from(adminUsers);
}

// ===== CUSTOMER USER METHODS =====

export async function getCustomerUser(id: string): Promise<CustomerUser | undefined> {
  const [user] = await db.select().from(customerUsers).where(eq(customerUsers.id, id));
  return user || undefined;
}

export async function upsertCustomerUser(userData: UpsertCustomerUser): Promise<CustomerUser> {
  const [user] = await db
    .insert(customerUsers)
    .values(userData)
    .onConflictDoUpdate({
      target: customerUsers.id,
      set: {
        ...userData,
        updatedAt: new Date(),
      },
    })
    .returning();
  return user;
}

// ===== CUSTOMER PROFILE METHODS =====

export async function getCustomer(id: string): Promise<Customer | undefined> {
  const [customer] = await db.select().from(customers).where(eq(customers.id, id));
  return customer || undefined;
}

export async function getCustomerByUserId(userId: string): Promise<Customer | undefined> {
  const [customer] = await db.select().from(customers).where(eq(customers.userId, userId));
  return customer || undefined;
}

export async function createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
  const [customer] = await db
    .insert(customers)
    .values(insertCustomer)
    .returning();
  return customer;
}

export async function updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
  const [customer] = await db
    .update(customers)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(customers.id, id))
    .returning();
  return customer || undefined;
}

// ===== ADMIN SESSION / TOKEN BLACKLIST =====

export async function createAdminSession(token: string, userId: string, role: string, username: string, expiresAt: Date): Promise<void> {
  await db.insert(adminSessions).values({ token, userId, role, username, expiresAt }).onConflictDoNothing();
}

export async function deleteAdminSession(token: string): Promise<void> {
  await db.delete(adminSessions).where(eq(adminSessions.token, token));
}

export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const [result] = await db.select().from(tokenBlacklist).where(eq(tokenBlacklist.token, token)).limit(1);
  return !!result;
}

export async function blacklistToken(token: string, expiresAt: Date): Promise<void> {
  await db.insert(tokenBlacklist).values({ token, expiresAt }).onConflictDoNothing();
}

export async function cleanupExpiredSessions(): Promise<void> {
  const now = new Date();
  await db.delete(adminSessions).where(sql`${adminSessions.expiresAt} < ${now}`);
  await db.delete(tokenBlacklist).where(sql`${tokenBlacklist.expiresAt} < ${now}`);
}
