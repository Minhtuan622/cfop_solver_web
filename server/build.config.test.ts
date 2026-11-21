import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function buildScript(): string {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  ) as { scripts: Record<string, string> };
  return packageJson.scripts.build;
}

describe("production build configuration", () => {
  it("uses the tracked solver bundle rather than a Python source path outside the repository", () => {
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { scripts: Record<string, string> };
    const embeddedSolver = readFileSync(new URL("../client/src/lib/embeddedSolver.ts", import.meta.url), "utf8");

    expect(packageJson.scripts.build).not.toContain("embed-solver");
    expect(embeddedSolver).toContain("PYTHON_SOLVER_FILES");
    expect(embeddedSolver).toContain('"solver.py"');
  });

  it("type-checks before bundling so a TypeScript error cannot reach production", () => {
    // Vite và esbuild chỉ transpile, KHÔNG type-check. Nên một lỗi TypeScript
    // vẫn tạo ra bundle chạy được — và lỗi đó lên production qua
    // `Dockerfile` (`RUN pnpm build`, Railway build bằng chính Dockerfile
    // này), đường deploy không có cổng type-check nào khác.
    //
    // Bài này chặn việc gỡ bước type-check khỏi `pnpm build`.
    const build = buildScript();

    expect(build).toContain("tsc --noEmit");
    // Phải chạy TRƯỚC bước đóng gói, không phải sau.
    expect(build.indexOf("tsc --noEmit")).toBeLessThan(
      build.indexOf("vite.js build")
    );
    expect(build.indexOf("tsc --noEmit")).toBeLessThan(
      build.indexOf("esbuild server/_core/index.ts")
    );
  });

  it("keeps the other mandatory build steps", () => {
    // Bỏ sót một bước này là mất luôn một lớp bảo vệ khác.
    const build = buildScript();

    expect(build).toContain("scripts/fetch-pyodide.mjs");
    expect(build).toContain("vite.js build");
    expect(build).toContain("esbuild server/_core/index.ts");
    expect(build).toContain("scripts/verify-pyodide-dist.mjs");
  });
});
