/**
 * Bộ đo bộ giải CFOP trong Pyodide — chạy được trong sandbox không có trình
 * duyệt.
 *
 * Dùng đúng gói `pyodide` mà ứng dụng chạy trong trình duyệt. Phiên bản được
 * ghim ở ba nơi và phải khớp nhau: hằng số `PYODIDE_VERSION` trong
 * `client/src/lib/pyodideLoader.ts`, hằng số `PYODIDE_VERSION` trong
 * `scripts/fetch-pyodide.mjs`, và devDependency `pyodide` trong
 * `package.json` (bản đích xác, không dùng `^` hay `~`).
 * `server/pyodideAssets.test.ts` chặn lệch ở cả ba nơi, nên bộ đo luôn đo
 * đúng runtime đang phát hành — không cần nhắc phiên bản cứng ở đây.
 *
 * Bộ đo nạp mã Python từ `solver-python/cfop_solver` vào hệ thống file của
 * Pyodide giống hệt `writeSolverFiles` trong
 * `client/src/lib/pyodideLoader.ts`, rồi giải bộ đề cố định và in ra bảng:
 * đề, đúng/sai, số nước, thời gian.
 *
 *   node scripts/bench-solver.mjs
 *   node scripts/bench-solver.mjs --json      # xuất JSON để so sánh tự động
 *   node scripts/bench-solver.mjs --check     # chế độ kiểm tra ngưỡng thời gian
 *
 * Chế độ `--check` thoát với mã khác 0 khi: có đề giải sai, có đề chậm hơn
 * `PER_SCRAMBLE_LIMIT_SEC` (đề vượt ngưỡng được chạy lại một lần để loại
 * nhiễu), hoặc tổng thời gian vượt `TOTAL_LIMIT_SEC`. Ngưỡng mặc định xem ở
 * `scripts/bench-check.mjs`.
 *
 * Số liệu trên CPython để đối chiếu: `python3 solver-python/bench_solver.py`.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { evaluateRun, resolveLimits } from "./bench-check.mjs";

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
  // Cùng ngân sách với đường gọi của worker trong trình duyệt.
  time_budget_sec: 40,
  node_budget: 400000,
};

/** Mã Python giải một đề, in ra JSON kết quả. */
const SOLVE_PYTHON = `
import json, time
from cfop_solver.cube import Cube, SOLVED
from cfop_solver.notation import parse_moves
from cfop_solver.solver import solve

request = json.loads(__PAYLOAD__)
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
`;

/** Nạp Pyodide và đưa mã solver vào hệ thống file của nó. */
async function createRuntime() {
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
  return runtime;
}

/** Giải một đề và trả về { moves, seconds, solved }. */
async function solveScramble(runtime, scramble) {
  const payload = JSON.stringify({ scramble, options: SOLVE_OPTIONS });
  // `JSON.stringify` của payload cho ra một chuỗi JSON; nhúng nguyên chuỗi đó
  // vào mã Python (dùng hàm thay thế để `$` trong chuỗi không bị hiểu sai).
  const source = SOLVE_PYTHON.replace(
    "__PAYLOAD__",
    () => JSON.stringify(payload)
  );
  const output = await runtime.runPythonAsync(source);
  return JSON.parse(String(output));
}

/** In một dòng kết quả của bảng bộ đo. */
function printRow(row) {
  const status = row.solved ? "OK  " : "SAI ";
  console.log(
    `${status} ${row.seconds.toFixed(2).padStart(6)}s  ${String(row.moves.length).padStart(3)} nước  ${row.scramble}`
  );
}

/** In bảng kết luận của chế độ kiểm tra. */
function printReport(report) {
  const { totals, limits } = report;
  const slowest = totals.slowest;
  console.log("\n--- Kiểm tra ngưỡng thời gian ---");
  console.log(`  ngưỡng mỗi đề : ${limits.perScrambleLimitSec.toFixed(2)}s`);
  console.log(`  ngưỡng tổng    : ${limits.totalLimitSec.toFixed(2)}s`);
  console.log(`  giải đúng      : ${totals.solvedCount}/${totals.count}`);
  console.log(
    `  chậm nhất      : ${slowest ? `${slowest.seconds.toFixed(2)}s` : "-"}` +
      (slowest ? ` · ${slowest.scramble}` : "")
  );
  console.log(`  tổng           : ${totals.totalSeconds.toFixed(2)}s`);

  for (const item of report.noisy) {
    console.log(
      `  (bỏ qua nhiễu)  ${item.scramble}: lần đầu ${item.firstSeconds.toFixed(2)}s, chạy lại ${item.retrySeconds.toFixed(2)}s`
    );
  }

  if (report.ok) {
    console.log(
      `\nKẾT LUẬN: PASS — ${totals.solvedCount}/${totals.count} đề giải đúng, ` +
        `chậm nhất ${slowest ? slowest.seconds.toFixed(2) : "0.00"}s, ` +
        `tổng ${totals.totalSeconds.toFixed(2)}s ` +
        `(ngưỡng ${limits.perScrambleLimitSec.toFixed(2)}s/đề, ${limits.totalLimitSec.toFixed(2)}s tổng).`
    );
    return;
  }

  console.log(`\nKẾT LUẬN: FAIL — ${report.failures.length} vi phạm:`);
  for (const failure of report.failures) {
    console.log(`  - ${failure.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  // `--smoke`: chỉ giải một đề nhanh để kiểm thử nhanh (không đo hiệu năng).
  const smoke = args.includes("--smoke");
  // `--check`: chế độ kiểm tra ngưỡng thời gian (dùng trong CI).
  const check = args.includes("--check");
  const jsonFileIndex = args.indexOf("--json-file");
  const jsonFile =
    jsonFileIndex >= 0 ? args[jsonFileIndex + 1] : undefined;

  const runtime = await createRuntime();

  const results = [];
  const groups = smoke
    ? { random: [scrambles.random[0]] }
    : { specified: scrambles.specified, random: scrambles.random };
  for (const [group, list] of Object.entries(groups)) {
    for (const scramble of list) {
      const row = await solveScramble(runtime, scramble);
      results.push({ group, scramble, ...row });
      printRow(results[results.length - 1]);
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

  if (!check) {
    if (args.includes("--json")) {
      console.log(JSON.stringify(results, null, 2));
    }
    // `--smoke` dùng cho kiểm thử: phải giải đúng thì mới exit 0.
    if (smoke && solved !== results.length) process.exitCode = 1;
    return;
  }

  // Chế độ kiểm tra: đề vượt ngưỡng thời gian được chạy lại đúng một lần để
  // loại nhiễu đo. Đề giải sai không bao giờ được chạy lại.
  const limits = resolveLimits(process.env);
  const retries = [];
  const slowResults = results.filter(
    row => row.solved && row.seconds > limits.perScrambleLimitSec
  );
  for (const row of slowResults) {
    console.log(
      `\n→ chạy lại đề quá ngưỡng ${limits.perScrambleLimitSec}s: ${row.scramble}`
    );
    const retry = await solveScramble(runtime, row.scramble);
    retries.push({ scramble: row.scramble, ...retry });
    printRow({ ...retry, scramble: row.scramble });
  }

  const report = evaluateRun({ results, retries, limits });
  printReport(report);

  if (jsonFile) {
    writeFileSync(
      jsonFile,
      JSON.stringify({ ...report, results, retries }, null, 2),
      "utf8"
    );
    console.log(`\n[bench] đã ghi JSON: ${jsonFile}`);
  } else if (args.includes("--json")) {
    console.log(JSON.stringify({ ...report, results, retries }, null, 2));
  }

  process.exitCode = report.exitCode;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
