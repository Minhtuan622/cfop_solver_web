import { SOLVER_NODE_BUDGET, SOLVER_TIME_BUDGET_SEC } from "./solverBudget";
import type { WorkerReply } from "./solverEngine";

export type SolverWasmModule = {
  solve(
    stickers: string,
    options?: Record<string, unknown> | null,
    onProgress?: ((stage: string, nodes: number) => boolean) | null
  ): unknown;
  scrambleToStickers(scramble: string): string;
  analyzeBld(stickers: string): unknown;
  crossLengths(stickers: string): ArrayLike<number>;
  warmUp(): void;
};

export type WorkerRequest = {
  id: number;
  command?: "solve" | "bld" | "cross" | "warmup";
  kind?: string;
  value: string;
  crossColor?: string;
  opening?: string;
  lastLayer?: string;
  openingDepth?: number;
  openingFindResult?: boolean;
  directNodeBudget?: number;
  preferredSlot?: string;
  excludedSlots?: string[];
};

const CROSS_FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;

const PROGRESS_INTERVAL_MS = 100;

export function handleWasmRequest(
  wasm: SolverWasmModule,
  request: WorkerRequest,
  post: (reply: WorkerReply) => void,
  isCancelled: () => boolean = () => false
): WorkerReply {
  const { id, command = "solve", kind, value } = request;
  try {
    if (command === "warmup") {
      wasm.warmUp();
      return { id, ok: true, output: JSON.stringify({ ready: true }) };
    }
    const stickers = kind === "state" ? value : wasm.scrambleToStickers(value);
    if (command === "cross") {
      const lengths = Array.from(wasm.crossLengths(stickers));
      const byFace = Object.fromEntries(
        CROSS_FACE_ORDER.map((face, index) => [face, lengths[index]])
      );
      return { id, ok: true, output: JSON.stringify(byFace) };
    }
    if (command === "bld") {
      const analysis = wasm.analyzeBld(stickers);
      return {
        id,
        ok: true,
        output: JSON.stringify({ initial_state: stickers, analysis }),
      };
    }
    let lastReport = 0;
    const result = wasm.solve(
      stickers,
      {
        crossColor: request.crossColor ?? "U",
        opening: request.opening ?? "cross",
        lastLayer: request.lastLayer ?? "auto",
        openingDepth: request.openingDepth ?? 8,
        openingFindResult: request.openingFindResult ?? false,
        directNodeBudget: request.directNodeBudget ?? 5000,
        preferredSlot: request.preferredSlot,
        excludedSlots: request.excludedSlots ?? [],
        timeBudgetSec: SOLVER_TIME_BUDGET_SEC,
        nodeBudget: SOLVER_NODE_BUDGET,
      },
      (stage, nodes) => {
        const now = Date.now();
        if (now - lastReport >= PROGRESS_INTERVAL_MS) {
          lastReport = now;
          post({ id, type: "progress", stage, nodes });
        }
        return !isCancelled();
      }
    );
    return { id, ok: true, output: JSON.stringify(result) };
  } catch (error) {
    const structured = error as { code?: unknown; message?: unknown } | null;
    if (structured && typeof structured.code === "string") {
      return {
        id,
        ok: false,
        error: String(structured.message ?? ""),
        code: structured.code,
      };
    }
    return {
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      code: "",
    };
  }
}
