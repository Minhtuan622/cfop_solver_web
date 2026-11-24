import { describe, expect, it, vi } from "vitest";
import {
  SolverCancelledError,
  SolverLimitError,
  SolverTimeoutError,
  WasmSolverEngine,
  type SolveRequest,
} from "@/lib/solverEngine";

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

function engine(timeoutMs?: number) {
  const workers: FakeWorker[] = [];
  const instance = new WasmSolverEngine(() => {
    const w = new FakeWorker();
    workers.push(w);
    return w as unknown as Worker;
  }, timeoutMs);
  return { engine: instance, workers };
}

describe("WasmSolverEngine", () => {
  it("gửi request solve cho worker và trả về kết quả đã parse", async () => {
    const { engine: e, workers } = engine();
    const promise = e.solve(REQUEST);
    const message = workers[0].messages.at(-1);
    expect(message).toMatchObject({ command: "solve", ...REQUEST });
    expect(typeof message.id).toBe("number");
    workers[0].reply({ id: message.id, ok: true, output: JSON.stringify(RESULT) });
    await expect(promise).resolves.toEqual(RESULT);
  });

  it("gửi request bld", async () => {
    const { engine: e, workers } = engine();
    const promise = e.analyzeBld("state", "UUU");
    const message = workers[0].messages.at(-1);
    expect(message).toEqual({ id: message.id, command: "bld", kind: "state", value: "UUU" });
    workers[0].reply({ id: message.id, ok: true, output: '{"analysis":{}}' });
    await expect(promise).resolves.toEqual({ analysis: {} });
  });

  it("ánh xạ lỗi có cấu trúc của solver", async () => {
    const { engine: e, workers } = engine();
    const limited = e.solve(REQUEST);
    let m = workers[0].messages.at(-1);
    workers[0].reply({ id: m.id, ok: false, error: "budget", code: "search_limit" });
    await expect(limited).rejects.toBeInstanceOf(SolverLimitError);

    const failed = e.solve(REQUEST);
    m = workers[0].messages.at(-1);
    workers[0].reply({ id: m.id, ok: false, error: "bad cube", code: "invalid_input" });
    await expect(failed).rejects.toThrow("bad cube");

    const stopped = e.solve(REQUEST);
    m = workers[0].messages.at(-1);
    workers[0].reply({ id: m.id, ok: false, error: "stop", code: "cancelled" });
    await expect(stopped).rejects.toBeInstanceOf(SolverCancelledError);
  });

  it("huỷ: reject bằng SolverCancelledError và dừng worker", async () => {
    const { engine: e, workers } = engine();
    const promise = e.solve(REQUEST);
    e.cancel();
    await expect(promise).rejects.toBeInstanceOf(SolverCancelledError);
    expect(workers[0].terminated).toBe(true);
    void e.solve(REQUEST);
    expect(workers).toHaveLength(2);
  });

  it("chuyển tiếp tiến độ, kết quả vẫn đến sau", async () => {
    const { engine: e, workers } = engine();
    const progress = vi.fn();
    const promise = e.solve(REQUEST, progress);
    const m = workers[0].messages.at(-1);
    workers[0].reply({ id: m.id, type: "progress", stage: "F2L", nodes: 16385 });
    expect(progress).toHaveBeenCalledWith({ stage: "F2L", nodes: 16385 });
    workers[0].reply({ id: m.id, ok: true, output: JSON.stringify(RESULT) });
    await expect(promise).resolves.toEqual(RESULT);
  });

  it("warmup không tạo worker (file .wasm chỉ tải khi giải)", async () => {
    const { engine: e, workers } = engine();
    await e.warmup();
    expect(workers).toHaveLength(0);
  });

  it("hết hạn ở phía client thì reject bằng SolverTimeoutError", async () => {
    vi.useFakeTimers();
    try {
      const { engine: e } = engine(1000);
      const promise = e.solve(REQUEST);
      vi.advanceTimersByTime(1001);
      await expect(promise).rejects.toBeInstanceOf(SolverTimeoutError);
    } finally {
      vi.useRealTimers();
    }
  });
});
