import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * Regression test cho B1 (bộ đo bộ giải).
 *
 * Bộ đo là công cụ đo hiệu năng: nếu nó hỏng thì mọi quyết định tối ưu sau
 * này đều dựa trên số liệu sai. Test giữ cho:
 * - bộ đề cố định dùng chung giữa bộ đo Pyodide và bộ đo CPython;
 * - hai bộ đo dùng cùng tham số giải, nên số liệu so sánh được;
 * - chế độ --smoke thực sự giải được và giải đúng.
 */

const root = path.resolve(import.meta.dirname, "..");
const benchScript = path.join(root, "scripts", "bench-solver.mjs");
const pythonBench = path.join(root, "solver-python", "bench_solver.py");
const scrambleFile = path.join(root, "scripts", "bench-scrambles.json");

type Scrambles = { specified: string[]; random: string[] };

describe("B1: bộ đo bộ giải", () => {
  it("có cả hai bộ đo và bộ đề cố định dùng chung", () => {
    expect(existsSync(benchScript)).toBe(true);
    expect(existsSync(pythonBench)).toBe(true);
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
    // Các đề ngẫu nhiên phải là bộ cố định (không sinh lại mỗi lần chạy).
    expect(scrambles.random[0]).toBe(
      "F' R' B' D' B2 F L2 R2 L' D' R2 B' D' B R' B2 L R F' U F2 U"
    );
  });

  it("hai bộ đo dùng cùng tham số giải nên số liệu so sánh được", () => {
    const nodeBench = readFileSync(benchScript, "utf8");
    const pyBench = readFileSync(pythonBench, "utf8");

    for (const [key, value] of Object.entries({
      last_layer: '"auto"',
      cross_color: '"U"',
      opening: '"cross"',
      xcross_depth: "8",
      direct_node_budget: "5000",
    })) {
      expect(nodeBench, key).toContain(`${key}: ${value}`);
      expect(pyBench, key).toContain(`"${key}": ${value}`);
    }
  });

  it("bộ đo Pyodide nạp mã solver từ solver-python/cfop_solver", () => {
    const nodeBench = readFileSync(benchScript, "utf8");
    expect(nodeBench).toContain("solver-python");
    expect(nodeBench).toContain("cfop_solver");
    // Cùng thư mục package và cùng cách ghi file như writeSolverFiles.
    expect(nodeBench).toContain("PACKAGE_DIR");
    expect(nodeBench).toContain("runtime.FS.writeFile");
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
