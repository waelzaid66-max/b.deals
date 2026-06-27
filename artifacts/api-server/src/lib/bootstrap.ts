import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

/**
 * Ensures required PostgreSQL extensions exist. Idempotent and safe to call on
 * every boot. `pg_trgm` powers in-database trigram similarity used by duplicate
 * detection in NormalizationService — without it `similarity()` errors at runtime.
 */
export async function ensureDbExtensions(): Promise<void> {
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
}
