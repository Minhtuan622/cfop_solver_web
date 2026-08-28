import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

type RailwayConfig = {
  build: { builder: string; buildCommand: string; watchPatterns: string[] };
  deploy: { startCommand: string; restartPolicyType: string; restartPolicyMaxRetries: number; preDeployCommand?: unknown };
};

describe("Railway deployment configuration", () => {
  it("uses the existing Node build/start lifecycle without automatic database migration", () => {
    const config = JSON.parse(readFileSync(new URL("../railway.json", import.meta.url), "utf8")) as RailwayConfig;

    expect(config.build).toMatchObject({ builder: "RAILPACK", buildCommand: "pnpm build" });
    expect(config.deploy).toMatchObject({ startCommand: "pnpm start", restartPolicyType: "ON_FAILURE", restartPolicyMaxRetries: 3 });
    expect(config.deploy.preDeployCommand).toBeUndefined();
  });
});
