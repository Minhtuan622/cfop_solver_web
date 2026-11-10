import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelSolverInBrowser,
  solveInBrowser,
  validateStateInBrowser,
  SolverCancelledError,
  SolverTimeoutError,
  VALIDATE_TIMEOUT_MS,
} from "@/lib/solverRuntime";

/* ------------------------------------------------------------------ */
/* Mock the two Web Workers so the real solverRuntime logic runs, but   */
/* each worker instance is controllable from the test.                  */
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
      workerInstance.lastMessage = msg;
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
const lightWorker = makeMockWorker();
let workerInstance: MockWorker | null = null;

// Replace the global Worker with a mock that returns our controllable
// instances based on the script URL.
const MockWorkerClass = class {
  constructor(url: string | URL) {
    const u = String(url);
    if (u.includes("solverWorker.ts")) {
      Object.assign(this, heavyWorker);
      workerInstance = this;
    } else if (u.includes("solverLiteWorker.ts")) {
      Object.assign(this, lightWorker);
      workerInstance = this;
    } else {
      throw new Error("Unexpected worker URL: " + u);
    }
  }
};

beforeEach(() => {
  heavyWorker.postMessage.mockClear();
  heavyWorker.terminate.mockClear();
  lightWorker.postMessage.mockClear();
  lightWorker.terminate.mockClear();
  heavyWorker.onmessage = null;
  lightWorker.onmessage = null;
  heavyWorker._terminated = false;
  lightWorker._terminated = false;
  heavyWorker.lastMessage = null;
  lightWorker.lastMessage = null;
  workerInstance = null;
  (globalThis as any).Worker = MockWorkerClass;
});

afterEach(() => {
  (globalThis as any).Worker = undefined;
  vi.unstubAllGlobals();
});

describe("solverRuntime: separate heavy/light workers", () => {
  it("cancelling a solve does not affect validate", async () => {
    const solvePromise = solveInBrowser("scramble", "R U R' U'");
    expect(heavyWorker.postMessage).toHaveBeenCalled();
    expect(lightWorker.postMessage).not.toHaveBeenCalled();

    cancelSolverInBrowser();
    await expect(solvePromise).rejects.toBeInstanceOf(SolverCancelledError);
    expect(heavyWorker.terminate).toHaveBeenCalledTimes(1);

    const validatePromise = validateStateInBrowser(
      "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
    );
    expect(lightWorker.postMessage).toHaveBeenCalled();

    const validateMsg = lightWorker.postMessage.mock.calls[0][0];
    workerInstance.onmessage!(
      {
        data: {
          id: validateMsg.id,
          ok: true,
          output: JSON.stringify({ valid: true, message: "Trạng thái hợp lệ." }),
        },
      } as unknown as MessageEvent,
    );
    await expect(validatePromise).resolves.toEqual({
      valid: true,
      message: "Trạng thái hợp lệ.",
    });
  });

  it("validate timeout cancels only the validate task, not a running solve", async () => {
    vi.useFakeTimers();
    const solvePromise = solveInBrowser("scramble", "R U R' U'");
    const solveMsg = heavyWorker.postMessage.mock.calls[0][0];
    const solveId = solveMsg.id;

    const validatePromise = validateStateInBrowser(
      "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB",
    );
    const validateMsg = lightWorker.postMessage.mock.calls[0][0];
    const validateId = validateMsg.id;

    vi.advanceTimersByTime(VALIDATE_TIMEOUT_MS + 100);

    await expect(validatePromise).rejects.toBeInstanceOf(
      SolverTimeoutError,
    );

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
    vi.useRealTimers();
  });
});
