import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type RailwayConfig = {
  build: { builder: string; dockerfilePath?: string; buildCommand?: string; watchPatterns: string[] };
  deploy: { startCommand: string; healthcheckPath?: string; restartPolicyType: string; restartPolicyMaxRetries: number; preDeployCommand?: unknown };
};

describe("Railway deployment configuration", () => {
  it("builds with the multi-stage Dockerfile and starts the bundled server, without automatic database migration", () => {
    const config = JSON.parse(readFileSync(new URL("../railway.json", import.meta.url), "utf8")) as RailwayConfig;

    // The solver is Rust compiled to WebAssembly: only the Dockerfile has
    // the Rust stage, so Railway must not fall back to a Node-only builder.
    expect(config.build).toMatchObject({ builder: "DOCKERFILE", dockerfilePath: "Dockerfile" });
    expect(config.build.buildCommand).toBeUndefined();
    expect(config.build.watchPatterns).toContain("packages/solver/**");
    // The runtime image holds dist/ and production dependencies only
    // (no scripts/), so the start command runs the bundle directly, like
    // the Dockerfile CMD.
    expect(config.deploy).toMatchObject({ startCommand: "node dist/index.js", restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 3 });
    expect(config.deploy.preDeployCommand).toBeUndefined();
    const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
  });

  it("restarts the deploy on the readiness probe that checks the database", () => {
    const config = JSON.parse(readFileSync(new URL("../railway.json", import.meta.url), "utf8")) as RailwayConfig;

    // /_app/health says the process lives; only /_app/ready also says the
    // database answers, which is what a rollout must not skip.
    expect(config.deploy.healthcheckPath).toBe("/_app/ready");
    expect(config.deploy.healthcheckPath).not.toBe("/_app/health");
  });
});
