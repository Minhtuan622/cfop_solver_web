import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const solverDir = path.join(root, "packages", "solver");
const pkg = path.join(solverDir, "solver-wasm", "pkg");
const required = ["solver_wasm.js", "solver_wasm.d.ts", "solver_wasm_bg.wasm"];

function hasWasmPack() {
  return spawnSync("wasm-pack", ["--version"], { stdio: "ignore" }).status === 0;
}

function newestSource(dir) {
  let newest = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "target" || entry.name === "pkg" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) newest = Math.max(newest, newestSource(full));
    else if (/\.(rs|toml|lock)$/.test(entry.name)) newest = Math.max(newest, statSync(full).mtimeMs);
  }
  return newest;
}

const missing = required.filter(file => !existsSync(path.join(pkg, file)));
if (missing.length === 0) {
  const built = statSync(path.join(pkg, "solver_wasm_bg.wasm")).mtimeMs;
  if (newestSource(solverDir) > built) {
    console.warn(
      "[solver] code Rust mới hơn bản build WebAssembly — chạy `pnpm build:solver` để cập nhật."
    );
  }
  process.exit(0);
}

if (hasWasmPack()) {
  console.log("[solver] chưa có bản build WebAssembly, đang build (pnpm build:solver)...");
  const result = spawnSync(process.execPath, [path.join(root, "scripts", "build-solver.mjs")], {
    cwd: root,
    stdio: "inherit",
  });
  process.exit(result.status ?? 1);
}

console.error(
  [
    `[solver] thiếu ${missing.join(", ")} trong packages/solver/solver-wasm/pkg.`,
    "Bộ giải là Rust biên dịch ra WebAssembly. Cài Rust (https://rustup.rs), rồi:",
    "  rustup target add wasm32-unknown-unknown",
    "  cargo install wasm-pack --locked",
    "  pnpm build:solver",
  ].join("\n")
);
process.exit(1);
