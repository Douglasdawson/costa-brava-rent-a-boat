import express from "express";
import type { Express } from "express";

export function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  return app;
}
