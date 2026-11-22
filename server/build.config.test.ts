import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function buildScript(): string {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  ) as { scripts: Record<string, string> };
  return packageJson.scripts.build;
}

describe("production build configuration", () => {
  it("builds against the WebAssembly solver package and fails early when it is missing", () => {
    // `pnpm build:solver` (Rust + wasm-pack) produces
    // packages/solver/solver-wasm/pkg; the Docker image builds it in its own
    // stage. `scripts/ensure-solver.mjs` stops the build with a clear message
    // instead of a cryptic "cannot resolve @solver-wasm/..." error.
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { scripts: Record<string, string> };
    const build = buildScript();

    expect(packageJson.scripts["build:solver"]).toBe("node scripts/build-solver.mjs");
    // Trước cả type-check: thiếu package thì tsc cũng không tìm thấy kiểu.
    expect(build.indexOf("scripts/ensure-solver.mjs")).toBeGreaterThanOrEqual(0);
    expect(build.indexOf("scripts/ensure-solver.mjs")).toBeLessThan(build.indexOf("tsc --noEmit"));
    expect(packageJson.scripts.dev).toContain("scripts/ensure-solver.mjs");
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

    expect(build).toContain("vite.js build");
    expect(build).toContain("esbuild server/_core/index.ts");
    // Bản phát hành phải chứa bộ giải: worker và file .wasm trong dist.
    expect(build).toContain("scripts/verify-solver-dist.mjs");
    expect(build.indexOf("scripts/verify-solver-dist.mjs")).toBeGreaterThan(
      build.indexOf("vite.js build")
    );
  });
});
