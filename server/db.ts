import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from "./config";

neonConfig.webSocketConstructor = ws;

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Handle pool errors gracefully (Neon can terminate connections during sleep/maintenance)
pool.on('error', (err) => {
  console.error('[DB] Pool connection error (will reconnect on next query):', err.message);
});

export const db = drizzle({ client: pool, schema });
