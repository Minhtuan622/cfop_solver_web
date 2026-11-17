/**
 * Validates a 54-sticker facelet state (U R F D L B, row-major per face).
 *
 * Direct TypeScript port of the Python `cfop_solver/cube.py` geometry and
 * `cfop_solver/validation.py` (`validate_cube`): cube state checks (sticker
 * counts, fixed centers, cubie color signatures, corner/edge orientation
 * sums, permutation parity) without needing Pyodide. Used by the Home page
 * to validate hand-painted cube states before solving.
 */

export type CubeValidation = { valid: boolean; message: string };

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;
const SOLVED = FACE_ORDER.map(face => face.repeat(9)).join("");

type Vec = [number, number, number];
const FACE_NORMAL: Record<string, Vec> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};
const FACE_RIGHT: Record<string, Vec> = {
  U: [1, 0, 0],
  R: [0, 0, -1],
  F: [1, 0, 0],
  D: [1, 0, 0],
  L: [0, 0, 1],
  B: [-1, 0, 0],
};
const FACE_UP: Record<string, Vec> = {
  U: [0, 0, -1],
  R: [0, 1, 0],
  F: [0, 1, 0],
  D: [0, 0, 1],
  L: [0, 1, 0],
  B: [0, 1, 0],
};
const CORNER_POSITIONS: readonly Vec[] = [
  [1, 1, 1],
  [-1, 1, 1],
  [-1, 1, -1],
  [1, 1, -1],
  [1, -1, 1],
  [-1, -1, 1],
  [-1, -1, -1],
  [1, -1, -1],
];
const EDGE_POSITIONS: readonly Vec[] = [
  [1, 1, 0],
  [0, 1, 1],
  [-1, 1, 0],
  [0, 1, -1],
  [1, -1, 0],
  [0, -1, 1],
  [-1, -1, 0],
  [0, -1, -1],
  [1, 0, 1],
  [-1, 0, 1],
  [-1, 0, -1],
  [1, 0, -1],
];
/** The three facelets of each corner, indexed by slot, in reference order. */
const CORNER_FACELETS: readonly [number, number, number][] = [
  [8, 9, 20],
  [6, 18, 38],
  [0, 36, 47],
  [2, 45, 11],
  [29, 26, 15],
  [27, 44, 24],
  [33, 53, 42],
  [35, 17, 51],
];
/** The two facelets of each edge, indexed by slot, in reference order. */
const EDGE_FACELETS: readonly [number, number][] = [
  [5, 10],
  [7, 19],
  [3, 37],
  [1, 46],
  [32, 16],
  [28, 25],
  [30, 43],
  [34, 52],
  [23, 12],
  [21, 41],
  [50, 39],
  [48, 14],
];
/** The two sticker colors of each edge piece, indexed by piece signature. */
const EDGE_COLORS: readonly [string, string][] = [
  ["U", "R"],
  ["U", "F"],
  ["U", "L"],
  ["U", "B"],
  ["D", "R"],
  ["D", "F"],
  ["D", "L"],
  ["D", "B"],
  ["F", "R"],
  ["F", "L"],
  ["B", "L"],
  ["B", "R"],
];

function vadd(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function vscale(v: Vec, k: number): Vec {
  return [v[0] * k, v[1] * k, v[2] * k];
}
function stickerKey(face: string, row: number, col: number): [Vec, Vec] {
  const normal = FACE_NORMAL[face]!;
  const right = FACE_RIGHT[face]!;
  const up = FACE_UP[face]!;
  const pos = vadd(
    normal,
    vadd(vscale(right, col - 1), vscale(up, 1 - row))
  );
  return [pos, normal];
}
/** For each facelet index (U R F D L B, row-major per face): its cubie position and outward normal. */
const INDEX_TO_KEY: readonly [Vec, Vec][] = (() => {
  const keys: [Vec, Vec][] = [];
  for (const face of FACE_ORDER)
    for (let row = 0; row < 3; row += 1)
      for (let col = 0; col < 3; col += 1)
        keys.push(stickerKey(face, row, col));
  return keys;
})();
const POSITION_INDICES: ReadonlyMap<string, number[]> = (() => {
  const map = new Map<string, number[]>();
  for (let index = 0; index < INDEX_TO_KEY.length; index += 1) {
    const key = INDEX_TO_KEY[index]![0].join(",");
    const list = map.get(key);
    if (list) list.push(index);
    else map.set(key, [index]);
  }
  return map;
})();

function keyOf(colors: Set<string>) {
  return [...colors].sort().join("");
}
/** Map from a sorted set of sticker colors to the piece index, per cubie slot order. */
function solvedSignatures(
  positions: readonly Vec[]
): Map<string, number> {
  const map = new Map<string, number>();
  for (let index = 0; index < positions.length; index += 1) {
    const indices = POSITION_INDICES.get(positions[index]!.join(","))!;
    const colors = new Set(indices.map(i => SOLVED[i]!));
    map.set(keyOf(colors), index);
  }
  return map;
}
const CORNER_SIGNATURES = solvedSignatures(CORNER_POSITIONS);
const EDGE_SIGNATURES = solvedSignatures(EDGE_POSITIONS);

export type CubieView = {
  cornerPerm: number[];
  cornerOri: number[];
  edgePerm: number[];
  edgeOri: number[];
};

function validateFacelets(stickers: string) {
  if (stickers.length !== 54)
    throw new Error("Cube state must have 54 stickers");
  const allowed = new Set<string>(FACE_ORDER);
  const unknown = [...new Set(stickers)].filter(c => !allowed.has(c));
  if (unknown.length)
    throw new Error(
      `Unknown colors; expected only [${[...allowed]
        .sort()
        .map(c => `'${c}'`)
        .join(", ")}]`
    );
  for (const face of FACE_ORDER) {
    if (stickers.split("").filter(c => c === face).length !== 9)
      throw new Error(`Color ${face} must appear exactly 9 times`);
    const center = stickers[FACE_ORDER.indexOf(face) * 9 + 4];
    if (center !== face)
      throw new Error(
        `Center mismatch on ${face}: got ${center}; input must use U R F D L B center order`
      );
  }
}

function viewOf(stickers: string): CubieView {
  const cornerPerm: number[] = [];
  const cornerOri: number[] = [];
  const edgePerm: number[] = [];
  const edgeOri: number[] = [];
  for (let slot = 0; slot < CORNER_POSITIONS.length; slot += 1) {
    const pos = CORNER_POSITIONS[slot]!;
    const indices = POSITION_INDICES.get(pos.join(","))!;
    const colors = new Set(indices.map(i => stickers[i]!));
    const piece = colors.size === 3 ? CORNER_SIGNATURES.get(keyOf(colors)) : undefined;
    if (piece === undefined)
      throw new Error(
        `Invalid corner colors at ${pos.join(",")}: ${keyOf(colors)}`
      );
    cornerPerm.push(piece);
    const reference = CORNER_FACELETS[slot]!;
    cornerOri.push(
      reference.findIndex(index => stickers[index] === "U" || stickers[index] === "D")
    );
  }
  for (let slot = 0; slot < EDGE_POSITIONS.length; slot += 1) {
    const pos = EDGE_POSITIONS[slot]!;
    const indices = POSITION_INDICES.get(pos.join(","))!;
    const colors = new Set(indices.map(i => stickers[i]!));
    const piece = colors.size === 2 ? EDGE_SIGNATURES.get(keyOf(colors)) : undefined;
    if (piece === undefined)
      throw new Error(
        `Invalid edge colors at ${pos.join(",")}: ${keyOf(colors)}`
      );
    edgePerm.push(piece);
    const [refA, refB] = EDGE_FACELETS[slot]!;
    const [expectedA, expectedB] = EDGE_COLORS[piece]!;
    if (stickers[refA] === expectedA && stickers[refB] === expectedB)
      edgeOri.push(0);
    else if (stickers[refA] === expectedB && stickers[refB] === expectedA)
      edgeOri.push(1);
    else
      throw new Error(`Invalid edge orientation at ${pos.join(",")}`);
  }
  return { cornerPerm, cornerOri, edgePerm, edgeOri };
}

function permutationParity(values: readonly number[]): 0 | 1 {
  let inversions = 0;
  for (let i = 0; i < values.length; i += 1)
    for (let j = i + 1; j < values.length; j += 1)
      if (values[i]! > values[j]!) inversions += 1;
  return (inversions % 2) as 0 | 1;
}

/** Throws `Error` with the same wording as the Python validator when the state is illegal. */
export function assertValidCubeState(stickers: string): void {
  validateFacelets(stickers);
  const view = viewOf(stickers);
  if (new Set(view.cornerPerm).size !== 8 || new Set(view.edgePerm).size !== 12)
    throw new Error("Duplicate or missing cubie");
  if (view.cornerOri.reduce((sum, ori) => sum + ori, 0) % 3)
    throw new Error("Corner orientation sum is not divisible by 3");
  if (view.edgeOri.reduce((sum, ori) => sum + ori, 0) % 2)
    throw new Error("Edge orientation sum is not even");
  if (permutationParity(view.cornerPerm) !== permutationParity(view.edgePerm))
    throw new Error("Corner and edge permutation parity mismatch");
}

/** Non-throwing variant used by the UI: `{ valid, message }`. */
export function validateCubeState(stickers: string): CubeValidation {
  try {
    assertValidCubeState(stickers);
    return { valid: true, message: "Trạng thái hợp lệ · 54 sticker · 9 mỗi màu" };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}
