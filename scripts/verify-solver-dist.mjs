import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const assets = path.resolve(import.meta.dirname, "..", "dist", "public", "assets");

let files = [];
try {
  files = readdirSync(assets);
} catch {
  console.error(`[solver] không tìm thấy ${assets}. Hãy chạy vite build trước.`);
  process.exit(1);
}

const wasm = files.filter(name => /^solver_wasm_bg-.+\.wasm$/.test(name));
const worker = files.filter(name => /^solverWorker-.+\.js$/.test(name));
const problems = [];
if (wasm.length !== 1) problems.push(`cần đúng 1 file solver_wasm_bg-*.wasm, có ${wasm.length}`);
if (worker.length === 0) problems.push("thiếu chunk solverWorker-*.js");
if (wasm.length === 1) {
  const bytes = readFileSync(path.join(assets, wasm[0]));
  if (bytes.length < 8 || bytes.readUInt32LE(0) !== 0x6d736100) {
    problems.push(`${wasm[0]} không phải WebAssembly hợp lệ`);
  }
}

if (problems.length > 0) {
  console.error(`[solver] dist thiếu bộ giải: ${problems.join("; ")}`);
  process.exit(1);
}
const size = readFileSync(path.join(assets, wasm[0])).length;
console.log(`[solver] dist có ${wasm[0]} (${(size / 1024).toFixed(1)} KiB) và ${worker.join(", ")}.`);
