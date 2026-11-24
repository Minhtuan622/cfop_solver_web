/**
 * Web Worker của bộ giải Roux: dựng ba bảng tìm kiếm (vài giây) và giải mà
 * không chặn giao diện. Không import cubing.js (preload trong worker dùng
 * `document`); dữ liệu lượt do luồng chính gửi sang.
 */
import {
  createRouxSolver,
  solveRoux,
  type CubeState,
  type QuarterMoves,
  type RouxSolution,
  type RouxSolverContext,
} from "./rouxSolver";

export type RouxWorkerRequest =
  | { id: number; type: "init"; quarters: QuarterMoves }
  | { id: number; type: "solve"; state: CubeState };

export type RouxWorkerResponse =
  | { id: number; ok: true; solution?: RouxSolution }
  | { id: number; ok: false; error: string };

let context: RouxSolverContext | null = null;

self.onmessage = (event: MessageEvent<RouxWorkerRequest>) => {
  const message = event.data;
  try {
    if (message.type === "init") {
      context ??= createRouxSolver(message.quarters);
      (self as unknown as Worker).postMessage({ id: message.id, ok: true } satisfies RouxWorkerResponse);
      return;
    }
    if (!context) throw new Error("Roux solver is not initialised");
    const solution = solveRoux(context, message.state);
    (self as unknown as Worker).postMessage({ id: message.id, ok: true, solution } satisfies RouxWorkerResponse);
  } catch (error) {
    (self as unknown as Worker).postMessage({
      id: message.id,
      ok: false,
      error: String(error),
    } satisfies RouxWorkerResponse);
  }
};
