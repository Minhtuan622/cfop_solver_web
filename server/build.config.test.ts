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
    const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { scripts: Record<string, string> };
    const build = buildScript();

    expect(packageJson.scripts["build:solver"]).toBe("node scripts/build-solver.mjs");
    expect(build.indexOf("scripts/ensure-solver.mjs")).toBeGreaterThanOrEqual(0);
    expect(build.indexOf("scripts/ensure-solver.mjs")).toBeLessThan(build.indexOf("tsc --noEmit"));
    expect(packageJson.scripts.dev).toContain("scripts/ensure-solver.mjs");
  });

  it("type-checks before bundling so a TypeScript error cannot reach production", () => {
    const build = buildScript();

    expect(build).toContain("tsc --noEmit");
    expect(build.indexOf("tsc --noEmit")).toBeLessThan(
      build.indexOf("vite.js build")
    );
    expect(build.indexOf("tsc --noEmit")).toBeLessThan(
      build.indexOf("esbuild server/_core/index.ts")
    );
  });

  it("keeps the other mandatory build steps", () => {
    const build = buildScript();

    expect(build).toContain("vite.js build");
    expect(build).toContain("esbuild server/_core/index.ts");
    expect(build).toContain("scripts/verify-solver-dist.mjs");
    expect(build.indexOf("scripts/verify-solver-dist.mjs")).toBeGreaterThan(
      build.indexOf("vite.js build")
    );
  });
});
