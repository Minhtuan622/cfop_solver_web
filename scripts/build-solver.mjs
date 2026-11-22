/**
 * Build bộ giải Rust (packages/solver) ra WebAssembly cho trình duyệt.
 *
 *   node scripts/build-solver.mjs
 *
 * Kết quả nằm ở `packages/solver/solver-wasm/pkg` (không commit vào git):
 * `solver_wasm.js` (glue), `solver_wasm_bg.wasm` và `solver_wasm.d.ts`
 * (kiểu TypeScript sinh bởi tsify). Cần Rust, target
 * `wasm32-unknown-unknown` và `wasm-pack`; `wasm-opt` (Binaryen) được chạy
 * thêm nếu có trong PATH.
 */
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const crate = path.join(root, "packages", "solver", "solver-wasm");
const pkg = path.join(crate, "pkg");
const wasm = path.join(pkg, "solver_wasm_bg.wasm");

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", cwd: root });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function has(command) {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
}

if (!has("wasm-pack")) {
  console.error(
    "wasm-pack không có trong PATH. Cài: rustup target add wasm32-unknown-unknown && cargo install wasm-pack"
  );
  process.exit(1);
}

run("wasm-pack", ["build", crate, "--target", "web", "--release", "--out-dir", pkg, "--no-pack"]);

const before = statSync(wasm).size;
if (has("wasm-opt")) {
  run("wasm-opt", ["-Os", "--enable-bulk-memory", "--enable-nontrapping-float-to-int", "--enable-sign-ext", "--enable-mutable-globals", wasm, "-o", wasm]);
} else {
  console.warn("wasm-opt không có trong PATH: bỏ qua bước tối ưu thêm.");
}
const after = statSync(wasm).size;
console.log(`solver_wasm_bg.wasm: ${(before / 1024).toFixed(1)} KiB -> ${(after / 1024).toFixed(1)} KiB`);
if (!existsSync(path.join(pkg, "solver_wasm.js"))) process.exit(1);
