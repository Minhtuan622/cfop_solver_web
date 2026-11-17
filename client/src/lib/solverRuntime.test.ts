import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelSolverInBrowser,
  solveInBrowser,
  validateStateInBrowser,
  SolverCancelledError,
} from "@/lib/solverRuntime";
import { SOLVED_FAST_STATE } from "@/lib/fastCube";

/* ------------------------------------------------------------------ */
/* Mock the heavy Web Worker so the real solverRuntime logic runs, but  */
/* the worker instance is controllable from the test.                    */
/* ------------------------------------------------------------------ */
type MockWorker = {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((e: MessageEvent) => void) | null;
  _terminated: boolean;
  lastMessage: any;
};

function makeMockWorker(): MockWorker {
  return {
    postMessage: vi.fn((msg: any) => {
      heavyWorker.lastMessage = msg;
    }),
    terminate: vi.fn(function (this: MockWorker) {
      this._terminated = true;
    }),
    onmessage: null,
    _terminated: false,
    lastMessage: null,
  };
}

const heavyWorker = makeMockWorker();
let workerInstance: MockWorker | null = null;

// Replace the global Worker with a mock that returns the controllable
// instance based on the script URL.
const MockWorkerClass = class {
  constructor(url: string | URL) {
    const u = String(url);
    if (u.includes("solverWorker.ts")) {
      Object.assign(this, heavyWorker);
      workerInstance = this;
    } else {
      throw new Error("Unexpected worker URL: " + u);
    }
  }
};

beforeEach(() => {
  heavyWorker.postMessage.mockClear();
  heavyWorker.terminate.mockClear();
  heavyWorker.onmessage = null;
  heavyWorker._terminated = false;
  heavyWorker.lastMessage = null;
  workerInstance = null;
  (globalThis as any).Worker = MockWorkerClass;
});

afterEach(() => {
  (globalThis as any).Worker = undefined;
  vi.unstubAllGlobals();
});

describe("solverRuntime: heavy worker", () => {
  it("cancelling a solve does not affect validate", async () => {
    const solvePromise = solveInBrowser("scramble", "R U R' U'");
    expect(heavyWorker.postMessage).toHaveBeenCalled();

    cancelSolverInBrowser();
    await expect(solvePromise).rejects.toBeInstanceOf(SolverCancelledError);
    expect(heavyWorker.terminate).toHaveBeenCalledTimes(1);

    // Validate runs in-page and does not go through any worker.
    await expect(validateStateInBrowser(SOLVED_FAST_STATE)).resolves.toEqual({
      valid: true,
      message: "Trạng thái hợp lệ · 54 sticker · 9 mỗi màu",
    });
    expect(heavyWorker.postMessage).toHaveBeenCalledTimes(1);
  });

  it("validate reports invalid states in-page", async () => {
    const swappedEdges = SOLVED_FAST_STATE.split("");
    [swappedEdges[5], swappedEdges[10]] = [swappedEdges[10]!, swappedEdges[5]!];
    const validation = await validateStateInBrowser(swappedEdges.join(""));
    expect(validation.valid).toBe(false);
    expect(validation.message).toMatch(/orientation|cubie|parity/i);
  });

  it("a running solve is not affected by validation errors", async () => {
    const solvePromise = solveInBrowser("scramble", "R U R' U'");
    const solveMsg = heavyWorker.postMessage.mock.calls[0][0];
    const solveId = solveMsg.id;

    const invalid = SOLVED_FAST_STATE.replace("F", "U");
    const validation = await validateStateInBrowser(invalid);
    expect(validation.valid).toBe(false);

    workerInstance.onmessage!(
      {
        data: {
          id: solveId,
          ok: true,
          output: JSON.stringify({
            algorithm: "R U R' U'",
            phases: [],
            trace: [],
            opening: {},
            last_layer: {},
          }),
        },
      } as unknown as MessageEvent,
    );
    await expect(solvePromise).resolves.toHaveProperty(
      "algorithm",
      "R U R' U'",
    );
  });
});
