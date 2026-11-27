// Staged solver shared by the puzzles that are solved by a named method
// (2x2 CLL, Pyraminx top-first, Skewb Sarah's) instead of one shortest search.
//
// A method is a list of stages. Each stage either searches (breadth first) for
// any state that satisfies a goal, or finishes the puzzle with a meet-in-the-
// middle search to the solved state. Everything here works on plain pattern
// data so it can be tested without loading cubing.js.

export type OrbitState = { pieces: number[]; orientation: number[] };
export type PuzzleState = Record<string, OrbitState>;
export type OrbitMove = { permutation: number[]; orientationDelta: number[] };
export type MoveTable = Record<string, Record<string, OrbitMove>>;
export type OrbitSizes = Record<string, number>;

export type KeyOptions = {
  /** Orbits left out of the identity of a state (for example Pyraminx tips). */
  skipOrbits?: readonly string[];
  /** Orbits whose orientation is ignored (for example Skewb centers). */
  skipOrientation?: readonly string[];
};

export type Stage = {
  name: string;
  moves: readonly string[];
  /** "solved" finishes with a meet-in-the-middle search to the solved state. */
  goal: "solved" | ((state: PuzzleState) => boolean);
  key?: KeyOptions;
};

export type MethodSpec = {
  stages: readonly Stage[];
  /** Which part of the final state has to match the solved puzzle. */
  key?: KeyOptions;
};

export class MethodUnavailableError extends Error {
  constructor(message = "method-unavailable") {
    super(message);
    this.name = "MethodUnavailableError";
  }
}

const GOAL_DEPTH = 9;
const FORWARD_DEPTH = 6;
const BACKWARD_DEPTH = 5;
// A state that is not a real puzzle state (a bad painting) never reaches its
// goal; the budget stops the search long before it fills the memory.
const MAX_VISITED = 400_000;

export function stateKey(state: PuzzleState, options: KeyOptions = {}): string {
  const parts: string[] = [];
  for (const orbit of Object.keys(state).sort()) {
    if (options.skipOrbits?.includes(orbit)) continue;
    const { pieces, orientation } = state[orbit];
    parts.push(
      options.skipOrientation?.includes(orbit)
        ? pieces.join(",")
        : `${pieces.join(",")}/${orientation.join("")}`
    );
  }
  return parts.join("|");
}

export function applyMove(state: PuzzleState, move: Record<string, OrbitMove>, sizes: OrbitSizes): PuzzleState {
  const next: PuzzleState = {};
  for (const orbit of Object.keys(state)) {
    const { pieces, orientation } = state[orbit];
    const { permutation, orientationDelta } = move[orbit];
    const modulus = sizes[orbit];
    const nextPieces = new Array<number>(pieces.length);
    const nextOrientation = new Array<number>(pieces.length);
    for (let i = 0; i < pieces.length; i += 1) {
      const from = permutation[i];
      nextPieces[i] = pieces[from];
      nextOrientation[i] = (orientation[from] + orientationDelta[i]) % modulus;
    }
    next[orbit] = { pieces: nextPieces, orientation: nextOrientation };
  }
  return next;
}

export function solvedAt(orbit: string, positions: readonly number[]) {
  return (state: PuzzleState) =>
    positions.every(
      position =>
        state[orbit].pieces[position] === position && state[orbit].orientation[position] === 0
    );
}

export function allOf(...tests: Array<(state: PuzzleState) => boolean>) {
  return (state: PuzzleState) => tests.every(test => test(state));
}

export function invertMove(move: string): string {
  if (move.endsWith("2")) return move;
  return move.endsWith("'") ? move.slice(0, -1) : `${move}'`;
}

export function solvedFrom(state: PuzzleState): PuzzleState {
  const solved: PuzzleState = {};
  for (const orbit of Object.keys(state)) {
    const count = state[orbit].pieces.length;
    solved[orbit] = {
      pieces: Array.from({ length: count }, (_, index) => index),
      orientation: new Array<number>(count).fill(0),
    };
  }
  return solved;
}

export type SearchContext = {
  moves: MoveTable;
  sizes: OrbitSizes;
};

function searchGoal(
  context: SearchContext,
  start: PuzzleState,
  moveNames: readonly string[],
  test: (state: PuzzleState) => boolean
): { state: PuzzleState; path: string[] } {
  if (test(start)) return { state: start, path: [] };
  const seen = new Set([stateKey(start)]);
  let frontier: Array<{ state: PuzzleState; path: string[] }> = [{ state: start, path: [] }];
  for (let depth = 1; depth <= GOAL_DEPTH; depth += 1) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      for (const name of moveNames) {
        const moved = applyMove(node.state, context.moves[name], context.sizes);
        const key = stateKey(moved);
        if (seen.has(key)) continue;
        seen.add(key);
        if (seen.size > MAX_VISITED) throw new MethodUnavailableError("search-too-large");
        const path = [...node.path, name];
        if (test(moved)) return { state: moved, path };
        next.push({ state: moved, path });
      }
    }
    frontier = next;
  }
  throw new MethodUnavailableError("goal-not-reached");
}

type Reach = { parent: string | null; move: string | null; depth: number };

const forwardCache = new Map<string, Map<string, Reach>>();

// States reachable from the solved puzzle, used as the far half of the search.
function forwardTable(
  context: SearchContext,
  solved: PuzzleState,
  moveNames: readonly string[],
  options: KeyOptions,
  cacheId: string
): Map<string, Reach> {
  const cached = forwardCache.get(cacheId);
  if (cached) return cached;
  const table = new Map<string, Reach>();
  const rootKey = stateKey(solved, options);
  table.set(rootKey, { parent: null, move: null, depth: 0 });
  let frontier: Array<{ state: PuzzleState; key: string }> = [{ state: solved, key: rootKey }];
  for (let depth = 1; depth <= FORWARD_DEPTH; depth += 1) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      for (const name of moveNames) {
        const moved = applyMove(node.state, context.moves[name], context.sizes);
        const key = stateKey(moved, options);
        if (table.has(key)) continue;
        table.set(key, { parent: node.key, move: name, depth });
        next.push({ state: moved, key });
      }
    }
    frontier = next;
  }
  forwardCache.set(cacheId, table);
  return table;
}

function searchToSolved(
  context: SearchContext,
  start: PuzzleState,
  moveNames: readonly string[],
  options: KeyOptions,
  cacheId: string
): { state: PuzzleState; path: string[] } {
  const solved = solvedFrom(start);
  const table = forwardTable(context, solved, moveNames, options, cacheId);

  // The far half is stored as moves away from solved; solving walks them back.
  const finish = (key: string): string[] => {
    const tail: string[] = [];
    let cursor: string | null = key;
    while (cursor !== null) {
      const reach: Reach = table.get(cursor)!;
      if (reach.move) tail.push(invertMove(reach.move));
      cursor = reach.parent;
    }
    return tail;
  };

  let best: { path: string[]; total: number } | null = null;
  const seen = new Set([stateKey(start, options)]);
  let frontier: Array<{ state: PuzzleState; path: string[] }> = [{ state: start, path: [] }];
  for (let depth = 0; depth <= BACKWARD_DEPTH; depth += 1) {
    if (best && depth >= best.total) break;
    const next: typeof frontier = [];
    for (const node of frontier) {
      const hit = table.get(stateKey(node.state, options));
      if (hit) {
        const total = depth + hit.depth;
        if (!best || total < best.total)
          best = { path: [...node.path, ...finish(stateKey(node.state, options))], total };
      }
      if (depth === BACKWARD_DEPTH) continue;
      for (const name of moveNames) {
        const moved = applyMove(node.state, context.moves[name], context.sizes);
        const key = stateKey(moved, options);
        if (seen.has(key)) continue;
        seen.add(key);
        if (seen.size > MAX_VISITED) throw new MethodUnavailableError("search-too-large");
        next.push({ state: moved, path: [...node.path, name] });
      }
    }
    frontier = next;
  }
  if (!best) throw new MethodUnavailableError("solved-not-reached");
  let state = start;
  for (const name of best.path) state = applyMove(state, context.moves[name], context.sizes);
  return { state, path: best.path };
}

export type MethodPhase = { name: string; moves: string[] };

export function solveByMethod(
  id: string,
  spec: MethodSpec,
  context: SearchContext,
  start: PuzzleState
): MethodPhase[] {
  let state = start;
  const phases: MethodPhase[] = [];
  spec.stages.forEach((stage, index) => {
    const found =
      stage.goal === "solved"
        ? searchToSolved(context, state, stage.moves, stage.key ?? spec.key ?? {}, `${id}:${index}`)
        : searchGoal(context, state, stage.moves, stage.goal);
    phases.push({ name: stage.name, moves: found.path });
    state = found.state;
  });
  const solved = solvedFrom(start);
  if (stateKey(state, spec.key) !== stateKey(solved, spec.key))
    throw new MethodUnavailableError("not-solved");
  return phases;
}
