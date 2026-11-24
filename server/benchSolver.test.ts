import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { evaluateRun, resolveLimits } from "../scripts/bench-check.mjs";

const root = path.resolve(import.meta.dirname, "..");
const benchScript = path.join(root, "scripts", "bench-solver.mjs");
const scrambleFile = path.join(root, "scripts", "bench-scrambles.json");

type Scrambles = { specified: string[]; random: string[] };

type BenchRow = {
  group?: string;
  scramble: string;
  moves: string[];
  seconds: number;
  solved: boolean;
};

const LIMITS = { perScrambleLimitSec: 20, totalLimitSec: 80 };

function row(overrides: Partial<BenchRow> & { scramble: string }): BenchRow {
  return {
    group: "specified",
    moves: ["R", "U"],
    seconds: 1,
    solved: true,
    ...overrides,
  };
}

describe("B1: bộ đo bộ giải", () => {
  it("có bộ đo và bộ đề cố định", () => {
    expect(existsSync(benchScript)).toBe(true);
    expect(existsSync(scrambleFile)).toBe(true);
  });

  it("bộ đề gồm 3 đề được chỉ định và 8 đề ngẫu nhiên có seed cố định", () => {
    const scrambles = JSON.parse(
      readFileSync(scrambleFile, "utf8")
    ) as Scrambles;
    expect(scrambles.specified).toHaveLength(3);
    expect(scrambles.random).toHaveLength(8);
    for (const scramble of [...scrambles.specified, ...scrambles.random]) {
      expect(scramble.trim().length).toBeGreaterThan(0);
    }
    expect(scrambles.random[0]).toBe(
      "F' R' B' D' B2 F L2 R2 L' D' R2 B' D' B R' B2 L R F' U F2 U"
    );
  });

  it("bộ đo dùng cùng tham số giải với worker trong trình duyệt", () => {
    const nodeBench = readFileSync(benchScript, "utf8");
    for (const [key, value] of Object.entries({
      lastLayer: '"auto"',
      crossColor: '"U"',
      opening: '"cross"',
      openingDepth: "8",
      directNodeBudget: "5000",
      timeBudgetSec: "40",
      nodeBudget: "400000",
    })) {
      expect(nodeBench, key).toContain(`${key}: ${value}`);
    }
  });

  it("bộ đo nạp chính module WebAssembly mà trình duyệt dùng", () => {
    const nodeBench = readFileSync(benchScript, "utf8");
    expect(nodeBench).toContain("solver-wasm");
    expect(nodeBench).toContain("solver_wasm_bg.wasm");
    expect(nodeBench).toContain("initSync");
  });

  it("chế độ --smoke giải đúng một đề (kiểm chứng bộ đo chạy được)", () => {
    const output = execFileSync("node", [benchScript, "--smoke"], {
      cwd: root,
      encoding: "utf8",
      timeout: 180_000,
      stdio: ["ignore", "pipe", "pipe"],
    });
    expect(output).toMatch(/1\/1 đúng/);
  }, 200_000);
});

describe("B2/B5: chế độ kiểm tra ngưỡng thời gian", () => {
  it("ngưỡng mặc định là 20s mỗi đề và 80s tổng, ghi đè được bằng biến môi trường", () => {
    expect(resolveLimits({}).cross).toEqual({
      perScrambleLimitSec: 20,
      totalLimitSec: 80,
    });
    expect(
      resolveLimits({
        PER_SCRAMBLE_LIMIT_SEC: "12.5",
        TOTAL_LIMIT_SEC: "40",
      }).cross
    ).toEqual({ perScrambleLimitSec: 12.5, totalLimitSec: 40 });
  });

  it("kịch bản auto có ngưỡng riêng, lớn hơn kịch bản cross", () => {
    const limits = resolveLimits({});
    expect(limits.auto.perScrambleLimitSec).toBeGreaterThan(
      limits.cross.perScrambleLimitSec
    );
    expect(limits.auto.totalLimitSec).toBeGreaterThan(limits.cross.totalLimitSec);
    expect(limits.auto).toEqual({
      perScrambleLimitSec: 60,
      totalLimitSec: 200,
    });
  });

  it("ngưỡng của kịch bản auto ghi đè được bằng biến môi trường", () => {
    expect(
      resolveLimits({
        AUTO_PER_SCRAMBLE_LIMIT_SEC: "90",
        AUTO_TOTAL_LIMIT_SEC: "300",
      }).auto
    ).toEqual({ perScrambleLimitSec: 90, totalLimitSec: 300 });
  });

  it("biến môi trường sai bị từ chối thay vì lặng lẽ tắt ngưỡng", () => {
    expect(() => resolveLimits({ PER_SCRAMBLE_LIMIT_SEC: "abc" })).toThrow();
    expect(() => resolveLimits({ TOTAL_LIMIT_SEC: "0" })).toThrow();
    expect(() => resolveLimits({ TOTAL_LIMIT_SEC: "-5" })).toThrow();
    expect(() => resolveLimits({ AUTO_PER_SCRAMBLE_LIMIT_SEC: "abc" })).toThrow();
    expect(() => resolveLimits({ AUTO_TOTAL_LIMIT_SEC: "0" })).toThrow();
  });

  it("mọi đề đúng và nhanh thì thoát 0", () => {
    const report = evaluateRun({
      results: [
        row({ scramble: "A", seconds: 1 }),
        row({ scramble: "B", seconds: 2 }),
        row({ scramble: "C", seconds: 0.5 }),
      ],
      retries: [],
      limits: LIMITS,
    });
    expect(report.ok).toBe(true);
    expect(report.exitCode).toBe(0);
    expect(report.failures).toEqual([]);
    expect(report.totals.solvedCount).toBe(3);
  });

  it("wallClockSeconds cộng thời gian chạy lại và không đổi kết luận", () => {
    const report = evaluateRun({
      results: [row({ scramble: "A", seconds: 25 })],
      retries: [row({ scramble: "A", seconds: 21 })],
      limits: { perScrambleLimitSec: 30, totalLimitSec: 80 },
    });
    expect(report.ok).toBe(true);
    expect(report.totals.totalSeconds).toBe(25);
    expect(report.totals.wallClockSeconds).toBe(46);
  });

  it("một đề giải sai thì thoát khác 0", () => {
    const report = evaluateRun({
      results: [
        row({ scramble: "A", seconds: 1 }),
        row({ scramble: "B", seconds: 1, solved: false }),
      ],
      retries: [],
      limits: LIMITS,
    });
    expect(report.ok).toBe(false);
    expect(report.exitCode).not.toBe(0);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].kind).toBe("wrong");
    expect(report.failures[0].scramble).toBe("B");
  });

  it("đề giải sai thì không được thử lại, kể cả khi nó cũng chậm", () => {
    const report = evaluateRun({
      results: [
        row({ scramble: "A", seconds: 1, solved: false }),
      ],
      retries: [row({ scramble: "A", seconds: 99 })],
      limits: { perScrambleLimitSec: 0.5, totalLimitSec: 80 },
    });
    expect(report.exitCode).not.toBe(0);
    expect(report.failures.map(item => item.kind)).toEqual(["wrong"]);
  });

  it("đề chậm vượt ngưỡng, chạy lại vẫn chậm thì thoát khác 0", () => {
    const report = evaluateRun({
      results: [row({ scramble: "A", seconds: 30 })],
      retries: [row({ scramble: "A", seconds: 28 })],
      limits: LIMITS,
    });
    expect(report.ok).toBe(false);
    expect(report.exitCode).not.toBe(0);
    expect(report.failures).toHaveLength(1);
    expect(report.failures[0].kind).toBe("slow");
    expect(report.failures[0].scramble).toBe("A");
    expect(report.noisy).toEqual([]);
  });

  it("đề chậm nhưng chạy lại nhanh thì thoát 0 (đo nhiễu)", () => {
    const report = evaluateRun({
      results: [row({ scramble: "A", seconds: 30 })],
      retries: [row({ scramble: "A", seconds: 3 })],
      limits: LIMITS,
    });
    expect(report.ok).toBe(true);
    expect(report.exitCode).toBe(0);
    expect(report.failures).toEqual([]);
    expect(report.noisy).toHaveLength(1);
    expect(report.noisy[0].scramble).toBe("A");
  });

  it("tổng thời gian vượt ngưỡng thì thoát khác 0", () => {
    const report = evaluateRun({
      results: [
        row({ scramble: "A", seconds: 17 }),
        row({ scramble: "B", seconds: 17 }),
        row({ scramble: "C", seconds: 17 }),
        row({ scramble: "D", seconds: 17 }),
        row({ scramble: "E", seconds: 17 }),
      ],
      retries: [],
      limits: LIMITS,
    });
    expect(report.ok).toBe(false);
    expect(report.exitCode).not.toBe(0);
    expect(report.failures.map(item => item.kind)).toEqual(["total"]);
    expect(report.totals.totalSeconds).toBe(85);
  });
});

describe("B1: chế độ --check chạy thật", () => {
  it("mọi đề đúng và nhanh thì bộ đo thoát 0 và ghi được file JSON", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "cfop-bench-"));
    const jsonFile = path.join(dir, "bench.json");
    const run = spawnSync(
      "node",
      [benchScript, "--smoke", "--check", "--json-file", jsonFile],
      { cwd: root, encoding: "utf8", timeout: 180_000 }
    );
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("KẾT LUẬN [cross]: PASS");
    expect(run.stdout).toContain("KẾT LUẬN [auto]: PASS");

    const report = JSON.parse(readFileSync(jsonFile, "utf8"));
    expect(report.ok).toBe(true);
    expect(report.exitCode).toBe(0);
    const wasmFile = path.join(
      root, "packages", "solver", "solver-wasm", "pkg", "solver_wasm_bg.wasm"
    );
    expect(report.engine).toBe("wasm");
    expect(report.wasmBytes).toBe(readFileSync(wasmFile).length);
    expect(report.nodeVersion).toBe(process.version);
    expect(report.platform).toBe(process.platform);
    expect(report.arch).toBe(process.arch);
    expect(report.limits).toEqual({
      perScrambleLimitSec: 20,
      totalLimitSec: 80,
    });
    expect(report.results).toHaveLength(1);
    expect(report.results[0].solved).toBe(true);
    expect(report.totals.wallClockSeconds).toBe(report.totals.totalSeconds);

    expect(report.scenarios.map((s: { name: string }) => s.name)).toEqual([
      "cross",
      "auto",
    ]);
    const auto = report.scenarios.find(
      (s: { name: string }) => s.name === "auto"
    );
    expect(auto.limits).toEqual({
      perScrambleLimitSec: 60,
      totalLimitSec: 200,
    });
    expect(auto.results).toHaveLength(1);
    expect(auto.results[0].solved).toBe(true);
  }, 200_000);

  it("tổng thời gian vượt ngưỡng thì bộ đo thoát khác 0 và nêu rõ lý do", () => {
    const run = spawnSync("node", [benchScript, "--smoke", "--check"], {
      cwd: root,
      encoding: "utf8",
      timeout: 180_000,
      env: { ...process.env, TOTAL_LIMIT_SEC: "0.001" },
    });
    expect(run.status).not.toBe(0);
    expect(run.stdout).toContain("KẾT LUẬN [cross]: FAIL");
    expect(run.stdout).toContain("tổng thời gian vượt ngưỡng");
  }, 200_000);

  it("ngưỡng riêng của kịch bản auto cũng làm bộ đo đỏ", () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "cfop-bench-"));
    const jsonFile = path.join(dir, "bench.json");
    const run = spawnSync(
      "node",
      [benchScript, "--smoke", "--check", "--json-file", jsonFile],
      {
        cwd: root,
        encoding: "utf8",
        timeout: 180_000,
        env: { ...process.env, AUTO_TOTAL_LIMIT_SEC: "0.001" },
      }
    );
    expect(run.status).not.toBe(0);
    expect(run.stdout).toContain("KẾT LUẬN [auto]: FAIL");
    expect(run.stdout).toContain("KẾT LUẬN [cross]: PASS");

    const report = JSON.parse(readFileSync(jsonFile, "utf8"));
    expect(report.ok).toBe(false);
    expect(report.exitCode).toBe(1);
    const scenarios = Object.fromEntries(
      report.scenarios.map((s: { name: string; ok: boolean }) => [s.name, s])
    ) as Record<string, { ok: boolean }>;
    expect(scenarios.cross.ok).toBe(true);
    expect(scenarios.auto.ok).toBe(false);
    expect(
      report.failures.some(
        (f: { scenario?: string }) => f.scenario === "auto"
      )
    ).toBe(true);
  }, 200_000);
});
