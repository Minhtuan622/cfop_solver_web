import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database is unavailable");
  return db;
}

/**
 * Whether the database answers right now.
 *
 * A missing config or an unreachable server reads as false, never as a throw,
 * so a caller may report readiness instead of crashing.
 */
export async function databaseReady(): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.execute(sql`select 1`);
    return true;
  } catch (error) {
    console.warn("[Database] Not ready:", error);
    return false;
  }
}
