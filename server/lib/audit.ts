import type { Request } from "express";
import { logger } from "./logger";

export function audit(
  req: Request,
  action: string,
  resource: string,
  resourceId: string | number,
  details?: Record<string, unknown>
): void {
  // Fire and forget
  try {
    import("../storage/audit").then(({ createAuditLog }) => {
      createAuditLog({
        action,
        resource,
        resourceId: String(resourceId),
        details: details ? JSON.stringify(details) : null,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
      }).catch((err: Error) => {
        logger.error("Failed to create audit log", { error: err.message, action, resource });
      });
    });
  } catch {
    // Never throw from audit
  }
}
