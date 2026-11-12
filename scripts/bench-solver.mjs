/**
 * Bộ đo bộ giải CFOP trong Pyodide — chạy được trong sandbox không có trình
 * duyệt.
 *
 * Dùng đúng gói `pyodide` 0.27.7 mà ứng dụng chạy trong trình duyệt, nạp mã
 * Python từ `solver-python/cfop_solver` vào hệ thống file của Pyodide giống hệt
 * `writeSolverFiles` trong `client/src/lib/pyodideLoader.ts`, rồi giải bộ đề
 * cố định và in ra bảng: đề, đúng/sai, số nước, thời gian.
 *
 *   node scripts/bench-solver.mjs
 *   node scripts/bench-solver.mjs --json      # xuất JSON để so sánh tự động
 *
 * Số liệu trên CPython để đối chiếu: `python3 solver-python/bench_solver.py`.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const solverDir = path.join(root, "solver-python", "cfop_solver");
const scrambles = JSON.parse(
  readFileSync(path.join(root, "scripts", "bench-scrambles.json"), "utf8")
);

/** Thư mục chứa package Python trong hệ thống file của Pyodide. */
const PACKAGE_DIR = "/home/pyodide/cfop_solver";

/** Tham số giải giống hệt đường gọi của worker trong trình duyệt. */
const SOLVE_OPTIONS = {
  last_layer: "auto",
  cross_color: "U",
  opening: "cross",
  xcross_depth: 8,
  xxcross_depth: 8,
  xxxcross_depth: 8,
  xxxxcross_depth: 8,
  direct_node_budget: 5000,
};

async function main() {
  const { loadPyodide } = await import("pyodide");
  // Gói npm `pyodide` đóng gói sẵn runtime (wasm, stdlib, lock file), nên
  // bộ đo chạy được hoàn toàn offline. Trong Node, `indexURL` là một đường
  // dẫn thường (không phải file:// URL).
  const pyodideDir = path.dirname(
    fileURLToPath(import.meta.resolve("pyodide"))
  );
  const runtime = await loadPyodide({ indexURL: `${pyodideDir}${path.sep}` });

  // Nạp mã solver vào hệ thống file, giống writeSolverFiles.
  runtime.FS.mkdirTree(PACKAGE_DIR);
  for (const file of readdirSync(solverDir)) {
    if (!file.endsWith(".py")) continue;
    runtime.FS.writeFile(
      `${PACKAGE_DIR}/${file}`,
      readFileSync(path.join(solverDir, file), "utf8")
    );
  }

  const results = [];
  // `--smoke`: chỉ giải một đề nhanh để kiểm thử nhanh (không đo hiệu năng).
  const smoke = process.argv.includes("--smoke");
  const groups = smoke
    ? { random: [scrambles.random[0]] }
    : { specified: scrambles.specified, random: scrambles.random };
  for (const [group, list] of Object.entries(groups)) {
    for (const scramble of list) {
      const payload = JSON.stringify({ scramble, options: SOLVE_OPTIONS });
      const output = await runtime.runPythonAsync(`
import json, time
from cfop_solver.cube import Cube, SOLVED
from cfop_solver.notation import parse_moves
from cfop_solver.solver import solve

request = json.loads(${JSON.stringify(payload)})
scramble = request["scramble"]
options = request["options"]
cube = Cube().apply_many(parse_moves(scramble))
started = time.monotonic()
solution = solve(cube, **options)
elapsed = time.monotonic() - started
check = Cube().apply_many(parse_moves(scramble)).apply_many(solution.moves)
json.dumps({
    "moves": list(solution.moves),
    "seconds": elapsed,
    "solved": check.stickers == SOLVED,
})
`);
      const row = JSON.parse(String(output));
      results.push({ group, scramble, ...row });
      const status = row.solved ? "OK  " : "SAI ";
      console.log(
        `${status} ${row.seconds.toFixed(2).padStart(6)}s  ${String(row.moves.length).padStart(3)} nước  ${scramble}`
      );
    }
  }

  const solved = results.filter(row => row.solved).length;
  const slowest = results.reduce(
    (worst, row) => (row.seconds > worst.seconds ? row : worst),
    results[0]
  );
  console.log(
    `\n${solved}/${results.length} đúng · chậm nhất ${slowest.seconds.toFixed(2)}s (${slowest.scramble})`
  );

  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(results, null, 2));
  }

  // `--smoke` dùng cho kiểm thử: phải giải đúng thì mới exit 0.
  if (smoke && solved !== results.length) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
