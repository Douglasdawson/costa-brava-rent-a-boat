import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(404, message, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Datos invalidos", public errors?: Record<string, string[]>) {
    super(400, message, "VALIDATION_ERROR");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(401, message, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(403, message, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflicto con el estado actual") {
    super(409, message, "CONFLICT");
  }
}

/**
 * Express error handler middleware.
 * Must be registered AFTER all routes.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // Log full error server-side
  logger.error(`[Error] ${err.name}: ${err.message}`, { stack: err instanceof AppError ? undefined : err.stack });

  if (err instanceof AppError) {
    const body: Record<string, unknown> = { message: err.message };
    if (err.code) body.code = err.code;
    if (err instanceof ValidationError && err.errors) {
      body.errors = err.errors;
    }
    return res.status(err.statusCode).json(body);
  }

  // Unknown errors - never expose details
  res.status(500).json({ message: "Error interno del servidor" });
}
