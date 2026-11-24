import type { BldResult, SolverResult } from "./solverRuntime";

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

export type CrossLengths = Record<"U" | "R" | "F" | "D" | "L" | "B", number>;

export interface SolverEngine {
  solve(
    request: SolveRequest,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverResult>;
  analyzeBld(kind: "scramble" | "state", value: string): Promise<BldResult>;
  crossLengths(kind: "scramble" | "state", value: string): Promise<CrossLengths>;
  warmup(): Promise<void>;
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

function createSolverWorker(): Worker {
  return new Worker(new URL("./solverWorker.ts", import.meta.url), {
    type: "module",
  });
}

export class WasmSolverEngine implements SolverEngine {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<number, PendingTask>();
  private cancelFlag: Int32Array | null = null;

  constructor(
    private readonly createWorker: () => Worker = createSolverWorker,
    private readonly timeoutMs: number = SOLVER_TIMEOUT_MS
  ) {}

  solve(
    request: SolveRequest,
    onProgress?: (progress: SolverProgress) => void
  ): Promise<SolverResult> {
    return this.post<SolverResult>({ command: "solve", ...request }, onProgress);
  }

  analyzeBld(kind: "scramble" | "state", value: string): Promise<BldResult> {
    return this.post<BldResult>({ command: "bld", kind, value });
  }

  crossLengths(kind: "scramble" | "state", value: string): Promise<CrossLengths> {
    return this.post<CrossLengths>({ command: "cross", kind, value });
  }

  async warmup(): Promise<void> {
  }

  cancel(): void {
    const reason = new SolverCancelledError();
    if (this.cancelFlag && this.worker) {
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
    const worker = this.createWorker();
    worker.onmessage = (event: MessageEvent<WorkerReply>) => this.onMessage(event.data);
    worker.onerror = () => {
      this.reset(new Error("Solver heavy worker failed to start or crashed."));
    };
    this.worker = worker;
    this.cancelFlag = null;
    if (
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
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        const task = this.pending.get(id);
        if (task) {
          this.pending.delete(id);
          task.reject(new SolverTimeoutError());
        }
      }, this.timeoutMs);
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
