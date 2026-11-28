// Production entry for Railway: apply migrations, then load the server.
// Every step is logged so a deploy that fails its healthcheck shows where it
// stopped, instead of only the output of the migration script.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");

console.log(`[start] node ${process.version} PORT=${process.env.PORT ?? "(unset)"} NODE_ENV=${process.env.NODE_ENV ?? "(unset)"}`);
console.log(`[start] pid=${process.pid} ppid=${process.ppid} cwd=${process.cwd()} argv=${JSON.stringify(process.argv.slice(1))}`);

process.on("exit", code => console.log(`[start] process exit code=${code}`));
process.on("uncaughtException", error => {
  console.error("[start] uncaught exception", error);
  process.exit(1);
});
process.on("unhandledRejection", reason => {
  console.error("[start] unhandled rejection", reason);
  process.exit(1);
});

const migration = spawnSync(process.execPath, [resolve(root, "scripts/migrate.mjs")], {
  stdio: "inherit",
});
if (migration.status !== 0) {
  console.error(`[start] migration failed status=${migration.status} signal=${migration.signal}`);
  process.exit(migration.status ?? 1);
}

console.log("[start] loading server");
await import(pathToFileURL(resolve(root, "dist/index.js")).href);
console.log("[start] server module loaded");
