// Megaminx layer by layer.
//
// Pieces are placed one at a time, in layer order, by a small bidirectional
// search over only the pieces that matter: the ones already placed plus the
// one being placed. Only a few faces are turned during each search (the faces
// of the target slot and of the piece's current position), which is how a
// person inserts a piece without wrecking the layers already solved.
//
// This module is pure: it works on kpuzzle transformation data and never
// imports cubing.js, so it can be unit tested on its own.

export type MinxOrbitMove = { permutation: number[]; orientationDelta: number[] };
export type MinxMove = { CORNERS: MinxOrbitMove; EDGES: MinxOrbitMove; CENTERS: MinxOrbitMove };
export type MinxMoves = Record<string, MinxMove>;

export type MinxPattern = {
  CORNERS: { pieces: number[]; orientation: number[] };
  EDGES: { pieces: number[]; orientation: number[] };
  CENTERS: { pieces: number[]; orientation: number[] };
};

export type MinxPhase = { name: string; moves: string[] };

export class MinxUnavailableError extends Error {
  constructor(message = "minx-unavailable") {
    super(message);
    this.name = "MinxUnavailableError";
  }
}

export const MINX_FACES = ["U", "F", "L", "BL", "BR", "R", "FR", "FL", "DL", "DR", "B", "D"] as const;
export type MinxFace = (typeof MINX_FACES)[number];

const SUFFIXES = ["", "'", "2", "2'"] as const;
export const faceMoveNames = (face: string) => SUFFIXES.map(suffix => `${face}${suffix}`);

export function invertMinxMove(move: string): string {
  const match = /^(.*?)(2?)('?)$/.exec(move)!;
  const [, face, fifths, prime] = match;
  return `${face}${fifths}${prime ? "" : "'"}`;
}

type Orbit = 0 | 1; // 0 = corners, 1 = edges
type Item = { orbit: Orbit; piece: number };

type Table = { to: Int16Array; delta: Int8Array };

export type MinxModel = {
  moves: MinxMoves;
  tables: Record<string, { corners: Table; edges: Table }>;
  faceOf: { corners: number[][]; edges: number[][] };
  depth: Record<string, number>;
};

function buildTable(orbit: MinxOrbitMove, modulus: number): Table {
  const size = orbit.permutation.length;
  const to = new Int16Array(size);
  const delta = new Int8Array(size);
  for (let target = 0; target < size; target += 1) {
    to[orbit.permutation[target]] = target;
    delta[target] = orbit.orientationDelta[target] % modulus;
  }
  return { to, delta };
}

export function buildMinxModel(moves: MinxMoves): MinxModel {
  const tables: MinxModel["tables"] = {};
  for (const [name, move] of Object.entries(moves))
    tables[name] = { corners: buildTable(move.CORNERS, 3), edges: buildTable(move.EDGES, 2) };

  const faceOf = {
    corners: Array.from({ length: 20 }, () => [] as number[]),
    edges: Array.from({ length: 30 }, () => [] as number[]),
  };
  MINX_FACES.forEach((face, index) => {
    const move = moves[face];
    move.CORNERS.permutation.forEach((from, at) => from !== at && faceOf.corners[at].push(index));
    move.EDGES.permutation.forEach((from, at) => from !== at && faceOf.edges[at].push(index));
  });

  // Distance of each face from the first face, in faces that share an edge.
  const edgeSets = MINX_FACES.map(face =>
    moves[face].EDGES.permutation.flatMap((from, at) => (from !== at ? [at] : []))
  );
  const neighbours = (index: number) =>
    MINX_FACES.flatMap((_, other) =>
      other !== index && edgeSets[index].some(edge => edgeSets[other].includes(edge)) ? [other] : []
    );
  const depthOf = new Array<number>(MINX_FACES.length).fill(-1);
  depthOf[0] = 0;
  const queue = [0];
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of neighbours(current))
      if (depthOf[next] < 0) {
        depthOf[next] = depthOf[current] + 1;
        queue.push(next);
      }
  }
  const depth: Record<string, number> = {};
  MINX_FACES.forEach((face, index) => (depth[face] = depthOf[index]));
  return { moves, tables, faceOf, depth };
}

type Layout = { name: string; items: Item[] };

// Face depths run 0 (the first face) to 3 (the opposite face); a piece is
// described by the smallest and largest depth among the faces it touches.
function layoutFor(model: MinxModel): Layout[] {
  const depthOfFace = MINX_FACES.map(face => model.depth[face]);
  const span = (faces: number[]) => {
    const depths = faces.map(face => depthOfFace[face]);
    return `${Math.min(...depths)}${Math.max(...depths)}${depths.filter(d => d === Math.min(...depths)).length}`;
  };
  const pick = (orbit: Orbit, wanted: string[]): Item[] => {
    const table = orbit === 0 ? model.faceOf.corners : model.faceOf.edges;
    return table.flatMap((faces, piece) => (wanted.includes(span(faces)) ? [{ orbit, piece }] : []));
  };
  // Keys are "min max count-at-min". Edges touch two faces, corners three.
  return [
    { name: "Star", items: pick(1, ["011"]) },
    { name: "First Layer Corners", items: pick(0, ["011"]) },
    { name: "Second Layer", items: [...pick(1, ["112"]), ...pick(0, ["122"])] },
    { name: "Third Layer", items: [...pick(1, ["121"]), ...pick(0, ["121"])] },
    { name: "Fourth Layer", items: [...pick(1, ["222"]), ...pick(0, ["232"])] },
  ];
}

type Tracked = { items: Item[]; state: Int16Array }; // state per item: position * 3 + orientation

export function projectionStart(items: Item[], pattern: MinxPattern): Int16Array {
  return Int16Array.from(
    items.map(({ orbit, piece }) => {
      const data = orbit === 0 ? pattern.CORNERS : pattern.EDGES;
      const position = data.pieces.indexOf(piece);
      return position * 3 + data.orientation[position];
    })
  );
}

function stepProjection(model: MinxModel, move: string, items: Item[], state: Int16Array): Int16Array {
  const tables = model.tables[move];
  const next = new Int16Array(state.length);
  for (let i = 0; i < state.length; i += 1) {
    const position = Math.floor(state[i] / 3);
    const orientation = state[i] % 3;
    if (items[i].orbit === 0) {
      const target = tables.corners.to[position];
      next[i] = target * 3 + ((orientation + tables.corners.delta[target]) % 3);
    } else {
      const target = tables.edges.to[position];
      next[i] = target * 3 + ((orientation + tables.edges.delta[target]) % 2);
    }
  }
  return next;
}

const keyOf = (state: Int16Array) => String.fromCharCode(...state);

type Link = { parent: string | null; move: string | null };


// Bidirectional search over the projection onto the tracked pieces.
export function placeSearch(
  model: MinxModel,
  tracked: Tracked,
  moveNames: string[],
  sideDepth = 6,
  nodeBudget = 120_000
): string[] | null {
  const { items } = tracked;
  const goal = Int16Array.from(items.map(item => item.piece * 3));
  const startKey = keyOf(tracked.state);
  const goalKey = keyOf(goal);
  if (startKey === goalKey) return [];

  const forward = new Map<string, Link>([[goalKey, { parent: null, move: null }]]);
  const backward = new Map<string, Link>([[startKey, { parent: null, move: null }]]);
  let forwardFrontier: Array<{ key: string; state: Int16Array }> = [{ key: goalKey, state: goal }];
  let backwardFrontier: Array<{ key: string; state: Int16Array }> = [{ key: startKey, state: tracked.state }];
  let forwardDepth = 0;
  let backwardDepth = 0;

  const join = (meet: string): string[] => {
    const head: string[] = [];
    for (let key: string | null = meet; key !== null; ) {
      const link: Link = backward.get(key)!;
      if (link.move) head.push(link.move);
      key = link.parent;
    }
    head.reverse();
    const tail: string[] = [];
    for (let key: string | null = meet; key !== null; ) {
      const link: Link = forward.get(key)!;
      if (link.move) tail.push(invertMinxMove(link.move));
      key = link.parent;
    }
    return [...head, ...tail];
  };

  while (forward.size + backward.size < nodeBudget) {
    const expandForward = forwardFrontier.length <= backwardFrontier.length;
    const frontier = expandForward ? forwardFrontier : backwardFrontier;
    if (!frontier.length || (expandForward ? forwardDepth : backwardDepth) >= sideDepth) return null;
    const seen = expandForward ? forward : backward;
    const other = expandForward ? backward : forward;
    const next: typeof frontier = [];
    for (const node of frontier) {
      if (Date.now() > deadlineAt) throw new MinxUnavailableError("too-slow");
      for (const move of moveNames) {
        const state = stepProjection(model, move, items, node.state);
        const key = keyOf(state);
        if (seen.has(key)) continue;
        seen.set(key, { parent: node.key, move });
        if (other.has(key)) return join(key);
        next.push({ key, state });
      }
    }
    if (expandForward) {
      forwardFrontier = next;
      forwardDepth += 1;
    } else {
      backwardFrontier = next;
      backwardDepth += 1;
    }
  }
  return null;
}

// Cheap necessary test: can the piece alone get to its slot with these turns?
function pieceCanArrive(model: MinxModel, item: Item, from: number, moveNames: string[]): boolean {
  const goal = item.piece * 3;
  const seen = new Set<number>([from]);
  const queue = [from];
  while (queue.length) {
    const state = queue.pop()!;
    if (state === goal) return true;
    for (const move of moveNames) {
      const next = stepProjection(model, move, [item], Int16Array.of(state))[0];
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}

export function subsets(pool: number[], size: number): number[][] {
  if (size === 0) return [[]];
  if (pool.length < size) return [];
  const [head, ...rest] = pool;
  return [...subsets(rest, size - 1).map(set => [head, ...set]), ...subsets(rest, size)];
}

function applyFull(model: MinxModel, pattern: MinxPattern, move: string): MinxPattern {
  const data = model.moves[move];
  const apply = (orbit: "CORNERS" | "EDGES", modulus: number) => {
    const { pieces, orientation } = pattern[orbit];
    const { permutation, orientationDelta } = data[orbit];
    return {
      pieces: permutation.map(from => pieces[from]),
      orientation: permutation.map((from, at) => (orientation[from] + orientationDelta[at]) % modulus),
    };
  };
  return { CORNERS: apply("CORNERS", 3), EDGES: apply("EDGES", 2), CENTERS: pattern.CENTERS };
}

function placeItem(model: MinxModel, pattern: MinxPattern, placed: Item[], item: Item): string[] {
  const data = item.orbit === 0 ? pattern.CORNERS : pattern.EDGES;
  const here = data.pieces.indexOf(item.piece);
  if (here === item.piece && data.orientation[here] === 0) return [];
  const faces = item.orbit === 0 ? model.faceOf.corners : model.faceOf.edges;
  const wanted = new Set([...faces[item.piece], ...faces[here]]);
  const tracked = [...placed, item];
  const start = projectionStart(tracked, pattern);
  const all = MINX_FACES.map((_, index) => index);

  // Cheap searches first: two faces, then two faces with plain turns only but
  // deeper (commutators), then three faces.
  const tiers: Array<{ size: number; turns: number[]; depth: number; budget: number; limit: number }> = [
    { size: 2, turns: [0, 1, 2, 3], depth: 6, budget: 60_000, limit: 66 },
    { size: 2, turns: [0, 1], depth: 11, budget: 250_000, limit: 66 },
    { size: 3, turns: [0, 1], depth: 7, budget: 150_000, limit: 90 },
    { size: 3, turns: [0, 1, 2, 3], depth: 5, budget: 150_000, limit: 60 },
    { size: 3, turns: [0, 1], depth: 9, budget: 500_000, limit: 120 },
    { size: 4, turns: [0, 1], depth: 7, budget: 500_000, limit: 120 },
  ];
  for (const tier of tiers) {
    const candidates = subsets(all, tier.size)
      .filter(set => set.some(face => wanted.has(face)))
      .map(set => ({ set, score: set.filter(face => wanted.has(face)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, tier.limit);
    for (const { set } of candidates) {
      const names = set.flatMap(face => tier.turns.map(turn => faceMoveNames(MINX_FACES[face])[turn]));
      if (!pieceCanArrive(model, item, start[start.length - 1], names)) continue;
      // Pieces outside these faces never move, so they cannot change the search.
      const active = tracked.map((entry, index) => {
        const slots = entry.orbit === 0 ? model.faceOf.corners : model.faceOf.edges;
        return slots[Math.floor(start[index] / 3)].some(face => set.includes(face));
      });
      const items = tracked.filter((_, index) => active[index]);
      const state = start.filter((_, index) => active[index]);
      const found = placeSearch(model, { items, state }, names, tier.depth, tier.budget);
      if (found) return found;
    }
  }
  throw new MinxUnavailableError(`placement-failed ${item.orbit} ${item.piece} here=${here} placed=${placed.length}`);
}

// The last five edges are solved with two long sequences found offline by the
// same search with every other piece tracked: a pure 3-cycle of last-layer
// edges and a pure flip of two of them. The rest of the ring is reached by
// renaming the faces (turning the last face moves the ring round).
const EDGE_CYCLE_MACRO =
  "FL2 D FL' D2 FL2' D' FL D FL D2' FL D' FL2' D' FL' D FL";
const EDGE_FLIP_MACRO = "D FR D FR D' FR' D' FL FR D2 FR' D' FL' D' FR'";

function macroTokens(text: string) {
  return text.split(/\s+/).filter(Boolean);
}

// The ring of last-layer edges, in the order the last face turns them.
function edgeRing(model: MinxModel): number[] {
  const last = MINX_FACES[MINX_FACES.length - 1];
  const to = model.tables[last].edges.to;
  const lastIndex = MINX_FACES.indexOf(last);
  const members = model.faceOf.edges.flatMap((faces, position) => (faces.includes(lastIndex) ? [position] : []));
  const ring = [members[0]];
  while (to[ring[ring.length - 1]] !== ring[0]) ring.push(to[ring[ring.length - 1]]);
  return ring;
}

// Spin the whole puzzle by `times` fifths about the first face, run the
// sequence, spin back: the same sequence acting on the next slot of the ring.
const SPIN_BY: Record<number, [string, string]> = {
  0: ["", ""],
  1: ["Uv", "Uv'"],
  2: ["Uv2", "Uv2'"],
  3: ["Uv2'", "Uv2"],
  4: ["Uv'", "Uv"],
};
export const SPIN_MOVES = ["Uv", "Uv'", "Uv2", "Uv2'"];

function spun(tokens: string[], times: number) {
  const [before, after] = SPIN_BY[times];
  return before ? [before, ...tokens, after] : tokens;
}

function solveLastEdges(model: MinxModel, pattern: MinxPattern): string[] {
  const positions = edgeRing(model);
  const inRing = new Set(positions);
  const encode = (edges: MinxPattern["EDGES"]) =>
    positions.map(position => `${positions.indexOf(edges.pieces[position])}${edges.orientation[position]}`).join(",");
  const solvedEdges = {
    pieces: Array.from({ length: 30 }, (_, i) => i),
    orientation: new Array<number>(30).fill(0),
  };
  const solvedKey = encode(solvedEdges);

  // Effect of a sequence on the ring, checked to leave every other piece alone.
  const effect = (moves: string[]) => {
    let state = {
      CORNERS: { pieces: Array.from({ length: 20 }, (_, i) => i), orientation: new Array<number>(20).fill(0) },
      EDGES: solvedEdges,
      CENTERS: pattern.CENTERS,
    };
    for (const move of moves) state = applyFull(model, state, move);
    const clean =
      state.CORNERS.pieces.every((piece, at) => piece === at && state.CORNERS.orientation[at] === 0) &&
      state.EDGES.pieces.every(
        (piece, at) => inRing.has(at) || (piece === at && state.EDGES.orientation[at] === 0)
      );
    if (!clean) throw new MinxUnavailableError("macro-not-pure");
    return state.EDGES;
  };

  type Generator = { moves: string[]; edges: MinxPattern["EDGES"] };
  const generators: Generator[] = [];
  for (const base of [EDGE_CYCLE_MACRO, EDGE_FLIP_MACRO]) {
    for (let times = 0; times < positions.length; times += 1) {
      const moves = spun(macroTokens(base), times);
      generators.push({ moves, edges: effect(moves) });
      const inverse = [...moves].reverse().map(invertMinxMove);
      generators.push({ moves: inverse, edges: effect(inverse) });
    }
  }

  const compose = (state: MinxPattern["EDGES"], generator: Generator): MinxPattern["EDGES"] => {
    const pieces = state.pieces.slice();
    const orientation = state.orientation.slice();
    for (const position of positions) {
      pieces[position] = state.pieces[generator.edges.pieces[position]];
      orientation[position] = (state.orientation[generator.edges.pieces[position]] + generator.edges.orientation[position]) % 2;
    }
    return { pieces, orientation };
  };

  // Cheapest route over the few thousand ring states (Dijkstra on move count).
  const startKey = encode(pattern.EDGES);
  const best = new Map<string, { cost: number; parent: string | null; via: Generator | null; state: MinxPattern["EDGES"] }>();
  best.set(startKey, { cost: 0, parent: null, via: null, state: pattern.EDGES });
  const open = [startKey];
  while (open.length) {
    open.sort((a, b) => best.get(b)!.cost - best.get(a)!.cost);
    const key = open.pop()!;
    if (key === solvedKey) break;
    const here = best.get(key)!;
    for (const generator of generators) {
      const state = compose(here.state, generator);
      const nextKey = encode(state);
      const cost = here.cost + generator.moves.length;
      const known = best.get(nextKey);
      if (!known || cost < known.cost) {
        best.set(nextKey, { cost, parent: key, via: generator, state });
        open.push(nextKey);
      }
    }
  }
  if (!best.has(solvedKey)) throw new MinxUnavailableError("last-edges-unreachable");
  const path: string[][] = [];
  for (let key: string | null = solvedKey; key !== null; ) {
    const node: { parent: string | null; via: Generator | null } = best.get(key)!;
    if (node.via) path.push(node.via.moves);
    key = node.parent;
  }
  return path.reverse().flat();
}

const TIME_LIMIT_MS = 25_000;
let deadlineAt = Infinity;

export function solveMinxLayers(
  model: MinxModel,
  start: MinxPattern,
  trace?: (layer: string, item: Item, moves: string[], ms: number) => void
): MinxPhase[] {
  let pattern = start;
  deadlineAt = Date.now() + TIME_LIMIT_MS;
  const placed: Item[] = [];
  const phases: MinxPhase[] = [];
  for (const layer of layoutFor(model)) {
    const moves: string[] = [];
    for (const item of layer.items) {
      if (Date.now() > deadlineAt) throw new MinxUnavailableError("too-slow");
      const began = Date.now();
      const found = placeItem(model, pattern, placed, item);
      trace?.(layer.name, item, found, Date.now() - began);
      for (const move of found) pattern = applyFull(model, pattern, move);
      moves.push(...found);
      placed.push(item);
    }
    phases.push({ name: layer.name, moves });
  }
  const lastMoves = solveLastEdges(model, pattern);
  for (const move of lastMoves) pattern = applyFull(model, pattern, move);
  phases.push({ name: "Last Layer", moves: lastMoves });
  const solved =
    pattern.CORNERS.pieces.every((piece, at) => piece === at && pattern.CORNERS.orientation[at] === 0) &&
    pattern.EDGES.pieces.every((piece, at) => piece === at && pattern.EDGES.orientation[at] === 0);
  if (!solved) throw new MinxUnavailableError("not-solved");
  return phases;
}


const ROTATIONS = ["Uv", "Uv'", "Fv", "Fv'", "Rv", "Rv'"];

export type MinxMoveSource = (name: string) => {
  CORNERS: { permutation: number[]; orientationDelta: number[] };
  EDGES: { permutation: number[]; orientationDelta: number[] };
  CENTERS: { permutation: number[]; orientationDelta: number[] };
};

// Megaminx scrambles use R++/D++, which carry the centers with them. Layer by
// layer only turns single faces, so first find the whole-puzzle rotation that
// puts the centers back, then solve what is left.
export function solveMinxPattern(
  start: MinxPattern,
  moveSource: MinxMoveSource,
  trace?: Parameters<typeof solveMinxLayers>[2]
): { phases: MinxPhase[]; rotation: string[] } {
  const moves: MinxMoves = {};
  for (const name of MINX_MOVE_NAMES) moves[name] = moveSource(name);
  const model = buildMinxModel(moves);

  const centersHome = (pattern: MinxPattern) => pattern.CENTERS.pieces.every((piece, at) => piece === at);
  const turn = (pattern: MinxPattern, move: MinxMove): MinxPattern => ({
    CORNERS: {
      pieces: move.CORNERS.permutation.map(from => pattern.CORNERS.pieces[from]),
      orientation: move.CORNERS.permutation.map(
        (from, at) => (pattern.CORNERS.orientation[from] + move.CORNERS.orientationDelta[at]) % 3
      ),
    },
    EDGES: {
      pieces: move.EDGES.permutation.map(from => pattern.EDGES.pieces[from]),
      orientation: move.EDGES.permutation.map(
        (from, at) => (pattern.EDGES.orientation[from] + move.EDGES.orientationDelta[at]) % 2
      ),
    },
    CENTERS: {
      pieces: move.CENTERS.permutation.map(from => pattern.CENTERS.pieces[from]),
      orientation: move.CENTERS.permutation.map(from => pattern.CENTERS.orientation[from]),
    },
  });

  let frontier: Array<{ pattern: MinxPattern; path: string[] }> = [{ pattern: start, path: [] }];
  let oriented: { pattern: MinxPattern; path: string[] } | null = centersHome(start) ? frontier[0] : null;
  const visited = new Set([start.CENTERS.pieces.join(",")]);
  for (let depth = 0; depth < 8 && !oriented; depth += 1) {
    const next: typeof frontier = [];
    for (const node of frontier)
      for (const name of ROTATIONS) {
        const pattern = turn(node.pattern, moveSource(name));
        const key = pattern.CENTERS.pieces.join(",");
        if (visited.has(key)) continue;
        visited.add(key);
        const entry = { pattern, path: [...node.path, name] };
        if (centersHome(pattern)) {
          oriented = entry;
          break;
        }
        next.push(entry);
      }
    frontier = next;
  }
  if (!oriented) throw new MinxUnavailableError("no-rotation");
  return { phases: solveMinxLayers(model, oriented.pattern, trace), rotation: oriented.path };
}

// Every move name a solve needs, so callers can fetch each transformation once.
export const MINX_MOVE_NAMES = [
  ...MINX_FACES.flatMap(face => faceMoveNames(face)),
  ...ROTATIONS,
  ...SPIN_MOVES,
];
