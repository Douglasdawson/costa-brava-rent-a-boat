import type { Request } from "express";
import { logger } from "./logger";
import { createAuditLog } from "../storage/audit";
import type { AuthenticatedRequest } from "../types";

function extractIdentity(req: Request | null): { userId: string | null; username: string | null } {
  if (!req) return { userId: null, username: "system" };
  const adminUser = (req as AuthenticatedRequest).adminUser;
  if (!adminUser) return { userId: null, username: null };
  const userId = adminUser.userId ?? null;
  const username = "username" in adminUser ? adminUser.username : ("email" in adminUser ? adminUser.email : null);
  return { userId, username };
}

function extractIp(req: Request | null): string {
  if (!req) return "system";
  return req.ip || req.socket?.remoteAddress || "unknown";
}

export function audit(
  req: Request | null,
  action: string,
  resource: string,
  resourceId: string | number,
  details?: Record<string, unknown>
): void {
  // Fire and forget — never throw
  try {
    const { userId, username } = extractIdentity(req);
    createAuditLog({
      userId,
      username,
      action,
      resource,
      resourceId: String(resourceId),
      details: details ?? null,
      ipAddress: extractIp(req),
    }).catch((err: Error) => {
      logger.error("Failed to create audit log", { error: err.message, action, resource });
    });
  } catch {
    // Never throw from audit
  }
}
