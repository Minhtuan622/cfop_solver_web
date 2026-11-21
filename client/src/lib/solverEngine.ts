/** Bộ giải CFOP chạy trong Web Worker, có hai engine thay thế được nhau.
 *
 * - `PyodideSolverEngine`: worker Pyodide hiện có (`solverWorker.ts`), giữ
 *   nguyên hành vi.
 * - `WasmSolverEngine`: worker WebAssembly (`solverWorkerWasm.ts`) chạy bộ giải
 *   Rust trong `packages/solver`. File `.wasm` chỉ được tải khi người dùng
 *   giải lần đầu (worker được tạo lười, warmup không làm gì).
 *
 * Cả hai worker nói chung một giao thức: request `{ id, command, ... }`, kết
 * quả `{ id, ok, output | error, code }`. Worker WASM gửi thêm
 * `{ id, type: "progress", stage, nodes }` trong lúc tìm kiếm.
 *
 * Engine được chọn bằng `VITE_SOLVER_ENGINE=wasm|pyodide` (mặc định pyodide).
 */
import type { BldResult, SolverResult } from "./solverRuntime";

export type SolverEngineName = "pyodide" | "wasm";

export type SolveRequest = {
  kind: "scramble" | "state";
  value: string;
  crossColor: string;
  opening: string;
  lastLayer: string;
  openingDepth: number;
  openingFindResult: boolean;
  directNodeBudget: number;
  preferredSlot?: string;
  excludedSlots: string[];
};

export type SolverProgress = { stage: string; nodes: number };

export interface SolverEngine {
  readonly name: SolverEngineName;
  solve(
    request: SolveRequest,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverResult>;
  analyzeBld(kind: "scramble" | "state", value: string): Promise<BldResult>;
  /** Chuẩn bị trước runtime (Pyodide); engine WASM bỏ qua để tải lười. */
  warmup(): Promise<void>;
  /** Huỷ mọi request đang chờ (reject bằng `SolverCancelledError`). */
  cancel(): void;
}

export const SOLVER_TIMEOUT_MS = 45000;

export class SolverCancelledError extends Error {
  constructor() {
    super("Solver request cancelled.");
    this.name = "SolverCancelledError";
  }
}

export class SolverTimeoutError extends Error {
  constructor() {
    super("Solver request exceeded the time limit and was stopped.");
    this.name = "SolverTimeoutError";
  }
}

/**
 * Solver đã dừng vì hết ngân sách tìm kiếm (thời gian hoặc số node).
 *
 * Đây là lỗi có cấu trúc từ solver (`search_limit`), khác với việc client
 * ngắt worker: giao diện có thể báo cho người dùng biết cần thử lại với
 * đề khác thay vì hiện một thông báo chung chung.
 */
export class SolverLimitError extends Error {
  constructor(message?: string) {
    super(message ?? "The solver reached its search budget.");
    this.name = "SolverLimitError";
  }
}

export type WorkerReply =
  | { id: number; ok: boolean; output?: string; error?: string; code?: string; type?: undefined }
  | { id: number; type: "progress"; stage: string; nodes: number };

type PendingTask = {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  onProgress?: (progress: SolverProgress) => void;
};

export type WorkerEngineOptions = {
  name: SolverEngineName;
  createWorker: () => Worker;
  /** `true`: warmup chạy lệnh "warmup" trong worker; `false`: không làm gì. */
  eagerWarmup: boolean;
  /**
   * Huỷ mềm qua `SharedArrayBuffer` (worker và bảng tra được giữ lại) khi
   * trình duyệt cho phép; nếu không thì terminate worker như trước.
   */
  softCancel: boolean;
  timeoutMs?: number;
};

/** Engine dùng chung cho mọi worker nói giao thức ở trên. */
export class WorkerSolverEngine implements SolverEngine {
  readonly name: SolverEngineName;
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, PendingTask>();
  private cancelFlag: Int32Array | null = null;

  constructor(private readonly options: WorkerEngineOptions) {
    this.name = options.name;
  }

  solve(
    request: SolveRequest,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverResult> {
    return this.post<SolverResult>({ command: "solve", ...request }, onProgress);
  }

  analyzeBld(kind: "scramble" | "state", value: string): Promise<BldResult> {
    return this.post<BldResult>({ command: "bld", kind, value });
  }

  async warmup(): Promise<void> {
    if (!this.options.eagerWarmup) return;
    await this.post<void>({ command: "warmup", value: "" });
  }

  cancel(): void {
    const reason = new SolverCancelledError();
    if (this.cancelFlag && this.worker) {
      // Mọi request có id <= giá trị này bị worker dừng ở lần kiểm tra tới.
      Atomics.store(this.cancelFlag, 0, this.nextId - 1);
      this.rejectAll(reason);
      return;
    }
    this.worker?.terminate();
    this.worker = null;
    this.rejectAll(reason);
  }

  private rejectAll(reason: Error) {
    this.pending.forEach(task => {
      clearTimeout(task.timer);
      task.reject(reason);
    });
    this.pending.clear();
  }

  private reset(reason: Error) {
    this.worker?.terminate();
    this.worker = null;
    this.cancelFlag = null;
    this.rejectAll(reason);
  }

  private getWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = this.options.createWorker();
    worker.onmessage = (event: MessageEvent<WorkerReply>) => this.onMessage(event.data);
    worker.onerror = () => {
      this.reset(new Error("Solver heavy worker failed to start or crashed."));
    };
    this.worker = worker;
    this.cancelFlag = null;
    if (
      this.options.softCancel &&
      typeof SharedArrayBuffer !== "undefined" &&
      (globalThis as { crossOriginIsolated?: boolean }).crossOriginIsolated
    ) {
      const buffer = new SharedArrayBuffer(4);
      this.cancelFlag = new Int32Array(buffer);
      worker.postMessage({ type: "init", cancelFlag: buffer });
    }
    return worker;
  }

  private onMessage(data: WorkerReply) {
    const task = this.pending.get(data.id);
    if (!task) return;
    if (data.type === "progress") {
      task.onProgress?.({ stage: data.stage, nodes: data.nodes });
      return;
    }
    this.pending.delete(data.id);
    clearTimeout(task.timer);
    if (data.ok && data.output) {
      try {
        task.resolve(JSON.parse(data.output));
      } catch (error) {
        task.reject(
          error instanceof Error ? error : new Error("Solver worker returned invalid JSON.")
        );
      }
    } else if (data.code === "cancelled") {
      task.reject(new SolverCancelledError());
    } else {
      task.reject(
        data.code === "search_limit"
          ? new SolverLimitError(data.error)
          : new Error(data.error ?? "Solver worker returned an empty response.")
      );
    }
  }

  private post<T>(
    message: Record<string, unknown>,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<T> {
    const id = this.nextId++;
    const timeoutMs = this.options.timeoutMs ?? SOLVER_TIMEOUT_MS;
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const task = this.pending.get(id);
        if (task) {
          this.pending.delete(id);
          task.reject(new SolverTimeoutError());
        }
      }, timeoutMs);
      this.pending.set(id, {
        resolve: value => resolve(value as T),
        reject,
        timer,
        onProgress,
      });
      try {
        this.getWorker().postMessage({ id, ...message });
      } catch (error) {
        this.pending.delete(id);
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }
}

/** Worker Pyodide hiện có, hành vi không đổi. */
export class PyodideSolverEngine extends WorkerSolverEngine {
  constructor(createWorker?: () => Worker) {
    super({
      name: "pyodide",
      createWorker:
        createWorker ??
        (() =>
          new Worker(new URL("./solverWorker.ts", import.meta.url), {
            type: "module",
          })),
      eagerWarmup: true,
      softCancel: false,
    });
  }
}

/** Worker WebAssembly (Rust). Tải `.wasm` khi giải lần đầu. */
export class WasmSolverEngine extends WorkerSolverEngine {
  constructor(createWorker?: () => Worker) {
    super({
      name: "wasm",
      createWorker:
        createWorker ??
        (() =>
          new Worker(new URL("./solverWorkerWasm.ts", import.meta.url), {
            type: "module",
          })),
      eagerWarmup: false,
      softCancel: true,
    });
  }
}

/** Đọc cờ cấu hình; giá trị lạ hoặc trống rơi về pyodide (mặc định). */
export function resolveSolverEngineName(flag: string | undefined): SolverEngineName {
  return flag?.trim().toLowerCase() === "wasm" ? "wasm" : "pyodide";
}

export function createSolverEngine(name: SolverEngineName): SolverEngine {
  return name === "wasm" ? new WasmSolverEngine() : new PyodideSolverEngine();
}
