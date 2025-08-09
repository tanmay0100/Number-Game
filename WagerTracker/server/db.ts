import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections in the pool
  min: 2, // Minimum number of connections in the pool
  idleTimeoutMillis: 60000, // Close idle connections after 60 seconds
  connectionTimeoutMillis: 10000, // Timeout for getting a connection (10 seconds)
  maxUses: 7500, // Close connections after this many uses to prevent memory leaks
  allowExitOnIdle: false, // Keep pool alive
});

export const db = drizzle({ client: pool, schema });
