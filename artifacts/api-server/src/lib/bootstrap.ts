import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Ensures required PostgreSQL extensions exist. Idempotent and safe to call on
 * every boot. `pg_trgm` powers in-database trigram similarity used by duplicate
 * detection in NormalizationService — without it `similarity()` errors at runtime.
 *
 * NON-FATAL: a failure here (DB briefly unreachable on boot, or the deploy DB
 * role lacking CREATE EXTENSION) must NOT prevent the server from binding its
 * port. Liveness is not DB-readiness — readiness is reported separately by
 * routes/health.ts (/readyz → 503 when the DB is down). Previously a rejection
 * here aborted boot via process.exit(1), so the port never opened and the deploy
 * was killed ("port never opened"). We now log and continue; trigram-based
 * duplicate detection degrades gracefully until the extension/DB is available.
 */
export async function ensureDbExtensions(): Promise<void> {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
  } catch (err) {
    logger.error(
      { err },
      "ensureDbExtensions failed; continuing so the server still binds its port",
    );
  }
}
