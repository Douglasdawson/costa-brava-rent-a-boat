import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import ws from "ws";
import * as schema from "../../../shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Mismo criterio que server/db.ts: el driver de Neon habla por WebSocket y contra
// el Postgres del VPS todas las consultas mueren ("Failed query" sin causa). Este
// modulo no importa server/config (los MCP stdio corren sueltos), por eso va aparte.
const isNeon = process.env.DATABASE_URL.includes("neon.tech");

export const pool = (isNeon
  ? new NeonPool({ connectionString: process.env.DATABASE_URL })
  : new pg.Pool({ connectionString: process.env.DATABASE_URL })) as unknown as NeonPool;

export const db = isNeon
  ? drizzleNeon({ client: pool, schema })
  : (drizzlePg({ client: pool as unknown as pg.Pool, schema }) as unknown as ReturnType<typeof drizzleNeon<typeof schema>>);
