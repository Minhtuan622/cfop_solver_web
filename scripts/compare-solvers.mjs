/**
 * So sánh hai engine của bộ giải trên cùng bộ đề: Pyodide (Python, engine
 * hiện tại) và WebAssembly (Rust, `packages/solver`).
 *
 *   node scripts/build-solver.mjs        # cần bản build WASM trước
 *   node scripts/compare-solvers.mjs [số đề=500] [--json-file out.json]
 *
 * Mỗi đề là 25 nước ngẫu nhiên (seed cố định). Cả hai engine được gọi với
 * đúng tham số mặc định của Studio (cross U, opening cross, last layer auto,
 * cùng ngân sách). Lời giải của MỖI engine được kiểm tra độc lập bằng mô
 * hình khối của Python (`cfop_solver.cube`): áp dụng scramble rồi lời giải
 * phải ra đúng trạng thái đã giải. Script in số đề giải đúng của từng
 * engine và số đề có độ dài lời giải khác nhau; thoát mã 1 nếu có đề sai.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const count = Number(args.find(a => /^\d+$/.test(a)) ?? 500);
const jsonFile = args.includes("--json-file") ? args[args.indexOf("--json-file") + 1] : null;

/** Cùng tham số với worker trong trình duyệt. */
const STUDIO = {
  crossColor: "U",
  opening: "cross",
  lastLayer: "auto",
  openingDepth: 8,
  directNodeBudget: 5000,
  timeBudgetSec: 40,
  nodeBudget: 400000,
};

function rng(seed) {
  let s = BigInt(seed);
  return () => {
    s = (s + 0x9e3779b97f4a7c15n) & 0xffffffffffffffffn;
    let z = s;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & 0xffffffffffffffffn;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & 0xffffffffffffffffn;
    return Number((z ^ (z >> 31n)) % 1000000n) / 1000000;
  };
}

function scrambles(n) {
  const next = rng(20261121);
  const out = [];
  for (let i = 0; i < n; i++) {
    const moves = [];
    while (moves.length < 25) {
      const face = "URFDLB"[Math.floor(next() * 6)];
      if (moves.length && moves.at(-1)[0] === face) continue;
      moves.push(face + ["", "'", "2"][Math.floor(next() * 3)]);
    }
    out.push(moves.join(" "));
  }
  return out;
}

async function loadPython() {
  const { loadPyodide } = await import("pyodide");
  const dir = path.dirname(fileURLToPath(import.meta.resolve("pyodide")));
  const py = await loadPyodide({ indexURL: `${dir}${path.sep}` });
  const solverDir = path.join(root, "solver-python", "cfop_solver");
  py.FS.mkdirTree("/home/pyodide/cfop_solver");
  for (const file of readdirSync(solverDir)) {
    if (file.endsWith(".py")) {
      py.FS.writeFile(`/home/pyodide/cfop_solver/${file}`, readFileSync(path.join(solverDir, file), "utf8"));
    }
  }
  await py.runPythonAsync(`
import json, time
from cfop_solver import Cube, parse_moves, solve
from cfop_solver.cube import SOLVED

def py_solve(scramble):
    initial = Cube().apply_many(parse_moves(scramble))
    started = time.monotonic()
    s = solve(initial, last_layer="auto", cross_color="U", opening="cross",
              xcross_depth=8, xxcross_depth=8, xxxcross_depth=8, xxxxcross_depth=8,
              direct_node_budget=5000, time_budget_sec=40.0, node_budget=400000)
    return json.dumps({"moves": list(s.moves), "seconds": time.monotonic() - started})

def py_check(scramble, moves_json):
    moves = json.loads(moves_json)
    return Cube().apply_many(parse_moves(scramble)).apply_many(moves).stickers == SOLVED
`);
  return py;
}

async function loadWasm() {
  const pkg = path.join(root, "packages", "solver", "solver-wasm", "pkg");
  const wasm = await import(path.join(pkg, "solver_wasm.js"));
  wasm.initSync({ module: readFileSync(path.join(pkg, "solver_wasm_bg.wasm")) });
  return wasm;
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.round((sorted.length - 1) * p))];
}

const py = await loadPython();
const wasm = await loadWasm();
const pySolve = py.globals.get("py_solve");
const pyCheck = py.globals.get("py_check");

let t = performance.now();
wasm.warmUp();
const wasmWarmMs = performance.now() - t;

const rows = [];
for (const [i, scramble] of scrambles(count).entries()) {
  const row = { scramble };
  // Lỗi của một engine (ví dụ ngoại lệ của solver) được ghi lại cho đề đó,
  // không làm dừng cả lần so sánh.
  t = performance.now();
  try {
    const p = JSON.parse(pySolve(scramble));
    row.pyodide = { moves: p.moves.length, ms: p.seconds * 1000, solved: pyCheck(scramble, JSON.stringify(p.moves)) };
  } catch (error) {
    const message = String(error?.message ?? error).trim().split("\n").at(-1);
    row.pyodide = { moves: null, ms: performance.now() - t, solved: false, error: message };
  }
  t = performance.now();
  try {
    const w = wasm.solve(wasm.scrambleToStickers(scramble), STUDIO);
    const wMoves = w.phases.flatMap(ph => ph.moves);
    row.wasm = { moves: wMoves.length, ms: performance.now() - t, solved: pyCheck(scramble, JSON.stringify(wMoves)), lastLayer: w.last_layer.achieved };
  } catch (error) {
    row.wasm = { moves: null, ms: performance.now() - t, solved: false, error: `${error?.code}: ${error?.message}` };
  }
  rows.push(row);
  if ((i + 1) % 50 === 0) console.error(`${i + 1}/${count}`);
}

const summary = engine => {
  const ok = rows.filter(r => r[engine].solved).length;
  const lens = rows.filter(r => r[engine].moves !== null).map(r => r[engine].moves);
  const ms = rows.map(r => r[engine].ms);
  return {
    solved: ok,
    meanMoves: lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length),
    errors: rows.filter(r => r[engine].error).map(r => ({ scramble: r.scramble, error: r[engine].error })),
    p50ms: percentile(ms, 0.5),
    p95ms: percentile(ms, 0.95),
    maxMs: percentile(ms, 1),
  };
};
const report = {
  count,
  wasmWarmUpMs: wasmWarmMs,
  pyodide: summary("pyodide"),
  wasm: summary("wasm"),
  // Chỉ so độ dài trên các đề mà cả hai engine đều giải đúng.
  bothSolved: rows.filter(r => r.pyodide.solved && r.wasm.solved).length,
  lengthDiffers: rows.filter(r => r.pyodide.solved && r.wasm.solved && r.pyodide.moves !== r.wasm.moves).length,
  wasmShorter: rows.filter(r => r.pyodide.solved && r.wasm.solved && r.wasm.moves < r.pyodide.moves).length,
  wasmLonger: rows.filter(r => r.pyodide.solved && r.wasm.solved && r.wasm.moves > r.pyodide.moves).length,
};
console.log(JSON.stringify(report, null, 2));
if (jsonFile) writeFileSync(jsonFile, JSON.stringify({ report, rows }, null, 2));
if (report.pyodide.solved !== count || report.wasm.solved !== count) process.exit(1);
