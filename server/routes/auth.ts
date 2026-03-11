import type { Express } from "express";
import { registerSaasAuthRoutes } from "./auth-saas";
import { registerLegacyAuthRoutes } from "./auth-legacy";

// Re-export everything consumers need from auth-middleware
export {
  requireAdminSession,
  requireSaasAuth,
  requireAdminRole,
  requireOwner,
  injectTenantId,
  generateAdminToken,
} from "./auth-middleware";

export function registerAuthRoutes(app: Express) {
  registerSaasAuthRoutes(app);
  registerLegacyAuthRoutes(app);
}
