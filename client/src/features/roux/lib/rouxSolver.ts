import { CMLL_CASES_SOURCE } from "./rouxData";

export type OrbitMove = { permutation: number[]; orientationDelta: number[] };
export type QuarterMove = {
  CORNERS: OrbitMove;
  EDGES: OrbitMove;
  CENTERS: OrbitMove;
};
export type QuarterMoves = Record<string, QuarterMove>;

export type CubeState = {
  cp: number[];
  co: number[];
  ep: number[];
  eo: number[];
  cen: number[];
};

export type RouxPhase = {
  name: "First Block" | "Second Block" | "CMLL" | "LSE";
  moves: string[];
};
export type RouxSolution = { phases: RouxPhase[]; moves: string[] };

export function solvedState(): CubeState {
  const count = (n: number) => Array.from({ length: n }, (_, i) => i);
  return { cp: count(8), co: Array(8).fill(0), ep: count(12), eo: Array(12).fill(0), cen: count(6) };
}

export function stateFromPatternData(data: Record<string, { pieces: number[]; orientation: number[] }>): CubeState {
  return {
    cp: [...data.CORNERS.pieces],
    co: [...data.CORNERS.orientation],
    ep: [...data.EDGES.pieces],
    eo: [...data.EDGES.orientation],
    cen: [...data.CENTERS.pieces],
  };
}

function applyOrbit(
  pieces: number[],
  ori: number[],
  move: OrbitMove,
  modulus: number
): [number[], number[]] {
  const nextPieces = new Array<number>(pieces.length);
  const nextOri = new Array<number>(pieces.length);
  for (let i = 0; i < pieces.length; i += 1) {
    const from = move.permutation[i];
    nextPieces[i] = pieces[from];
    nextOri[i] = (ori[from] + move.orientationDelta[i]) % modulus;
  }
  return [nextPieces, nextOri];
}

export function applyQuarter(state: CubeState, move: QuarterMove): CubeState {
  const [cp, co] = applyOrbit(state.cp, state.co, move.CORNERS, 3);
  const [ep, eo] = applyOrbit(state.ep, state.eo, move.EDGES, 2);
  const [cen] = applyOrbit(state.cen, state.cen.map(() => 0), move.CENTERS, 4);
  return { cp, co, ep, eo, cen };
}

function powerMoves(quarter: QuarterMove): [QuarterMove, QuarterMove, QuarterMove] {
  const base = solvedState();
  const once = applyQuarter(base, quarter);
  const twice = applyQuarter(once, quarter);
  const thrice = applyQuarter(twice, quarter);
  const toMove = (result: CubeState): QuarterMove => ({
    CORNERS: { permutation: result.cp, orientationDelta: result.co },
    EDGES: { permutation: result.ep, orientationDelta: result.eo },
    CENTERS: { permutation: result.cen, orientationDelta: result.cen.map(() => 0) },
  });
  return [toMove(once), toMove(twice), toMove(thrice)];
}

export function buildMoveTables(quarters: QuarterMoves): Record<string, QuarterMove> {
  const tables: Record<string, QuarterMove> = {};
  for (const [name, quarter] of Object.entries(quarters)) {
    const [one, two, three] = powerMoves(quarter);
    tables[name] = one;
    tables[`${name}2`] = two;
    tables[`${name}'`] = three;
  }
  return tables;
}

export function tokenize(algorithm: string) {
  return algorithm.replace(/[()]/g, " ").split(/\s+/).filter(Boolean);
}

export function applyAlgorithm(state: CubeState, tables: Record<string, QuarterMove>, algorithm: string) {
  let next = state;
  for (const token of tokenize(algorithm)) {
    const move = tables[token];
    if (!move) throw new Error(`Unknown move: ${token}`);
    next = applyQuarter(next, move);
  }
  return next;
}

export function isSolved(state: CubeState) {
  const ok = (values: number[]) => values.every((value, index) => value === index);
  const zero = (values: number[]) => values.every(value => value === 0);
  return ok(state.cp) && zero(state.co) && ok(state.ep) && zero(state.eo) && ok(state.cen);
}

const FB = { edges: [7, 9, 11], corners: [5, 6] };
const SB = { edges: [5, 8, 10], corners: [4, 7] };

type Tracked = { edges: number[]; corners: number[] };

function trackedIndex(state: CubeState, tracked: Tracked) {
  let index = 0;
  for (const piece of tracked.edges) {
    const position = state.ep.indexOf(piece);
    index = index * 24 + position * 2 + state.eo[position];
  }
  for (const piece of tracked.corners) {
    const position = state.cp.indexOf(piece);
    index = index * 24 + position * 3 + state.co[position];
  }
  return index;
}

function trackedSize(tracked: Tracked) {
  return 24 ** (tracked.edges.length + tracked.corners.length);
}

function buildTransitions(tables: Record<string, QuarterMove>, moveNames: string[]) {
  const digitTable = (orbit: "EDGES" | "CORNERS", count: number, modulus: number) =>
    moveNames.map(name => {
      const move = tables[name][orbit];
      const next = new Uint8Array(24);
      for (let position = 0; position < count; position += 1) {
        const target = move.permutation.indexOf(position);
        for (let orientation = 0; orientation < modulus; orientation += 1)
          next[position * modulus + orientation] =
            target * modulus + ((orientation + move.orientationDelta[target]) % modulus);
      }
      return next;
    });
  return { edgeNext: digitTable("EDGES", 12, 2), cornerNext: digitTable("CORNERS", 8, 3) };
}

type Transitions = ReturnType<typeof buildTransitions>;

function stepIndex(
  index: number,
  edgeCount: number,
  cornerCount: number,
  transitions: Transitions,
  move: number
) {
  const total = edgeCount + cornerCount;
  let result = 0;
  let scale = 1;
  let rest = index;
  for (let i = total - 1; i >= 0; i -= 1) {
    const digit = rest % 24;
    rest = (rest - digit) / 24;
    const table = i < edgeCount ? transitions.edgeNext[move] : transitions.cornerNext[move];
    result += table[digit] * scale;
    scale *= 24;
  }
  return result;
}

type DistanceTable = {
  tracked: Tracked;
  moveNames: string[];
  transitions: Transitions;
  distance: Uint8Array;
};

function buildDistanceTable(
  tables: Record<string, QuarterMove>,
  tracked: Tracked,
  moveNames: string[]
): DistanceTable {
  const transitions = buildTransitions(tables, moveNames);
  const size = trackedSize(tracked);
  const distance = new Uint8Array(size).fill(255);
  const start = trackedIndex(solvedState(), tracked);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  queue[tail++] = start;
  distance[start] = 0;
  const edgeCount = tracked.edges.length;
  const cornerCount = tracked.corners.length;
  while (head < tail) {
    const current = queue[head++];
    const next = distance[current] + 1;
    for (let move = 0; move < moveNames.length; move += 1) {
      const target = stepIndex(current, edgeCount, cornerCount, transitions, move);
      if (distance[target] === 255) {
        distance[target] = next;
        queue[tail++] = target;
      }
    }
  }
  return { tracked, moveNames, transitions, distance };
}

function descend(
  state: CubeState,
  tables: Record<string, QuarterMove>,
  table: DistanceTable
): { state: CubeState; moves: string[] } {
  const moves: string[] = [];
  let current = state;
  const edgeCount = table.tracked.edges.length;
  const cornerCount = table.tracked.corners.length;
  let index = trackedIndex(current, table.tracked);
  while (table.distance[index] !== 0) {
    if (table.distance[index] === 255) throw new Error("State is not reachable");
    let chosen = -1;
    for (let move = 0; move < table.moveNames.length && chosen < 0; move += 1) {
      const target = stepIndex(index, edgeCount, cornerCount, table.transitions, move);
      if (table.distance[target] === table.distance[index] - 1) chosen = move;
    }
    const name = table.moveNames[chosen];
    current = applyQuarter(current, tables[name]);
    index = trackedIndex(current, table.tracked);
    moves.push(name);
  }
  return { state: current, moves };
}

const FACE_MOVES = ["U", "D", "L", "R", "F", "B"].flatMap(face => [face, `${face}2`, `${face}'`]);
const SB_MOVES = ["U", "R", "r", "M"].flatMap(face => [face, `${face}2`, `${face}'`]);

function cornersSolvedUpToAuf(state: CubeState) {
  for (let turn = 0; turn < 4; turn += 1) {
    if (state.cp.slice(0, 4).every((piece, slot) => piece === (slot + turn) % 4) && state.co.slice(0, 4).every(value => value === 0))
      return turn;
  }
  return -1;
}

type LseTable = { distance: Map<string, number>; keyOf: (state: CubeState) => string };

const LSE_EDGE_SLOTS = [0, 1, 2, 3, 4, 6];
const LSE_CENTER_SLOTS = [0, 2, 5, 4];

function lseKey(state: CubeState) {
  return [
    LSE_EDGE_SLOTS.map(slot => `${state.ep[slot]}.${state.eo[slot]}`).join(","),
    LSE_CENTER_SLOTS.map(slot => state.cen[slot]).join(""),
    state.cp.slice(0, 4).join(""),
  ].join("|");
}

function buildLseTable(tables: Record<string, QuarterMove>): LseTable {
  const names = ["M", "M2", "M'", "U", "U2", "U'"];
  const distance = new Map<string, number>();
  const start = solvedState();
  distance.set(lseKey(start), 0);
  let frontier = [start];
  let depth = 0;
  while (frontier.length) {
    depth += 1;
    const next: CubeState[] = [];
    for (const state of frontier)
      for (const name of names) {
        const moved = applyQuarter(state, tables[name]);
        const key = lseKey(moved);
        if (!distance.has(key)) {
          distance.set(key, depth);
          next.push(moved);
        }
      }
    frontier = next;
  }
  return { distance, keyOf: lseKey };
}

export type RouxSolverContext = {
  tables: Record<string, QuarterMove>;
  fb: DistanceTable;
  sb: DistanceTable;
  lse: LseTable;
};

export function createRouxSolver(quarters: QuarterMoves): RouxSolverContext {
  const tables = buildMoveTables(quarters);
  return {
    tables,
    fb: buildDistanceTable(tables, FB, FACE_MOVES),
    sb: buildDistanceTable(tables, SB, SB_MOVES),
    lse: buildLseTable(tables),
  };
}

function solveCmll(context: RouxSolverContext, state: CubeState) {
  const { tables } = context;
  const aufs = ["", "U", "U2", "U'"];
  let best: { moves: string[]; state: CubeState } | null = null;
  const consider = (prefix: string, algorithm: string) => {
    const tokens = tokenize(`${prefix} ${algorithm}`);
    const after = applyAlgorithm(state, tables, tokens.join(" "));
    for (const post of aufs) {
      const finished = post ? applyAlgorithm(after, tables, post) : after;
      if (cornersSolvedUpToAuf(finished) !== 0) continue;
      const moves = simplify([...tokens, ...tokenize(post)]);
      if (!best || moves.length < best.moves.length) best = { moves, state: finished };
      return;
    }
  };
  for (const prefix of aufs) {
    consider(prefix, "");
    for (const row of CMLL_CASES_SOURCE) consider(prefix, row.algorithm);
  }
  if (!best) throw new Error("No CMLL case matches");
  return best as { moves: string[]; state: CubeState };
}

export function simplify(moves: string[]) {
  const out: string[] = [];
  const amount = (token: string) => (token.endsWith("2") ? 2 : token.endsWith("'") ? 3 : 1);
  const base = (token: string) => token.replace(/['2]$/, "");
  const name = (face: string, turns: number) => (turns === 1 ? face : turns === 2 ? `${face}2` : `${face}'`);
  for (const token of moves) {
    const previous = out.at(-1);
    if (previous && base(previous) === base(token)) {
      const turns = (amount(previous) + amount(token)) % 4;
      out.pop();
      if (turns) out.push(name(base(token), turns));
    } else out.push(token);
  }
  return out;
}

function solveLse(context: RouxSolverContext, state: CubeState) {
  const { tables, lse } = context;
  const names = ["M", "M2", "M'", "U", "U2", "U'"];
  const moves: string[] = [];
  let current = state;
  let distance = lse.distance.get(lse.keyOf(current));
  if (distance === undefined) throw new Error("LSE state is not reachable");
  while (distance > 0) {
    let advanced = false;
    for (const name of names) {
      const moved = applyQuarter(current, tables[name]);
      const nextDistance = lse.distance.get(lse.keyOf(moved));
      if (nextDistance === distance - 1) {
        current = moved;
        distance = nextDistance;
        moves.push(name);
        advanced = true;
        break;
      }
    }
    if (!advanced) throw new Error("LSE search stalled");
  }
  return { moves, state: current };
}

export function solveRoux(context: RouxSolverContext, start: CubeState): RouxSolution {
  const { tables } = context;
  const first = descend(start, tables, context.fb);
  const second = descend(first.state, tables, context.sb);
  const cmll = solveCmll(context, second.state);
  const last = solveLse(context, cmll.state);
  const phases: RouxPhase[] = [
    { name: "First Block", moves: first.moves },
    { name: "Second Block", moves: second.moves },
    { name: "CMLL", moves: cmll.moves },
    { name: "LSE", moves: last.moves },
  ];
  return { phases, moves: phases.flatMap(phase => phase.moves) };
}
