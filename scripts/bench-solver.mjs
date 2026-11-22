/**
 * Bộ đo bộ giải CFOP — chạy chính bản WebAssembly mà trình duyệt dùng
 * (`packages/solver`, build bằng `pnpm build:solver`), trong Node, không cần
 * trình duyệt.
 *
 * Bộ đo giải bộ đề cố định (`scripts/bench-scrambles.json`) và in ra bảng:
 * đề, đúng/sai, số nước, thời gian. Lần giải đầu tiên gồm cả thời gian dựng
 * bảng tra (một lần mỗi worker), giống lần bấm giải đầu tiên trong trình
 * duyệt.
 *
 * Có **hai kịch bản**, mỗi kịch bản một bộ ngưỡng riêng:
 * - `cross` — `opening: "cross"`, tức kịch bản mặc định của app;
 * - `auto`  — `opening: "auto"`, bộ giải thử bậc cross cao nhất trước.
 *
 *   node scripts/bench-solver.mjs
 *   node scripts/bench-solver.mjs --json      # xuất JSON để so sánh tự động
 *   node scripts/bench-solver.mjs --check     # chế độ kiểm tra ngưỡng thời gian
 *
 * Chế độ `--check` thoát với mã khác 0 khi: có đề giải sai, có đề chậm hơn
 * ngưỡng của kịch bản đó (đề vượt ngưỡng được chạy lại một lần để loại
 * nhiễu), hoặc tổng thời gian vượt ngưỡng tổng. Ngưỡng mặc định xem ở
 * `scripts/bench-check.mjs`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluateRun, resolveLimits } from "./bench-check.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pkgDir = path.join(root, "packages", "solver", "solver-wasm", "pkg");
const scrambles = JSON.parse(
  readFileSync(path.join(root, "scripts", "bench-scrambles.json"), "utf8")
);

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

/** Metadata của runtime đo được. */
function runtimeMetadata() {
  return {
    engine: "wasm",
    wasmBytes: readFileSync(path.join(pkgDir, "solver_wasm_bg.wasm")).length,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

/** Tham số giải giống hệt đường gọi của worker trong trình duyệt. */
const SOLVE_OPTIONS = {
  lastLayer: "auto",
  crossColor: "U",
  opening: "cross",
  openingDepth: 8,
  directNodeBudget: 5000,
  // Cùng ngân sách với đường gọi của worker trong trình duyệt.
  timeBudgetSec: 40,
  nodeBudget: 400000,
};

/**
 * Kịch bản được đo.
 *
 * - `cross`: kịch bản mặc định của app (`opening: "cross"`).
 * - `auto`: `opening: "auto"` — bộ giải thử bậc cross cao nhất trước nên
 *   đắt hơn. Đây là lựa chọn có sẵn trong phần cài đặt của app, nên phải có
 *   ngân sách thời gian riêng.
 */
const SCENARIOS = [
  { name: "cross", opening: "cross" },
  { name: "auto", opening: "auto" },
];

/** Nạp module WebAssembly của bộ giải. */
async function createRuntime() {
  const wasm = await import(path.join(pkgDir, "solver_wasm.js"));
  wasm.initSync({ module: readFileSync(path.join(pkgDir, "solver_wasm_bg.wasm")) });
  return wasm;
}

/** Giải một đề và trả về { moves, seconds, solved }. */
async function solveScramble(wasm, scramble, options) {
  const started = performance.now();
  const result = wasm.solve(wasm.scrambleToStickers(scramble), options);
  const seconds = (performance.now() - started) / 1000;
  const moves = result.phases.flatMap(phase => phase.moves);
  // Kiểm tra lại: scramble rồi lời giải phải về trạng thái đã giải.
  const check = wasm.scrambleToStickers(`${scramble} ${moves.join(" ")}`);
  return { moves, seconds, solved: check === SOLVED };
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
    `[bench] wasm ${(runtimeInfo.wasmBytes / 1024).toFixed(0)} KiB · node ${runtimeInfo.nodeVersion} · ` +
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
  // `ok`/`exitCode` ở cấp cao nhất là **kết quả tổng hợp**: bất kỳ kịch bản
  // nào vi phạm thì nó là false/1 — các trường đó phải đặt **sau** spread của
  // kịch bản cross để không bị ghi đè.
  const [cross, ...others] = runs;
  const artifact = {
    ...runtimeInfo,
    ...cross.report,
    ok: exitCode === 0,
    exitCode,
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
