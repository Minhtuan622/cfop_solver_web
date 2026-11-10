import { afterEach, describe, expect, it, vi } from "vitest";
import { createPyodideLoader } from "@/lib/pyodideLoader";

describe("pyodideLoader: load failure then retry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries after a load failure and succeeds", async () => {
    let attempts = 0;
    const failingThenSucceeding = async () => {
      attempts += 1;
      console.log("attempt:", attempts);
      if (attempts === 1) throw new Error("network down");
      return {
        FS: { mkdirTree: vi.fn(), writeFile: vi.fn() },
        runPythonAsync: vi.fn().resolvedTo(undefined),
      } as any;
    };

    const { getPyodide, resetCache } = createPyodideLoader(failingThenSucceeding);
    resetCache();
    console.log("call 1:");
    try {
      await getPyodide();
      console.log("call 1: RESOLVED (unexpected)");
    } catch (e) {
      console.log("call 1: REJECTED:", (e as Error).message);
    }
    console.log("attempts after call 1:", attempts);
    console.log("call 2:");
    try {
      await getPyodide();
      console.log("call 2: RESOLVED");
    } catch (e) {
      console.log("call 2: REJECTED:", (e as Error).message);
    }
    console.log("attempts after call 2:", attempts);
    expect(attempts).toBe(2);
  });
});
