import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type RailwayConfig = {
  build: { builder: string; dockerfilePath?: string; buildCommand?: string; watchPatterns: string[] };
  deploy: { startCommand: string; healthcheckPath?: string; restartPolicyType: string; restartPolicyMaxRetries: number; preDeployCommand?: unknown };
};

describe("Railway deployment configuration", () => {
  it("builds with the multi-stage Dockerfile and applies database migrations before starting the bundled server", () => {
    const config = JSON.parse(readFileSync(new URL("../railway.json", import.meta.url), "utf8")) as RailwayConfig;

    expect(config.build).toMatchObject({ builder: "DOCKERFILE", dockerfilePath: "Dockerfile" });
    expect(config.build.buildCommand).toBeUndefined();
    expect(config.build.watchPatterns).toContain("packages/solver/**");
    expect(config.deploy).toMatchObject({ startCommand: "node scripts/migrate.mjs && node dist/index.js", restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 3 });
    expect(config.deploy.preDeployCommand).toBeUndefined();
    const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
    expect(dockerfile).toContain("COPY drizzle ./drizzle");
    expect(dockerfile).toContain("COPY scripts/migrate.mjs ./scripts/migrate.mjs");
  });

  it("restarts the deploy on the readiness probe that checks the database", () => {
    const config = JSON.parse(readFileSync(new URL("../railway.json", import.meta.url), "utf8")) as RailwayConfig;

    expect(config.deploy.healthcheckPath).toBe("/_app/ready");
    expect(config.deploy.healthcheckPath).not.toBe("/_app/health");
  });
});
