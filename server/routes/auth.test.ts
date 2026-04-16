import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Must set JWT_SECRET before any module import (auth-middleware checks it at load time).
// vi.hoisted runs before vi.mock factories, which in turn run before regular imports.
vi.hoisted(() => {
  process.env.JWT_SECRET = "test-secret-key-that-is-at-least-32-characters-long-for-testing";
});

// ----- Mocks — vi.mock factories are hoisted and cannot reference outer `const` variables. -----

vi.mock("../lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

vi.mock("../storage", () => ({
  storage: {
    getAdminUsersWithPin: vi.fn(),
    updateAdminUser: vi.fn(),
    getAdminUserByUsername: vi.fn(),
    createAdminSession: vi.fn().mockResolvedValue(undefined),
    deleteAdminSession: vi.fn().mockResolvedValue(undefined),
    isTokenBlacklisted: vi.fn().mockResolvedValue(false),
    blacklistToken: vi.fn().mockResolvedValue(undefined),
    getUserById: vi.fn(),
    getUserByEmail: vi.fn(),
    getTenant: vi.fn(),
    getTenantBySlug: vi.fn(),
    getAllTenants: vi.fn().mockResolvedValue([]),
    createTenant: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    createRefreshToken: vi.fn().mockResolvedValue(undefined),
    getRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn().mockResolvedValue(undefined),
    deleteUserRefreshTokens: vi.fn().mockResolvedValue(undefined),
    cleanupExpiredSessions: vi.fn().mockResolvedValue(undefined),
    cleanupExpiredRefreshTokens: vi.fn().mockResolvedValue(undefined),
    getCustomerUser: vi.fn(),
    getCustomerByUserId: vi.fn(),
    createPasswordResetToken: vi.fn().mockResolvedValue(undefined),
    getPasswordResetToken: vi.fn(),
    markPasswordResetTokenUsed: vi.fn().mockResolvedValue(undefined),
    seedDefaultTenant: vi.fn(),
    migrateAdminUsersToUsers: vi.fn(),
  },
}));

vi.mock("../services/emailService", () => ({
  sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../replitAuth", () => ({
  isAuthenticated: vi.fn((_req: unknown, _res: unknown, next: () => void) => next()),
}));

// ---- Now safe to import ----

import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import jwt from "jsonwebtoken";
import { storage } from "../storage";
import {
  checkRateLimit,
  trackFailedAttempt,
  loginAttempts,
  MAX_LOGIN_ATTEMPTS,
  generateAdminToken,
  generateAccessToken,
  requireAdminSession,
  JWT_SECRET,
} from "./auth-middleware";
import { registerLegacyAuthRoutes } from "./auth-legacy";
import { registerSaasAuthRoutes } from "./auth-saas";

const mockStorage = vi.mocked(storage);

// ----- Helpers -----

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  registerLegacyAuthRoutes(app);
  registerSaasAuthRoutes(app);
  return app;
}

// ----- Tests -----

describe("Auth Middleware - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginAttempts.clear();
  });

  // ===== Rate Limiting =====

  describe("checkRateLimit", () => {
    it("allows requests under the limit", () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as express.Response;

      expect(checkRateLimit("192.168.1.1", res)).toBe(true);
      expect(res.status).not.toHaveBeenCalled();
    });

    it("blocks after max attempts", () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as express.Response;

      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        trackFailedAttempt("192.168.1.2");
      }

      expect(checkRateLimit("192.168.1.2", res)).toBe(false);
      expect(res.status).toHaveBeenCalledWith(429);
    });

    it("resets after the time window expires", () => {
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      } as unknown as express.Response;

      loginAttempts.set("192.168.1.3", {
        count: MAX_LOGIN_ATTEMPTS,
        firstAttempt: Date.now() - 20 * 60 * 1000, // 20 min ago, window is 15
      });

      expect(checkRateLimit("192.168.1.3", res)).toBe(true);
      expect(loginAttempts.has("192.168.1.3")).toBe(false);
    });
  });

  describe("trackFailedAttempt", () => {
    it("creates entry on first failure", () => {
      trackFailedAttempt("10.0.0.1");
      expect(loginAttempts.get("10.0.0.1")!.count).toBe(1);
    });

    it("increments on subsequent failures", () => {
      trackFailedAttempt("10.0.0.2");
      trackFailedAttempt("10.0.0.2");
      trackFailedAttempt("10.0.0.2");
      expect(loginAttempts.get("10.0.0.2")!.count).toBe(3);
    });
  });

  // ===== Token Generation =====

  describe("generateAdminToken", () => {
    it("generates a valid JWT", () => {
      const token = generateAdminToken("owner", "ivan", "owner");
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.role).toBe("owner");
      expect(decoded.username).toBe("ivan");
      expect(decoded.userId).toBe("owner");
    });

    it("includes allowedTabs when provided", () => {
      const token = generateAdminToken("admin", "user1", "u1", ["bookings", "fleet"]);
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.allowedTabs).toEqual(["bookings", "fleet"]);
    });

    it("creates admin session in storage", () => {
      generateAdminToken("admin", "test", "test-id");
      expect(mockStorage.createAdminSession).toHaveBeenCalledWith(
        expect.any(String),
        "test-id",
        "admin",
        "test",
        expect.any(Date),
      );
    });
  });

  describe("generateAccessToken", () => {
    it("generates a SaaS JWT with tenantId", () => {
      const token = generateAccessToken("u1", "t1", "owner", "e@e.com");
      const decoded = jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
      expect(decoded.userId).toBe("u1");
      expect(decoded.tenantId).toBe("t1");
      expect(decoded.role).toBe("owner");
      expect(decoded.email).toBe("e@e.com");
    });
  });

  // ===== JWT Validation via requireAdminSession =====

  describe("requireAdminSession middleware", () => {
    function appWithMiddleware() {
      const a = express();
      a.use(express.json());
      a.get("/test", requireAdminSession, (_req, res) => res.json({ ok: true }));
      return a;
    }

    it("passes with a valid admin token", async () => {
      const token = jwt.sign({ userId: "owner", role: "owner", username: "ivan" }, JWT_SECRET, { expiresIn: "1h" });
      const res = await request(appWithMiddleware())
        .get("/test")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });

    it("rejects an expired token with explicit message", async () => {
      const token = jwt.sign({ userId: "owner", role: "owner", username: "ivan" }, JWT_SECRET, { expiresIn: "-1s" });
      const res = await request(appWithMiddleware())
        .get("/test")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("expirado");
    });

    it("rejects requests without Authorization header", async () => {
      const res = await request(appWithMiddleware()).get("/test");
      expect(res.status).toBe(401);
      expect(res.body.message).toContain("No autorizado");
    });

    it("rejects a blacklisted token", async () => {
      mockStorage.isTokenBlacklisted.mockResolvedValue(true as never);
      const token = jwt.sign({ userId: "owner", role: "owner", username: "ivan" }, JWT_SECRET, { expiresIn: "1h" });

      const res = await request(appWithMiddleware())
        .get("/test")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
    });

    it("rejects a token signed with the wrong secret", async () => {
      const token = jwt.sign({ userId: "owner", role: "owner", username: "ivan" }, "wrong-secret-completely-different-key!!", { expiresIn: "1h" });

      const res = await request(appWithMiddleware())
        .get("/test")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(401);
    });
  });
});

// ===== Legacy Admin Login =====

describe("Legacy Auth Routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    loginAttempts.clear();
    process.env.ADMIN_PIN = "123456";
    app = createApp();
  });

  afterEach(() => {
    delete process.env.ADMIN_PIN;
  });

  describe("POST /api/admin/login (PIN)", () => {
    it("authenticates with correct owner PIN", async () => {
      const res = await request(app).post("/api/admin/login").send({ pin: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeUndefined(); // JWT now in HttpOnly cookie, not response body
      expect(res.body.role).toBe("owner");
      expect(res.body.username).toBe("ivan");
      // Verify HttpOnly cookie is set
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const adminCookie = (Array.isArray(cookies) ? cookies : [cookies]).find((c: string) => c.startsWith("admin_token="));
      expect(adminCookie).toBeDefined();
      expect(adminCookie).toContain("HttpOnly");
      expect(adminCookie).toContain("SameSite=Strict");
    });

    it("rejects incorrect PIN", async () => {
      mockStorage.getAdminUsersWithPin.mockResolvedValue([] as never);

      const res = await request(app).post("/api/admin/login").send({ pin: "wrong" });

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("PIN incorrecto");
    });

    it("authenticates a user PIN from admin_users table", async () => {
      const bcrypt = await import("bcrypt");
      const hashedPin = await bcrypt.hash("654321", 12);

      mockStorage.getAdminUsersWithPin.mockResolvedValue([
        {
          id: "user-1",
          pin: hashedPin,
          role: "admin",
          username: "staff1",
          displayName: "Staff One",
          allowedTabs: ["bookings"],
        },
      ] as never);
      mockStorage.updateAdminUser.mockResolvedValue(undefined as never);

      const res = await request(app).post("/api/admin/login").send({ pin: "654321" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.role).toBe("admin");
      expect(res.body.username).toBe("staff1");
      expect(res.body.allowedTabs).toEqual(["bookings"]);
    });

    it("rate limits after max failed attempts", async () => {
      mockStorage.getAdminUsersWithPin.mockResolvedValue([] as never);

      for (let i = 0; i < MAX_LOGIN_ATTEMPTS; i++) {
        await request(app).post("/api/admin/login").send({ pin: "wrong" });
      }

      const res = await request(app).post("/api/admin/login").send({ pin: "wrong" });
      expect(res.status).toBe(429);
      expect(res.body.message).toContain("Demasiados intentos");
    });

    it("returns 503 when ADMIN_PIN is not configured", async () => {
      delete process.env.ADMIN_PIN;

      const res = await request(app).post("/api/admin/login").send({ pin: "123456" });
      expect(res.status).toBe(503);
    });
  });

  describe("POST /api/admin/login-user", () => {
    it("rejects missing credentials", async () => {
      const res = await request(app).post("/api/admin/login-user").send({});
      expect(res.status).toBe(400);
    });

    it("rejects wrong password", async () => {
      const bcrypt = await import("bcrypt");
      const hash = await bcrypt.hash("correct", 12);

      mockStorage.getAdminUserByUsername.mockResolvedValue({
        id: "u1", username: "admin", passwordHash: hash, isActive: true, role: "admin", displayName: "Admin",
      } as never);

      const res = await request(app).post("/api/admin/login-user").send({ username: "admin", password: "wrong" });
      expect(res.status).toBe(401);
    });

    it("rejects inactive user", async () => {
      mockStorage.getAdminUserByUsername.mockResolvedValue({
        id: "u1", username: "admin", passwordHash: "hash", isActive: false, role: "admin",
      } as never);

      const res = await request(app).post("/api/admin/login-user").send({ username: "admin", password: "any" });
      expect(res.status).toBe(401);
    });
  });
});

// ===== SaaS Auth Routes =====

describe("SaaS Auth Routes", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    loginAttempts.clear();
    process.env.ADMIN_PIN = "123456";
    app = createApp();
  });

  // ===== Password Reset =====

  describe("POST /api/auth/forgot-password", () => {
    it("returns success for non-existent email (prevents enumeration)", async () => {
      mockStorage.getAllTenants.mockResolvedValue([{ id: "t1", slug: "test" }] as never);
      mockStorage.getUserByEmail.mockResolvedValue(null as never);

      const res = await request(app).post("/api/auth/forgot-password").send({ email: "no@example.com" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.createPasswordResetToken).not.toHaveBeenCalled();
    });

    it("creates reset token for existing user", async () => {
      mockStorage.getAllTenants.mockResolvedValue([{ id: "t1", slug: "test" }] as never);
      mockStorage.getUserByEmail.mockResolvedValue({ id: "u1", email: "t@e.com", firstName: "T", tenantId: "t1" } as never);

      const res = await request(app).post("/api/auth/forgot-password").send({ email: "t@e.com" });

      expect(res.status).toBe(200);
      expect(mockStorage.createPasswordResetToken).toHaveBeenCalledWith("u1", expect.any(String), expect.any(Date));
    });

    it("rejects invalid email format", async () => {
      const res = await request(app).post("/api/auth/forgot-password").send({ email: "bad" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("resets password with valid token", async () => {
      mockStorage.getPasswordResetToken.mockResolvedValue({
        userId: "u1",
        token: "valid",
        expiresAt: new Date(Date.now() + 3600_000),
        usedAt: null,
      } as never);
      mockStorage.updateUser.mockResolvedValue({ id: "u1" } as never);

      const res = await request(app).post("/api/auth/reset-password").send({ token: "valid", password: "newpass123" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.updateUser).toHaveBeenCalledWith("u1", expect.objectContaining({ passwordHash: expect.any(String) }));
      expect(mockStorage.markPasswordResetTokenUsed).toHaveBeenCalledWith("valid");
      expect(mockStorage.deleteUserRefreshTokens).toHaveBeenCalledWith("u1");
    });

    it("rejects invalid/used token", async () => {
      mockStorage.getPasswordResetToken.mockResolvedValue(null as never);

      const res = await request(app).post("/api/auth/reset-password").send({ token: "bad", password: "newpass123" });
      expect(res.status).toBe(400);
    });

    it("rejects expired token", async () => {
      mockStorage.getPasswordResetToken.mockResolvedValue({
        userId: "u1", token: "exp", expiresAt: new Date(Date.now() - 60_000), usedAt: null,
      } as never);

      const res = await request(app).post("/api/auth/reset-password").send({ token: "exp", password: "newpass123" });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("expirado");
    });

    it("rejects short password", async () => {
      const res = await request(app).post("/api/auth/reset-password").send({ token: "x", password: "short" });
      expect(res.status).toBe(400);
    });
  });

  // ===== Refresh Token =====

  describe("POST /api/auth/refresh-token", () => {
    it("issues new tokens via rotation", async () => {
      mockStorage.getRefreshToken.mockResolvedValue({
        userId: "u1", token: "old-rt", expiresAt: new Date(Date.now() + 30 * 86400_000),
      } as never);
      mockStorage.getUserById.mockResolvedValue({
        id: "u1", tenantId: "t1", role: "owner", email: "e@e.com", isActive: true,
      } as never);

      const res = await request(app).post("/api/auth/refresh-token").send({ refreshToken: "old-rt" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(mockStorage.deleteRefreshToken).toHaveBeenCalledWith("old-rt");
      expect(mockStorage.createRefreshToken).toHaveBeenCalled();
    });

    it("rejects invalid refresh token", async () => {
      mockStorage.getRefreshToken.mockResolvedValue(null as never);

      const res = await request(app).post("/api/auth/refresh-token").send({ refreshToken: "invalid" });
      expect(res.status).toBe(401);
    });

    it("rejects expired refresh token", async () => {
      mockStorage.getRefreshToken.mockResolvedValue({
        userId: "u1", token: "exp-rt", expiresAt: new Date(Date.now() - 1000),
      } as never);

      const res = await request(app).post("/api/auth/refresh-token").send({ refreshToken: "exp-rt" });
      expect(res.status).toBe(401);
    });

    it("rejects when user is inactive", async () => {
      mockStorage.getRefreshToken.mockResolvedValue({
        userId: "u1", token: "rt", expiresAt: new Date(Date.now() + 86400_000),
      } as never);
      mockStorage.getUserById.mockResolvedValue({ id: "u1", isActive: false } as never);

      const res = await request(app).post("/api/auth/refresh-token").send({ refreshToken: "rt" });
      expect(res.status).toBe(401);
    });
  });

  // ===== Logout =====

  describe("POST /api/auth/logout", () => {
    it("blacklists access token and deletes refresh token", async () => {
      const token = jwt.sign({ userId: "u1", role: "owner", username: "test" }, JWT_SECRET, { expiresIn: "1h" });

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .send({ refreshToken: "rt-to-delete" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockStorage.blacklistToken).toHaveBeenCalledWith(token, expect.any(Date));
      expect(mockStorage.deleteRefreshToken).toHaveBeenCalledWith("rt-to-delete");
    });
  });
});
