import { execFile } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url).pathname;

/**
 * A local database install used to write NODE_ENV and PORT into .env.local,
 * and the server used to read that file with override turned on, so
 * `PORT=3200 pnpm start` still listened on 3000. These tests keep the
 * precedence rule: what the command line sets wins.
 */
describe("the environment a server process reads", () => {
  it("reads .env.local without overriding the host environment", () => {
    const source = readFileSync(new URL("../server/_core/index.ts", import.meta.url), "utf8");
    expect(source).toContain('dotenv.config({ path: ".env.local" })');
    expect(source).not.toContain("override: true");
  });

  it("writes no NODE_ENV or PORT into .env.local from the local database setup", () => {
    const source = readFileSync(new URL("../scripts/setup-local-db.mjs", import.meta.url), "utf8");
    expect(source).not.toContain('additions.push("NODE_ENV=');
    expect(source).not.toContain('additions.push("PORT=');
    expect(source).toContain("DATABASE_URL=");
  });
});

describe("the container image", () => {
  const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  const dockerignore = readFileSync(new URL("../.dockerignore", import.meta.url), "utf8");

  it("builds in one stage and runs in another", () => {
    const stages = dockerfile.match(/^FROM\s+\S+/gm);
    expect(stages).toHaveLength(2);
    expect(dockerfile).toContain("AS build");
  });

  it("installs production dependencies only in the runtime stage", () => {
    expect(dockerfile).toContain("--prod");
    expect(dockerfile).toContain("--frozen-lockfile");
  });

  it("runs as an unprivileged user", () => {
    expect(dockerfile).toMatch(/^USER node$/m);
  });

  it("watches its own process health at /_app/health", () => {
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).toContain("_app/health");
  });

  it("carries git history and machine state", () => {
    expect(dockerignore).toMatch(/^node_modules$/m);
    expect(dockerignore).toMatch(/^\.git$/m);
    expect(dockerignore).toMatch(/^dist$/m);
    expect(dockerignore).toMatch(/\.env/);
    // The template of the environment stays, as documentation.
    expect(dockerignore).toContain("!.env.example");
  });

  it("mounts no secret file into the built image", () => {
    expect(dockerfile).not.toContain(".env.local");
    expect(dockerfile).not.toContain("COPY ./.env");
  });
});

const distReady = existsSync(path.join(root, "dist", "public", "index.html"));

/**
 * The full proof of precedence: with .env.local present, a production server
 * must still follow the PORT the command line gave it.
 */
describe.skipIf(!distReady)("the spawned production server", () => {
  let log = "";
  let child: ReturnType<typeof execFile> | null = null;
  let timer: NodeJS.Timeout | undefined;
  let settled = false;

  beforeAll(async () => {
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        error ? reject(error) : resolve();
      };
      child = execFile(
        process.execPath,
        [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "server/_core/index.ts"],
        { cwd: root, env: { ...process.env, NODE_ENV: "production", PORT: "3200" } },
        (error) => {
          // A deliberate kill prints a nonzero code; only failures before
          // the server started matter.
          if (log.includes("Server running on"))
            finish(log.includes("http://localhost:3200/") ? undefined : new Error(`server took a different port: ${log}`));
          else if (error) finish(error);
        },
      );
      child.stdout?.on("data", (chunk: Buffer | string) => { log += String(chunk); });
      child.stderr?.on("data", (chunk: Buffer | string) => { log += String(chunk); });
      const started = Date.now();
      timer = setInterval(() => {
        if (log.includes("Server running on http://localhost:3200/")) {
          clearInterval(timer);
          return finish();
        }
        if (Date.now() - started > 20_000) {
          clearInterval(timer);
          return finish(new Error(`server did not start: ${log}`));
        }
      }, 250);
    });
  });

  afterAll(() => {
    clearInterval(timer);
    child?.kill("SIGTERM");
  });

  it("listened on the port the command line chose", () => {
    expect(log).toContain("Server running on http://localhost:3200/");
  });

  it("kept the environment set on the command line over .env.local", () => {
    // The local .env.local may carry its own PORT=3000 from an older setup
    // script; the server logged 3200, which is the rule being tested.
    expect(log).not.toContain("Server running on http://localhost:3000/");
  });

  it("answers the plain health route", async () => {
    const response = await fetch("http://127.0.0.1:3200/_app/health");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
