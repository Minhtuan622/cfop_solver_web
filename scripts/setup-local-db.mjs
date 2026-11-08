import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const composeFile = resolve(root, "compose.local.yaml");
const envFile = resolve(root, ".env.local");
const databaseUrl = "mysql://cfop:cfop_local@127.0.0.1:3307/cfop_solver";

function run(command, args, options = {}) {
  return spawnSync(command, args, { cwd: root, stdio: "inherit", ...options });
}

function canRun(command, args) {
  try {
    execFileSync(command, args, { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function composeCommand() {
  if (canRun("docker", ["compose", "version"])) return ["docker", ["compose"]];
  if (canRun("docker-compose", ["version"])) return ["docker-compose", []];
  throw new Error("Không tìm thấy Docker Compose. Hãy cài Docker Desktop rồi chạy lại pnpm db:setup.");
}

function ensureEnv() {
  const current = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";
  const additions = [];
  if (!/^DATABASE_URL=/m.test(current)) additions.push(`DATABASE_URL=${databaseUrl}`);
  if (!/^NODE_ENV=/m.test(current)) additions.push("NODE_ENV=development");
  if (!/^PORT=/m.test(current)) additions.push("PORT=3000");
  if (additions.length) writeFileSync(envFile, `${current.trimEnd()}${current.trimEnd() ? "\n" : ""}${additions.join("\n")}\n`);
}

function waitForHealthy(compose, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  process.stdout.write("Đang chờ database sẵn sàng");
  while (Date.now() < deadline) {
    try {
      const status = execFileSync("docker", ["inspect", "--format", "{{.State.Health.Status}}", "cfop-solver-db-local"], { encoding: "utf8" }).trim();
      if (status === "healthy") {
        process.stdout.write(" OK\n");
        return;
      }
      process.stdout.write(".");
    } catch {
      process.stdout.write(".");
    }
    execFileSync(process.platform === "win32" ? "powershell.exe" : "sleep", process.platform === "win32" ? ["-NoProfile", "-Command", "Start-Sleep -Seconds 2"] : ["2"], { stdio: "ignore" });
  }
  process.stdout.write("\n");
  throw new Error("Database không sẵn sàng sau 90 giây. Chạy pnpm db:logs để xem log.");
}

const [compose, baseArgs] = composeCommand();
ensureEnv();
console.log("Khởi động MariaDB local trên cổng 3307...");
const up = run(compose, [...baseArgs, "-f", composeFile, "up", "-d"]);
if (up.status !== 0) process.exit(up.status ?? 1);
waitForHealthy(compose);
console.log("Áp dụng schema Drizzle...");
// Run drizzle-kit directly so the setup works even when pnpm is only
// available through corepack. This mirrors the `db:push` script.
const drizzleKit = resolve(root, "node_modules", "drizzle-kit", "bin.cjs");
for (const command of ["generate", "migrate"]) {
  const result = run(process.execPath, [drizzleKit, command]);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`Database local đã sẵn sàng: ${databaseUrl}`);
console.log("Bạn có thể chạy pnpm dev để mở ứng dụng.");
