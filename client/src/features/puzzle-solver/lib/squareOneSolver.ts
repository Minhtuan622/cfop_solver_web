import { SQUARE_ONE_PARITY_RUNS } from "./squareOneParity";
import {
  SQ1_LAYER,
  SQ1_SOLVED,
  SquareOneStateError,
  assertSquareOneState,
  formatToken,
  layerMask,
  maskAllowsSlice,
  mod12,
  sliceState,
  turnLayers,
  wedgeKind,
  type SquareOneToken,
} from "@/lib/squareOneModel";

// Square-1 solver in three phases, each solved exactly from a small table:
//
//   1. Cube Shape      both layers become alternating edge/corner rings.
//   2. Separate Layers every piece goes to the layer it belongs to, with the
//                      state in a class the last phase can finish.
//   3. Permute         pieces move inside their layers until solved.
//
// In a cube shape a layer is four (edge, corner) pairs, so the eight pair
// positions are top 0-3 and bottom 4-7. A "macro" is a short run of slices that
// starts and ends in a cube shape; it moves the eight edges and the eight
// corners by two independent permutations of those positions.

export class SquareOneUnavailableError extends Error {
  constructor(message = "square-one") {
    super(message);
    this.name = "SquareOneUnavailableError";
  }
}

export type SquareOnePhase = { name: string; moves: string[] };

const FULL = 0xfff;
// Corner first halves of an aligned cube shape: slots 0, 3, 6, 9 on the top
// layer and 1, 4, 7, 10 on the bottom layer (the layers read in opposite ways).
const TOP_BASE = 0x249;
const BOTTOM_BASE = 0x492;
const MACRO_DEPTH = 5;

const rotateMask = (mask: number, amount: number) => {
  const shift = mod12(amount);
  return ((mask << shift) | (mask >>> (12 - shift))) & FULL;
};

const ROTATE: Uint16Array[] = Array.from({ length: 12 }, (_, amount) => {
  const table = new Uint16Array(4096);
  for (let mask = 0; mask < 4096; mask += 1) table[mask] = rotateMask(mask, amount);
  return table;
});

const shapeKey = (top: number, bottom: number) => top | (bottom << 12);

function sliceMasks(top: number, bottom: number): [number, number] {
  return [(top & 0x3f) | ((bottom & 0x3f) << 6), ((top >> 6) & 0x3f) | (bottom & 0xfc0)];
}

// ---------------------------------------------------------------------------
// Phase 1 table: slices still needed to reach a cube shape from any shape.

let shapeTable: Uint8Array | null = null;

function shapeDistances() {
  if (shapeTable) return shapeTable;
  const distance = new Uint8Array(1 << 24).fill(255);
  let frontier: number[] = [];
  for (let top = 0; top < 3; top += 1) {
    for (let bottom = 0; bottom < 3; bottom += 1) {
      const key = shapeKey(rotateMask(TOP_BASE, top), rotateMask(TOP_BASE, bottom));
      distance[key] = 0;
      frontier.push(key);
    }
  }
  for (let level = 0; frontier.length; level += 1) {
    const next: number[] = [];
    for (const key of frontier) {
      const top = key & FULL;
      const bottom = key >> 12;
      if (!maskAllowsSlice(top) || !maskAllowsSlice(bottom)) continue;
      const [sliceTop, sliceBottom] = sliceMasks(top, bottom);
      for (let x = 0; x < 12; x += 1) {
        for (let y = 0; y < 12; y += 1) {
          const nextKey = shapeKey(ROTATE[x][sliceTop], ROTATE[y][sliceBottom]);
          if (distance[nextKey] === 255) {
            distance[nextKey] = level + 1;
            next.push(nextKey);
          }
        }
      }
    }
    frontier = next;
  }
  shapeTable = distance;
  return distance;
}

// ---------------------------------------------------------------------------
// Macros: slice runs between cube shapes, found by a depth-limited search over
// shapes and then replayed on the solved state to read their effect.

type Macro = {
  // [top, bottom] turn before each slice, then a final alignment turn.
  steps: number[];
  tail: [number, number];
  edges: number[]; // new[position] = old[edges[position]]
  corners: number[];
  cost: number;
  keepsLayers: boolean;
};

const identity8 = [0, 1, 2, 3, 4, 5, 6, 7];
// A pair turn as a position permutation: new[position] = old[TURN[position]].
const TOP_TURN = [3, 0, 1, 2, 4, 5, 6, 7];
const BOTTOM_TURN = [0, 1, 2, 3, 7, 4, 5, 6];

function pairArrays(state: readonly number[]) {
  const edges: number[] = [];
  const corners: number[] = [];
  for (let layer = 0; layer < 2; layer += 1) {
    for (let pair = 0; pair < 4; pair += 1) {
      const edge = state[layer * SQ1_LAYER + 3 * pair + (layer === 0 ? 2 : 0)];
      const corner = state[layer * SQ1_LAYER + 3 * pair + (layer === 0 ? 0 : 1)];
      if (wedgeKind(edge) !== 2 || wedgeKind(corner) !== 0) return null;
      edges.push((edge < 12 ? 0 : 4) + Math.floor((edge % 12) / 3));
      corners.push((corner < 12 ? 0 : 4) + Math.floor((corner % 12) / 3));
    }
  }
  return { edges, corners };
}

function runMacro(steps: number[], tail: [number, number]) {
  let state = SQ1_SOLVED.slice();
  for (let index = 0; index < steps.length; index += 2) {
    state = sliceState(turnLayers(state, steps[index], steps[index + 1]));
  }
  return pairArrays(turnLayers(state, tail[0], tail[1]));
}

const invert8 = (permutation: number[]) => {
  const inverse = new Array<number>(8);
  permutation.forEach((source, position) => {
    inverse[source] = position;
  });
  return inverse;
};

// Turning a layer costs nothing, so two macros that differ only by turns before
// or after them are the same move. Keeping one of each keeps the tables small.
const composePositions = (outer: readonly number[], inner: readonly number[]) => inner.map(position => outer[position]);

const TURN_PERMUTATIONS: number[][] = (() => {
  const list: number[][] = [];
  for (let top = 0; top < 4; top += 1) {
    for (let bottom = 0; bottom < 4; bottom += 1) {
      let permutation = identity8;
      for (let count = 0; count < top; count += 1) permutation = composePositions(permutation, TOP_TURN);
      for (let count = 0; count < bottom; count += 1) permutation = composePositions(permutation, BOTTOM_TURN);
      list.push(permutation);
    }
  }
  return list;
})();

function reduceByTurns(list: Macro[]) {
  const best = new Map<string, Macro>();
  for (const macro of list) {
    let canonical = "";
    for (const before of TURN_PERMUTATIONS) {
      for (const after of TURN_PERMUTATIONS) {
        const e = identity8.map(position => before[macro.edges[after[position]]]);
        const c = identity8.map(position => before[macro.corners[after[position]]]);
        const key = `${e.join("")}|${c.join("")}`;
        if (!canonical || key < canonical) canonical = key;
      }
    }
    const known = best.get(canonical);
    if (!known || known.cost > macro.cost) best.set(canonical, macro);
  }
  return [...best.values()];
}

let macroList: Macro[] | null = null;

function macros() {
  if (macroList) return macroList;
  const distance = shapeDistances();
  const sequences: number[][] = [];
  const walk = (top: number, bottom: number, depth: number, sequence: number[]) => {
    if (depth > 0 && distance[shapeKey(top, bottom)] === 0) {
      sequences.push(sequence.slice());
      return;
    }
    if (depth === MACRO_DEPTH || distance[shapeKey(top, bottom)] > MACRO_DEPTH - depth) return;
    const turns = depth === 0 ? [0, 1, 2] : Array.from({ length: 12 }, (_, turn) => turn);
    for (const a of turns) {
      for (const b of turns) {
        const turnedTop = ROTATE[a][top];
        const turnedBottom = ROTATE[b][bottom];
        if (!maskAllowsSlice(turnedTop) || !maskAllowsSlice(turnedBottom)) continue;
        const [nextTop, nextBottom] = sliceMasks(turnedTop, turnedBottom);
        sequence.push(a, b);
        walk(nextTop, nextBottom, depth + 1, sequence);
        sequence.length -= 2;
      }
    }
  };
  walk(TOP_BASE, BOTTOM_BASE, 0, []);

  const byEffect = new Map<string, Macro>();
  const remember = (steps: number[], tail: [number, number]) => {
    const effect = runMacro(steps, tail);
    if (!effect) return;
    const cost = steps.length / 2;
    const key = `${effect.edges.join("")}|${effect.corners.join("")}`;
    const known = byEffect.get(key);
    if (known && known.cost <= cost) return;
    byEffect.set(key, {
      steps,
      tail,
      edges: effect.edges,
      corners: effect.corners,
      cost,
      keepsLayers:
        effect.edges.slice(0, 4).every(piece => piece < 4) &&
        effect.corners.slice(0, 4).every(piece => piece < 4),
    });
  };
  const addRun = (sequence: number[]) => {
    // The shape after the run decides the turn that lines both layers up.
    let top = TOP_BASE;
    let bottom = BOTTOM_BASE;
    for (let index = 0; index < sequence.length; index += 2) {
      [top, bottom] = sliceMasks(ROTATE[sequence[index]][top], ROTATE[sequence[index + 1]][bottom]);
    }
    const alignTop = [0, 1, 2].find(turn => ROTATE[turn][top] === TOP_BASE);
    const alignBottom = [0, 1, 2].find(turn => ROTATE[turn][bottom] === BOTTOM_BASE);
    if (alignTop === undefined || alignBottom === undefined) return;
    const tail: [number, number] = [alignTop, alignBottom];
    remember(sequence, tail);
    // The reverse run: undo the alignment, then every slice back to the start.
    const reverse: number[] = [-tail[0], -tail[1]];
    for (let index = sequence.length - 2; index >= 2; index -= 2) reverse.push(-sequence[index], -sequence[index + 1]);
    remember(reverse, [-sequence[0], -sequence[1]]);
  };
  for (const sequence of sequences) addRun(sequence);
  for (const run of SQUARE_ONE_PARITY_RUNS) addRun(run.slice());
  macroList = reduceByTurns([...byEffect.values()]);
  return macroList;
}

// ---------------------------------------------------------------------------
// Phase 3 table: permutations that keep every piece in its own layer.

const PERMUTATIONS_4: number[][] = [];
{
  const build = (current: number[], rest: number[]) => {
    if (!rest.length) {
      PERMUTATIONS_4.push(current);
      return;
    }
    for (const value of rest) build([...current, value], rest.filter(other => other !== value));
  };
  build([], [0, 1, 2, 3]);
}
const PERMUTATION_INDEX = new Map(PERMUTATIONS_4.map((permutation, index) => [permutation.join(""), index]));

const arrangementIndex = (arrangement: readonly number[]) =>
  PERMUTATION_INDEX.get(arrangement.slice(0, 4).join(""))! * 24 +
  PERMUTATION_INDEX.get(arrangement.slice(4).map(piece => piece - 4).join(""))!;

const arrangementOf = (index: number) => [
  ...PERMUTATIONS_4[Math.floor(index / 24)],
  ...PERMUTATIONS_4[index % 24].map(piece => piece + 4),
];

const ARRANGEMENTS = 576;
const applyPositions = (arrangement: readonly number[], source: readonly number[]) =>
  source.map(position => arrangement[position]);

function signOf(permutation: readonly number[]) {
  let inversions = 0;
  for (let i = 0; i < permutation.length; i += 1) {
    for (let j = i + 1; j < permutation.length; j += 1) if (permutation[i] > permutation[j]) inversions += 1;
  }
  return inversions & 1;
}

type LayerGenerator = { edges: Int16Array; corners: Int16Array; cost: number; macro: Macro };
type LayerTable = { distance: Uint8Array; generators: LayerGenerator[]; turns: Int16Array[]; reachable: Set<number> };

let layerTable: LayerTable | null = null;

const stateIndex = (edges: number, corners: number, parity: number) => (edges * ARRANGEMENTS + corners) * 2 + parity;

function layerDistances() {
  if (layerTable) return layerTable;
  const tables = new Map<string, Int16Array>();
  const transitions = (source: readonly number[]) => {
    const key = source.join("");
    let table = tables.get(key);
    if (!table) {
      table = new Int16Array(ARRANGEMENTS);
      for (let index = 0; index < ARRANGEMENTS; index += 1)
        table[index] = arrangementIndex(applyPositions(arrangementOf(index), source));
      tables.set(key, table);
    }
    return table;
  };
  const generators: LayerGenerator[] = macros()
    .filter(macro => macro.keepsLayers)
    .map(macro => ({ edges: transitions(macro.edges), corners: transitions(macro.corners), cost: macro.cost, macro }));
  const turns = [transitions(TOP_TURN), transitions(BOTTOM_TURN)];
  const distance = new Uint8Array(ARRANGEMENTS * ARRANGEMENTS * 2).fill(255);
  const solved = arrangementIndex(identity8);
  const start = stateIndex(solved, solved, 0);
  distance[start] = 0;
  const buckets: number[][] = [[start]];
  const reachable = new Set<number>();
  for (let level = 0; level < buckets.length; level += 1) {
    const queue = buckets[level];
    if (!queue) continue;
    for (let at = 0; at < queue.length; at += 1) {
      const state = queue[at];
      if (distance[state] !== level) continue;
      const parity = state & 1;
      const corners = (state >> 1) % ARRANGEMENTS;
      const edges = Math.floor((state >> 1) / ARRANGEMENTS);
      for (const turn of turns) {
        const next = stateIndex(turn[edges], turn[corners], parity);
        if (distance[next] > level) {
          distance[next] = level;
          queue.push(next);
        }
      }
      for (const generator of generators) {
        const cost = level + generator.cost;
        const next = stateIndex(generator.edges[edges], generator.corners[corners], parity ^ (generator.cost & 1));
        if (distance[next] > cost) {
          distance[next] = cost;
          (buckets[cost] ??= []).push(next);
        }
      }
    }
  }
  const signs = Array.from({ length: ARRANGEMENTS }, (_, index) => signOf(arrangementOf(index)));
  for (let state = 0; state < distance.length; state += 1) {
    if (distance[state] === 255) continue;
    const rest = state >> 1;
    reachable.add(signs[Math.floor(rest / ARRANGEMENTS)] * 4 + signs[rest % ARRANGEMENTS] * 2 + (state & 1));
  }
  layerTable = { distance, generators, turns, reachable };
  return layerTable;
}

// ---------------------------------------------------------------------------
// Phase 2 table: positions of top-layer pieces, plus the sign and slice-parity
// classes that phase 3 can finish.

type SeparateTable = { distance: Uint8Array };
let separateTable: SeparateTable | null = null;

const maskNode = (edgeMask: number, cornerMask: number, edgeSign: number, cornerSign: number, parity: number) =>
  edgeMask | (cornerMask << 8) | (edgeSign << 16) | (cornerSign << 17) | (parity << 18);

const maskAfter = (mask: number, source: readonly number[]) => {
  let next = 0;
  for (let position = 0; position < 8; position += 1) if (mask & (1 << source[position])) next |= 1 << position;
  return next;
};

function separateDistances() {
  if (separateTable) return separateTable;
  const { reachable } = layerDistances();
  const list = macros().map(macro => ({
    ...macro,
    edgeSign: signOf(macro.edges),
    cornerSign: signOf(macro.corners),
  }));
  const turns = [TOP_TURN, BOTTOM_TURN];
  const distance = new Uint8Array(1 << 19).fill(255);
  const buckets: number[][] = [[]];
  for (const code of reachable) {
    const node = maskNode(0x0f, 0x0f, code >> 2, (code >> 1) & 1, code & 1);
    distance[node] = 0;
    buckets[0].push(node);
  }
  for (let level = 0; level < buckets.length; level += 1) {
    const queue = buckets[level];
    if (!queue) continue;
    for (let at = 0; at < queue.length; at += 1) {
      const node = queue[at];
      if (distance[node] !== level) continue;
      const edgeMask = node & 0xff;
      const cornerMask = (node >> 8) & 0xff;
      const edgeSign = (node >> 16) & 1;
      const cornerSign = (node >> 17) & 1;
      const parity = (node >> 18) & 1;
      for (const turn of turns) {
        const next = maskNode(maskAfter(edgeMask, turn), maskAfter(cornerMask, turn), edgeSign ^ 1, cornerSign ^ 1, parity);
        if (distance[next] > level) {
          distance[next] = level;
          queue.push(next);
        }
      }
      for (const macro of list) {
        const cost = level + macro.cost;
        const next = maskNode(
          maskAfter(edgeMask, macro.edges),
          maskAfter(cornerMask, macro.corners),
          edgeSign ^ macro.edgeSign,
          cornerSign ^ macro.cornerSign,
          parity ^ (macro.cost & 1)
        );
        if (distance[next] > cost) {
          distance[next] = cost;
          (buckets[cost] ??= []).push(next);
        }
      }
    }
  }
  separateTable = { distance };
  return separateTable;
}

// ---------------------------------------------------------------------------
// Turning the table lookups into moves.

class MoveWriter {
  private pendingTop = 0;
  private pendingBottom = 0;
  readonly tokens: SquareOneToken[] = [];
  readonly phases: { name: string; end: number }[] = [];
  state: number[];
  slices = 0;

  constructor(state: number[]) {
    this.state = state;
  }

  turn(top: number, bottom: number) {
    this.pendingTop += top;
    this.pendingBottom += bottom;
    this.state = turnLayers(this.state, top, bottom);
  }

  slice() {
    this.tokens.push({ top: mod12(this.pendingTop), bottom: mod12(this.pendingBottom), slice: true });
    this.pendingTop = 0;
    this.pendingBottom = 0;
    this.state = sliceState(this.state);
    this.slices += 1;
  }

  endPhase(name: string) {
    this.phases.push({ name, end: this.tokens.length });
  }

  finish() {
    if (mod12(this.pendingTop) || mod12(this.pendingBottom))
      this.tokens.push({ top: mod12(this.pendingTop), bottom: mod12(this.pendingBottom), slice: false });
    const last = this.phases[this.phases.length - 1];
    if (last) last.end = this.tokens.length;
    let start = 0;
    return this.phases.map<SquareOnePhase>(phase => {
      const moves = this.tokens.slice(start, phase.end).map(formatToken);
      start = phase.end;
      return { name: phase.name, moves };
    });
  }
}

const turnSize = (top: number, bottom: number) =>
  Math.abs(top > 6 ? top - 12 : top) + Math.abs(bottom > 6 ? bottom - 12 : bottom);

function solveShape(writer: MoveWriter) {
  const distance = shapeDistances();
  for (;;) {
    const top = layerMask(writer.state, 0);
    const bottom = layerMask(writer.state, 1);
    const current = distance[shapeKey(top, bottom)];
    if (current === 255) throw new SquareOneUnavailableError("shape");
    if (current === 0) return;
    let best: [number, number] | null = null;
    let bestSize = Infinity;
    for (let a = 0; a < 12; a += 1) {
      for (let b = 0; b < 12; b += 1) {
        const turnedTop = ROTATE[a][top];
        const turnedBottom = ROTATE[b][bottom];
        if (!maskAllowsSlice(turnedTop) || !maskAllowsSlice(turnedBottom)) continue;
        const [nextTop, nextBottom] = sliceMasks(turnedTop, turnedBottom);
        if (distance[shapeKey(nextTop, nextBottom)] !== current - 1) continue;
        const size = turnSize(a, b);
        if (size < bestSize) {
          bestSize = size;
          best = [a, b];
        }
      }
    }
    if (!best) throw new SquareOneUnavailableError("shape");
    writer.turn(best[0], best[1]);
    writer.slice();
  }
}

function alignCube(writer: MoveWriter) {
  const top = [0, 1, 2].find(turn => ROTATE[turn][layerMask(writer.state, 0)] === TOP_BASE);
  const bottom = [0, 1, 2].find(turn => ROTATE[turn][layerMask(writer.state, 1)] === BOTTOM_BASE);
  if (top === undefined || bottom === undefined) throw new SquareOneUnavailableError("align");
  writer.turn(top, bottom);
}

function playMacro(writer: MoveWriter, macro: Macro, extraTop: number, extraBottom: number) {
  writer.turn(extraTop * 3, extraBottom * 3);
  for (let index = 0; index < macro.steps.length; index += 2) {
    writer.turn(macro.steps[index], macro.steps[index + 1]);
    writer.slice();
  }
  writer.turn(macro.tail[0], macro.tail[1]);
}

const turnPairs = (arrangement: readonly number[], top: number, bottom: number) => {
  let current = arrangement.slice();
  for (let count = 0; count < top; count += 1) current = applyPositions(current, TOP_TURN);
  for (let count = 0; count < bottom; count += 1) current = applyPositions(current, BOTTOM_TURN);
  return current;
};

function readPairs(writer: MoveWriter) {
  const arrays = pairArrays(writer.state);
  if (!arrays) throw new SquareOneUnavailableError("pairs");
  return arrays;
}

function solveSeparation(writer: MoveWriter, parity: number) {
  const { distance } = separateDistances();
  const list = macros();
  let remaining = parity;
  const nodeOf = (edges: number[], corners: number[], parityBit: number) => {
    const topMask = (arrangement: number[]) =>
      arrangement.reduce((mask, piece, position) => (piece < 4 ? mask | (1 << position) : mask), 0);
    return maskNode(topMask(edges), topMask(corners), signOf(edges), signOf(corners), parityBit);
  };
  for (;;) {
    const { edges, corners } = readPairs(writer);
    const current = distance[nodeOf(edges, corners, remaining)];
    if (current === 255) throw new SquareOneUnavailableError("separate");
    if (current === 0) return remaining;
    let best: { macro: Macro; top: number; bottom: number } | null = null;
    let bestSize = Infinity;
    for (let top = 0; top < 4; top += 1) {
      for (let bottom = 0; bottom < 4; bottom += 1) {
        const turnedEdges = turnPairs(edges, top, bottom);
        const turnedCorners = turnPairs(corners, top, bottom);
        for (const macro of list) {
          const next = nodeOf(
            applyPositions(turnedEdges, macro.edges),
            applyPositions(turnedCorners, macro.corners),
            remaining ^ (macro.cost & 1)
          );
          if (distance[next] + macro.cost !== current) continue;
          const size = top + bottom;
          if (size < bestSize) {
            bestSize = size;
            best = { macro, top, bottom };
          }
        }
      }
    }
    if (!best) throw new SquareOneUnavailableError("separate");
    playMacro(writer, best.macro, best.top, best.bottom);
    remaining ^= best.macro.cost & 1;
  }
}

function solveLayers(writer: MoveWriter, parity: number) {
  const { distance, generators, turns } = layerDistances();
  let remaining = parity;
  for (;;) {
    const { edges, corners } = readPairs(writer);
    const indexOf = (e: readonly number[], c: readonly number[], parityBit: number) =>
      stateIndex(arrangementIndex(e), arrangementIndex(c), parityBit);
    const current = distance[indexOf(edges, corners, remaining)];
    if (current === 255) throw new SquareOneUnavailableError("permute");
    let best: { generator: LayerGenerator | null; top: number; bottom: number } | null = null;
    let bestSize = Infinity;
    for (let top = 0; top < 4; top += 1) {
      for (let bottom = 0; bottom < 4; bottom += 1) {
        const turnedEdges = turnPairs(edges, top, bottom);
        const turnedCorners = turnPairs(corners, top, bottom);
        if (current === 0) {
          if (arrangementIndex(turnedEdges) === arrangementIndex(identity8) && arrangementIndex(turnedCorners) === arrangementIndex(identity8)) {
            best = { generator: null, top, bottom };
            bestSize = 0;
          }
          continue;
        }
        const edgeIndex = arrangementIndex(turnedEdges);
        const cornerIndex = arrangementIndex(turnedCorners);
        for (const generator of generators) {
          const next = stateIndex(
            generator.edges[edgeIndex],
            generator.corners[cornerIndex],
            remaining ^ (generator.cost & 1)
          );
          if (distance[next] + generator.cost !== current) continue;
          const size = top + bottom;
          if (size < bestSize) {
            bestSize = size;
            best = { generator, top, bottom };
          }
        }
      }
    }
    if (!best) throw new SquareOneUnavailableError("permute");
    if (!best.generator) {
      writer.turn(best.top * 3, best.bottom * 3);
      return;
    }
    playMacro(writer, best.generator.macro, best.top, best.bottom);
    remaining ^= best.generator.cost & 1;
  }
}

// Sizes of the lookup tables, for tests and for the notes in docs/validation.
export function squareOneTableStats() {
  const shapes = shapeDistances();
  const layers = layerDistances().distance;
  let shapeStates = 0;
  let maxShape = 0;
  for (const value of shapes) {
    if (value === 255) continue;
    shapeStates += 1;
    maxShape = Math.max(maxShape, value);
  }
  let layerStates = 0;
  let maxLayer = 0;
  for (const value of layers) {
    if (value === 255) continue;
    layerStates += 1;
    maxLayer = Math.max(maxLayer, value);
  }
  const list = macros();
  return {
    shapeStates,
    maxShape,
    layerStates,
    maxLayer,
    layerStatesTotal: layers.length,
    macros: list.length,
    parityMacros: list.filter(macro => macro.cost === 7).length,
  };
}

export type SquareOneSolveOptions = { equatorFlipped?: boolean };

// Solves a state given as cubing's wedge arrangement. `equatorFlipped` is true
// when the middle layer is flipped, which needs an odd number of slices.
export function solveSquareOneState(state: readonly number[], options: SquareOneSolveOptions = {}) {
  assertSquareOneState(state);
  const writer = new MoveWriter(state.slice());
  const flipped = options.equatorFlipped ? 1 : 0;
  solveShape(writer);
  alignCube(writer);
  writer.endPhase("Cube Shape");
  const parity = (flipped + writer.slices) & 1;
  const remaining = solveSeparation(writer, parity);
  writer.endPhase("Separate Layers");
  solveLayers(writer, remaining);
  writer.endPhase("Permute");
  if (!writer.state.every((wedge, index) => wedge === index)) throw new SquareOneUnavailableError("verify");
  return writer.finish();
}

export { SquareOneStateError };
