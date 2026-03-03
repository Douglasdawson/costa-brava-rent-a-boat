import type { Request } from "express";

// Legacy admin JWT payload (backward compat)
export interface AdminJwtPayload {
  userId: string;
  role: string;
  username: string;
  iat?: number;
  exp?: number;
}

// SaaS JWT payload with tenantId
export interface SaasJwtPayload {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Union type for any JWT payload
export type JwtPayload = AdminJwtPayload | SaasJwtPayload;

// Authenticated request with typed auth properties
export interface AuthenticatedRequest extends Request {
  adminUser?: AdminJwtPayload | SaasJwtPayload;
  saasUser?: SaasJwtPayload;
  tenantId?: string;
  authUser?: {
    id: string;
    tenantId: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}
