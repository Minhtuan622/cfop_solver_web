import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("production build configuration", () => {
  it("uses the tracked solver bundle rather than a Python source path outside the repository", () => {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { scripts: Record<string, string> };
    const embeddedSolver = readFileSync(new URL("../client/src/lib/embeddedSolver.ts", import.meta.url), "utf8");

    expect(packageJson.scripts.build).not.toContain("embed-solver");
    expect(embeddedSolver).toContain("PYTHON_SOLVER_FILES");
    expect(embeddedSolver).toContain('"solver.py"');
  });
});
