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
 * Có **hai kịch bản**, mỗi kịch bản một bộ ngưỡng riêng:
 * - `cross` — `opening: "cross"`, tức kịch bản mặc định của app;
 * - `auto`  — `opening: "auto"`, bộ giải thử bậc cross cao nhất trước nên đắt
 *   hơn nhiều (đo được chậm nhất ~21s cho một đề, tổng ~69s cho 11 đề).
 *
 *   node scripts/bench-solver.mjs
 *   node scripts/bench-solver.mjs --json      # xuất JSON để so sánh tự động
 *   node scripts/bench-solver.mjs --check     # chế độ kiểm tra ngưỡng thời gian
 *
 * Chế độ `--check` thoát với mã khác 0 khi: có đề giải sai, có đề chậm hơn
 * ngưỡng của kịch bản đó (đề vượt ngưỡng được chạy lại một lần để loại
 * nhiễu), hoặc tổng thời gian vượt ngưỡng tổng. Ngưỡng mặc định xem ở
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

/**
 * Metadata của runtime đo được — đọc từ gói đang cài, không đọc hằng số
 * trong source hay `package.json` của repo.
 *
 * `import.meta.resolve("pyodide")` trỏ tới entry thật trong `node_modules`
 * (qua symlink pnpm); `package.json` cùng thư mục là phiên bản đang chạy.
 */
function runtimeMetadata() {
  const entry = fileURLToPath(import.meta.resolve("pyodide"));
  const pkg = JSON.parse(
    readFileSync(path.join(path.dirname(entry), "package.json"), "utf8")
  );
  return {
    pyodideVersion: pkg.version,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

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

/**
 * Kịch bản được đo.
 *
 * - `cross`: kịch bản mặc định của app (`opening: "cross"`).
 * - `auto`: `opening: "auto"` — bộ giải thử bậc cross cao nhất trước nên
 *   đắt hơn nhiều. Đây là lựa chọn có sẵn trong phần cài đặt của app, nên
 *   phải có ngân sách thời gian riêng, nếu không một chậm lệch nhỏ ở đây sẽ
 *   không bao giờ bị bắt.
 */
const SCENARIOS = [
  { name: "cross", opening: "cross" },
  { name: "auto", opening: "auto" },
];

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
async function solveScramble(runtime, scramble, options) {
  const payload = JSON.stringify({ scramble, options });
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
function printReport(report, scenarioName) {
  const { totals, limits } = report;
  const slowest = totals.slowest;
  console.log(`\n--- Kiểm tra ngưỡng thời gian [${scenarioName}] ---`);
  console.log(`  ngưỡng mỗi đề : ${limits.perScrambleLimitSec.toFixed(2)}s`);
  console.log(`  ngưỡng tổng    : ${limits.totalLimitSec.toFixed(2)}s`);
  console.log(`  giải đúng      : ${totals.solvedCount}/${totals.count}`);
  console.log(
    `  chậm nhất      : ${slowest ? `${slowest.seconds.toFixed(2)}s` : "-"}` +
      (slowest ? ` · ${slowest.scramble}` : "")
  );
  console.log(`  tổng           : ${totals.totalSeconds.toFixed(2)}s`);
  const retrySeconds = totals.wallClockSeconds - totals.totalSeconds;
  console.log(
    `  wall-clock     : ${totals.wallClockSeconds.toFixed(2)}s` +
      (retrySeconds > 0.005
        ? ` (gồm ${retrySeconds.toFixed(2)}s chạy lại)`
        : "")
  );

  for (const item of report.noisy) {
    console.log(
      `  (bỏ qua nhiễu)  ${item.scramble}: lần đầu ${item.firstSeconds.toFixed(2)}s, chạy lại ${item.retrySeconds.toFixed(2)}s`
    );
  }

  if (report.ok) {
    console.log(
      `\nKẾT LUẬN [${scenarioName}]: PASS — ${totals.solvedCount}/${totals.count} đề giải đúng, ` +
        `chậm nhất ${slowest ? slowest.seconds.toFixed(2) : "0.00"}s, ` +
        `tổng ${totals.totalSeconds.toFixed(2)}s, ` +
        `wall-clock ${totals.wallClockSeconds.toFixed(2)}s ` +
        `(ngưỡng ${limits.perScrambleLimitSec.toFixed(2)}s/đề, ${limits.totalLimitSec.toFixed(2)}s tổng).`
    );
    return;
  }

  console.log(`\nKẾT LUẬN [${scenarioName}]: FAIL — ${report.failures.length} vi phạm:`);
  for (const failure of report.failures) {
    console.log(`  - ${failure.message}`);
  }
}

/**
 * Chạy một kịch bản: giải các đề, chạy lại đề quá ngưỡng rồi chấm điểm.
 */
async function runScenario(runtime, scenario, limits, groups, check) {
  const options = { ...SOLVE_OPTIONS, opening: scenario.opening };
  const results = [];
  for (const [group, list] of Object.entries(groups)) {
    for (const scramble of list) {
      const row = await solveScramble(runtime, scramble, options);
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
    `\n[${scenario.name}] ${solved}/${results.length} đúng · chậm nhất ${slowest.seconds.toFixed(2)}s (${slowest.scramble})`
  );

  if (!check) {
    return { name: scenario.name, report: null, results, retries: [] };
  }

  // Chế độ kiểm tra: đề vượt ngưỡng thời gian được chạy lại đúng một lần để
  // loại nhiễu đo. Đề giải sai không bao giờ được chạy lại.
  const retries = [];
  const slowResults = results.filter(
    row => row.solved && row.seconds > limits.perScrambleLimitSec
  );
  for (const row of slowResults) {
    console.log(
      `\n→ [${scenario.name}] chạy lại đề quá ngưỡng ${limits.perScrambleLimitSec}s: ${row.scramble}`
    );
    const retry = await solveScramble(runtime, row.scramble, options);
    retries.push({ scramble: row.scramble, ...retry });
    printRow({ ...retry, scramble: row.scramble });
  }

  const report = evaluateRun({ results, retries, limits });
  printReport(report, scenario.name);
  return { name: scenario.name, report, results, retries };
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

  const runtimeInfo = runtimeMetadata();
  console.log(
    `[bench] pyodide ${runtimeInfo.pyodideVersion} · node ${runtimeInfo.nodeVersion} · ` +
      `${runtimeInfo.platform}/${runtimeInfo.arch}`
  );

  const runtime = await createRuntime();
  const limits = resolveLimits(process.env);
  const groups = smoke
    ? { random: [scrambles.random[0]] }
    : { specified: scrambles.specified, random: scrambles.random };
  // `--smoke` vẫn chạy **cả hai** kịch bản nhưng mỗi kịch bản chỉ một đề,
  // để bài kiểm tra tích hợp thấy được cả hai đường đi mà vẫn nhanh.
  const scenarios = SCENARIOS;

  const runs = [];
  for (const scenario of scenarios) {
    console.log(`\n=== Kịch bản ${scenario.name} (opening=${scenario.opening}) ===`);
    runs.push(
      await runScenario(runtime, scenario, limits[scenario.name], groups, check)
    );
  }

  if (!check) {
    if (args.includes("--json")) {
      console.log(JSON.stringify(runs[0].results, null, 2));
    }
    // `--smoke` dùng cho kiểm thử: phải giải đúng thì mới exit 0.
    const solved = runs[0].results.filter(row => row.solved).length;
    if (smoke && solved !== runs[0].results.length) process.exitCode = 1;
    return;
  }

  // Bất kỳ kịch bản nào vi phạm thì cả lần chạy đều fail.
  const failures = runs.flatMap(run =>
    run.report.failures.map(failure => ({ scenario: run.name, ...failure }))
  );
  const exitCode = failures.length === 0 ? 0 : 1;

  // Artifact giữ nguyên các trường cấp cao nhất của kịch bản `cross` (như
  // trước) để số liệu cũ vẫn đọc được, rồi thêm `scenarios` cho đủ hai.
  const [cross, ...others] = runs;
  const artifact = {
    ...runtimeInfo,
    ok: exitCode === 0,
    exitCode,
    ...cross.report,
    results: cross.results,
    retries: cross.retries,
    failures,
    scenarios: runs.map(run => ({
      name: run.name,
      ...run.report,
      results: run.results,
      retries: run.retries,
    })),
  };
  void others;

  if (jsonFile) {
    writeFileSync(jsonFile, JSON.stringify(artifact, null, 2), "utf8");
    console.log(`\n[bench] đã ghi JSON: ${jsonFile}`);
  } else if (args.includes("--json")) {
    console.log(JSON.stringify(artifact, null, 2));
  }

  process.exitCode = exitCode;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
