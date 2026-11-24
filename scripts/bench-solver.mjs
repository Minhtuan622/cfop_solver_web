import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { evaluateRun, resolveLimits } from "./bench-check.mjs";

const root = path.resolve(import.meta.dirname, "..");
const pkgDir = path.join(root, "packages", "solver", "solver-wasm", "pkg");
const scrambles = JSON.parse(
  readFileSync(path.join(root, "scripts", "bench-scrambles.json"), "utf8")
);

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

function runtimeMetadata() {
  return {
    engine: "wasm",
    wasmBytes: readFileSync(path.join(pkgDir, "solver_wasm_bg.wasm")).length,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

const SOLVE_OPTIONS = {
  lastLayer: "auto",
  crossColor: "U",
  opening: "cross",
  openingDepth: 8,
  directNodeBudget: 5000,
  timeBudgetSec: 40,
  nodeBudget: 400000,
};

const SCENARIOS = [
  { name: "cross", opening: "cross" },
  { name: "auto", opening: "auto" },
];

async function createRuntime() {
  const wasm = await import(path.join(pkgDir, "solver_wasm.js"));
  wasm.initSync({ module: readFileSync(path.join(pkgDir, "solver_wasm_bg.wasm")) });
  return wasm;
}

async function solveScramble(wasm, scramble, options) {
  const started = performance.now();
  const result = wasm.solve(wasm.scrambleToStickers(scramble), options);
  const seconds = (performance.now() - started) / 1000;
  const moves = result.phases.flatMap(phase => phase.moves);
  const check = wasm.scrambleToStickers(`${scramble} ${moves.join(" ")}`);
  return { moves, seconds, solved: check === SOLVED };
}

function printRow(row) {
  const status = row.solved ? "OK  " : "SAI ";
  console.log(
    `${status} ${row.seconds.toFixed(2).padStart(6)}s  ${String(row.moves.length).padStart(3)} nước  ${row.scramble}`
  );
}

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
  const smoke = args.includes("--smoke");
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
    const solved = runs[0].results.filter(row => row.solved).length;
    if (smoke && solved !== runs[0].results.length) process.exitCode = 1;
    return;
  }

  const failures = runs.flatMap(run =>
    run.report.failures.map(failure => ({ scenario: run.name, ...failure }))
  );
  const exitCode = failures.length === 0 ? 0 : 1;

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
