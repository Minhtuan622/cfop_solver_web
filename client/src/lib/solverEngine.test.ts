import { describe, expect, it, vi } from "vitest";
import {
  PyodideSolverEngine,
  SolverCancelledError,
  SolverLimitError,
  WasmSolverEngine,
  resolveSolverEngineName,
  type SolveRequest,
  type SolverEngine,
} from "@/lib/solverEngine";

/** Worker giả: ghi lại message, cho test tự trả lời. */
class FakeWorker {
  messages: any[] = [];
  terminated = false;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage(message: any) {
    this.messages.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: unknown) {
    this.onmessage?.({ data } as MessageEvent);
  }
}

const REQUEST: SolveRequest = {
  kind: "scramble",
  value: "R U R' U'",
  crossColor: "U",
  opening: "xcross",
  lastLayer: "auto",
  openingDepth: 8,
  openingFindResult: false,
  directNodeBudget: 5000,
  preferredSlot: "FR",
  excludedSlots: ["BL"],
};

const RESULT = { initial_state: "x", final_state: "y", algorithm: "R", phases: [], trace: [] };

function engines(): [SolverEngine, FakeWorker[]][] {
  const make = (Engine: typeof PyodideSolverEngine | typeof WasmSolverEngine) => {
    const workers: FakeWorker[] = [];
    const engine = new Engine(() => {
      const w = new FakeWorker();
      workers.push(w);
      return w as unknown as Worker;
    });
    return [engine, workers] as [SolverEngine, FakeWorker[]];
  };
  return [make(PyodideSolverEngine), make(WasmSolverEngine)];
}

describe("SolverEngine adapters (cùng input cho hai engine)", () => {
  it("gửi cùng một message solve và trả cùng kết quả", async () => {
    const seen: any[] = [];
    for (const [engine, workers] of engines()) {
      const promise = engine.solve(REQUEST);
      const message = workers[0].messages.at(-1);
      seen.push({ ...message, id: undefined });
      workers[0].reply({ id: message.id, ok: true, output: JSON.stringify(RESULT) });
      await expect(promise).resolves.toEqual(RESULT);
    }
    expect(seen[0]).toEqual(seen[1]);
    expect(seen[0]).toMatchObject({ command: "solve", ...REQUEST });
  });

  it("gửi cùng một message bld", async () => {
    const seen: any[] = [];
    for (const [engine, workers] of engines()) {
      const promise = engine.analyzeBld("state", "UUU");
      const message = workers[0].messages.at(-1);
      seen.push({ ...message, id: undefined });
      workers[0].reply({ id: message.id, ok: true, output: '{"analysis":{}}' });
      await expect(promise).resolves.toEqual({ analysis: {} });
    }
    expect(seen[0]).toEqual({ command: "bld", kind: "state", value: "UUU", id: undefined });
    expect(seen[1]).toEqual(seen[0]);
  });

  it("ánh xạ lỗi có cấu trúc giống nhau", async () => {
    for (const [engine, workers] of engines()) {
      const limited = engine.solve(REQUEST);
      let m = workers[0].messages.at(-1);
      workers[0].reply({ id: m.id, ok: false, error: "budget", code: "search_limit" });
      await expect(limited).rejects.toBeInstanceOf(SolverLimitError);

      const failed = engine.solve(REQUEST);
      m = workers[0].messages.at(-1);
      workers[0].reply({ id: m.id, ok: false, error: "bad cube", code: "invalid_input" });
      await expect(failed).rejects.toThrow("bad cube");
    }
  });

  it("huỷ: reject bằng SolverCancelledError và dừng worker", async () => {
    for (const [engine, workers] of engines()) {
      const promise = engine.solve(REQUEST);
      engine.cancel();
      await expect(promise).rejects.toBeInstanceOf(SolverCancelledError);
      // Không có SharedArrayBuffer cách ly (jsdom): huỷ bằng terminate.
      expect(workers[0].terminated).toBe(true);
    }
  });

  it("chỉ engine wasm chuyển tiếp tiến độ, kết quả vẫn đến sau", async () => {
    const [, [wasm, workers]] = engines();
    const progress = vi.fn();
    const promise = wasm.solve(REQUEST, progress);
    const m = workers[0].messages.at(-1);
    workers[0].reply({ id: m.id, type: "progress", stage: "F2L", nodes: 16385 });
    expect(progress).toHaveBeenCalledWith({ stage: "F2L", nodes: 16385 });
    workers[0].reply({ id: m.id, ok: true, output: JSON.stringify(RESULT) });
    await expect(promise).resolves.toEqual(RESULT);
  });

  it("warmup: pyodide chuẩn bị trước, wasm không tạo worker (tải lười)", async () => {
    const [[pyodide, pw], [wasm, ww]] = engines();
    const warm = pyodide.warmup();
    expect(pw[0].messages.at(-1)).toMatchObject({ command: "warmup" });
    pw[0].reply({ id: pw[0].messages.at(-1).id, ok: true, output: '{"ready":true}' });
    await warm;
    await wasm.warmup();
    expect(ww).toHaveLength(0);
  });
});

describe("resolveSolverEngineName", () => {
  it("mặc định là pyodide", () => {
    expect(resolveSolverEngineName(undefined)).toBe("pyodide");
    expect(resolveSolverEngineName("")).toBe("pyodide");
    expect(resolveSolverEngineName("python")).toBe("pyodide");
    expect(resolveSolverEngineName("wasm")).toBe("wasm");
    expect(resolveSolverEngineName(" WASM ")).toBe("wasm");
  });
});
