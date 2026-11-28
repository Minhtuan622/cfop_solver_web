// Square-1 state model shared by the solver and the 3D view.
//
// A state is the same 24-slot wedge arrangement that cubing's `square1` kpuzzle
// uses: slots 0-11 are the top layer and slots 12-23 the bottom layer, both read
// in the same direction. In the solved state the top layer reads corner, corner,
// edge, corner, corner, edge, ... and the bottom layer reads edge, corner,
// corner, edge, ... (the bottom slots run against the top ones, so the two
// layers line up as a cube). A turn
// `(a,b)` moves the top layer by `a` slots and the bottom layer by `b` slots;
// `/` swaps slots 6-11 with slots 12-17.

export const SQ1_SLOTS = 24;
export const SQ1_LAYER = 12;

export type SquareOneToken = { top: number; bottom: number; slice: boolean };

export class SquareOneStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SquareOneStateError";
  }
}

export const SQ1_SOLVED: readonly number[] = Array.from({ length: SQ1_SLOTS }, (_, index) => index);

export const mod12 = (value: number) => ((value % 12) + 12) % 12;

// Keeps a turn in the usual -5..6 range.
export const normalizeTurn = (value: number) => {
  const wrapped = mod12(value);
  return wrapped > 6 ? wrapped - 12 : wrapped;
};

// 0 first half of a corner, 1 second half of a corner, 2 edge.
export const wedgeKind = (wedge: number) => (wedge + (wedge < SQ1_LAYER ? 0 : 2)) % 3;

export function turnLayers(state: readonly number[], top: number, bottom: number) {
  const next = state.slice();
  for (let index = 0; index < SQ1_LAYER; index += 1) {
    next[index] = state[mod12(index - top)];
    next[SQ1_LAYER + index] = state[SQ1_LAYER + mod12(index - bottom)];
  }
  return next;
}

export function sliceState(state: readonly number[]) {
  const next = state.slice();
  for (let index = 0; index < 6; index += 1) {
    next[6 + index] = state[SQ1_LAYER + index];
    next[SQ1_LAYER + index] = state[6 + index];
  }
  return next;
}

// A bit is set for the slot holding the first half of a corner.
export function layerMask(state: readonly number[], layer: 0 | 1) {
  let mask = 0;
  for (let index = 0; index < SQ1_LAYER; index += 1) {
    if (wedgeKind(state[layer * SQ1_LAYER + index]) === 0) mask |= 1 << index;
  }
  return mask;
}

// The slice cuts between slots 5/6 and 11/0 and may not split a corner.
export const maskAllowsSlice = (mask: number) => (mask & 0x820) === 0;

export function canSlice(state: readonly number[]) {
  return maskAllowsSlice(layerMask(state, 0)) && maskAllowsSlice(layerMask(state, 1));
}

// Checks that the array is a real Square-1 arrangement: every wedge once, and
// every corner half followed by its other half inside the same layer.
export function assertSquareOneState(state: readonly number[]) {
  if (state.length !== SQ1_SLOTS) throw new SquareOneStateError("length");
  const seen = new Set<number>();
  for (const wedge of state) {
    if (!Number.isInteger(wedge) || wedge < 0 || wedge >= SQ1_SLOTS || seen.has(wedge))
      throw new SquareOneStateError("wedges");
    seen.add(wedge);
  }
  for (let layer = 0; layer < 2; layer += 1) {
    for (let index = 0; index < SQ1_LAYER; index += 1) {
      const wedge = state[layer * SQ1_LAYER + index];
      const next = state[layer * SQ1_LAYER + mod12(index + 1)];
      if (wedgeKind(wedge) === 0 && next !== wedge + 1) throw new SquareOneStateError("corner");
      if (wedgeKind(wedge) === 1 && state[layer * SQ1_LAYER + mod12(index - 1)] !== wedge - 1)
        throw new SquareOneStateError("corner");
    }
  }
}

export function applyToken(state: readonly number[], token: SquareOneToken) {
  const turned = turnLayers(state, token.top, token.bottom);
  if (!token.slice) return turned;
  if (!canSlice(turned)) throw new SquareOneStateError("slice");
  return sliceState(turned);
}

export function applyTokens(state: readonly number[], tokens: readonly SquareOneToken[]) {
  return tokens.reduce<number[]>((current, token) => applyToken(current, token), state.slice());
}

export function formatToken(token: SquareOneToken) {
  return `(${normalizeTurn(token.top)},${normalizeTurn(token.bottom)})${token.slice ? "/" : ""}`;
}

const TOKEN_PATTERN = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)\s*(\/)?|\//g;

export function parseSquareOneAlg(text: string): SquareOneToken[] {
  const tokens: SquareOneToken[] = [];
  let consumed = 0;
  const trimmed = text.trim();
  for (const match of trimmed.matchAll(TOKEN_PATTERN)) {
    const between = trimmed.slice(consumed, match.index);
    if (between.trim()) throw new SquareOneStateError("syntax");
    consumed = (match.index ?? 0) + match[0].length;
    tokens.push(
      match[1] === undefined
        ? { top: 0, bottom: 0, slice: true }
        : { top: Number(match[1]), bottom: Number(match[2]), slice: Boolean(match[3]) }
    );
  }
  if (trimmed.slice(consumed).trim()) throw new SquareOneStateError("syntax");
  return tokens;
}

export function isSquareOneAlgorithm(text: string) {
  try {
    parseSquareOneAlg(text);
    return true;
  } catch {
    return false;
  }
}

export function isSquareOneSolved(state: readonly number[], equatorFlipped = false) {
  return !equatorFlipped && state.every((wedge, index) => wedge === index);
}

// Reads the layers of a state as pieces: edges and corners in order, each with
// the wedge it starts on.
export type SquareOnePiece = { kind: "edge" | "corner"; id: number; start: number; layer: 0 | 1 };

export function piecesOf(state: readonly number[]): SquareOnePiece[] {
  const pieces: SquareOnePiece[] = [];
  for (const layer of [0, 1] as const) {
    for (let index = 0; index < SQ1_LAYER; index += 1) {
      const wedge = state[layer * SQ1_LAYER + index];
      const kind = wedgeKind(wedge);
      if (kind === 1) continue;
      pieces.push({ kind: kind === 2 ? "edge" : "corner", id: wedge, start: index, layer });
    }
  }
  return pieces;
}
