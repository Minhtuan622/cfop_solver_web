// Applies the Drizzle migrations in ./drizzle to DATABASE_URL.
// Runs as Railway's pre-deploy command, using only production dependencies.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { createConnection } from "mysql2/promise";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required to run migrations");

const connection = await createConnection(url);
try {
  await migrate(drizzle(connection), {
    migrationsFolder: resolve(import.meta.dirname, "..", "drizzle"),
  });
  console.log("[migrate] migrations applied");
} finally {
  await connection.end();
}
