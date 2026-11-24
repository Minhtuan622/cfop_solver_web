import {
  createRouxSolver,
  solveRoux,
  stateFromPatternData,
  type CubeState,
  type QuarterMoves,
  type RouxSolution,
  type RouxSolverContext,
} from "./rouxSolver";
import type { RouxWorkerRequest, RouxWorkerResponse } from "./rouxWorker";

const MOVE_NAMES = ["U", "D", "L", "R", "F", "B", "M", "r"] as const;

type PatternData = Record<string, { pieces: number[]; orientation: number[] }>;

async function readQuarterMoves(): Promise<QuarterMoves> {
  const { puzzles } = await import("cubing/puzzles");
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  const moves = kpuzzle.definition.moves as unknown as QuarterMoves;
  return Object.fromEntries(MOVE_NAMES.map(name => [name, moves[name]])) as QuarterMoves;
}

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let local: RouxSolverContext | null = null;
let nextId = 1;
const pending = new Map<number, { resolve: (value: RouxWorkerResponse) => void }>();

type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;

function call(request: WithoutId<RouxWorkerRequest>) {
  return new Promise<RouxWorkerResponse>(resolve => {
    const id = nextId++;
    pending.set(id, { resolve });
    worker!.postMessage({ ...request, id } as RouxWorkerRequest);
  });
}

function startWorker() {
  worker = new Worker(new URL("./rouxWorker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<RouxWorkerResponse>) => {
    pending.get(event.data.id)?.resolve(event.data);
    pending.delete(event.data.id);
  };
  worker.onerror = event => {
    for (const { resolve } of pending.values()) resolve({ id: 0, ok: false, error: event.message });
    pending.clear();
    worker = null;
    ready = null;
  };
}

export function prepareRouxSolver(): Promise<void> {
  ready ??= (async () => {
    const quarters = await readQuarterMoves();
    if (typeof Worker === "undefined") {
      local = createRouxSolver(quarters);
      return;
    }
    startWorker();
    const response = await call({ type: "init", quarters });
    if (!response.ok) throw new Error(response.error);
  })().catch(error => {
    ready = null;
    throw error;
  });
  return ready;
}

export async function solveRouxPattern(patternData: PatternData): Promise<RouxSolution> {
  await prepareRouxSolver();
  const state: CubeState = stateFromPatternData(patternData);
  if (local) return solveRoux(local, state);
  const response = await call({ type: "solve", state });
  if (!response.ok || !response.solution) throw new Error(response.ok ? "No solution" : response.error);
  return response.solution;
}

export async function solveRouxScramble(scramble: string): Promise<RouxSolution> {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles["3x3x3"].kpuzzle();
  const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
  return solveRouxPattern(pattern.patternData as unknown as PatternData);
}
