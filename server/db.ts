import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import pg from 'pg';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";
import { config } from "./config";
import { logger } from "./lib/logger";

neonConfig.webSocketConstructor = ws;

// El driver de Neon habla por WebSocket: contra el Postgres del VPS da ECONNREFUSED.
const isNeon = config.DATABASE_URL.includes("neon.tech");

// Mismo API de query/connect en los dos: se tipa como el de Neon para no tocar a quien lo usa.
export const pool = new (isNeon ? NeonPool : pg.Pool)({
  connectionString: config.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  options: '-c statement_timeout=15000',
}) as unknown as NeonPool;

// Handle pool errors gracefully (Neon can terminate connections during sleep/maintenance)
pool.on('error', (err) => {
  logger.error("Pool connection error (will reconnect on next query)", { error: err.message });
});

export const db = isNeon
  ? drizzleNeon({ client: pool, schema })
  : (drizzlePg({ client: pool as unknown as pg.Pool, schema }) as unknown as ReturnType<typeof drizzleNeon<typeof schema>>);
