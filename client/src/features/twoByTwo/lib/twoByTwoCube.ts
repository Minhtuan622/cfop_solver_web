/**
 * Minimal 2×2×2 facelet model (24 stickers, U R F D L B, row-major per face).
 *
 * Unlike the 3×3 `fastCube.ts`, the 2×2 has no centers and no slice moves; the
 * positions are the 8 corner cubies. Coordinates use half-edge units so the
 * outer faces sit exactly at ±0.5 from the cube centre. Move tables are
 * generated from the same coordinate geometry as the 3×3 solver model
 * (`packages/solver/cube-core/src/geometry.rs`: face normals + quarter-turn
 * rotation):
 *
 * - U, R, F, D, L, B face turns (clockwise viewed at that face)
 * - x, y, z whole-cube rotations (follows R/U/F slabs)
 *
 * `twoByTwoCaseState(algorithm)` applies the inverse algorithm to the solved
 * cube, so every shown case is guaranteed to be solved by its own algorithm.
 */

import { invertAlgorithm, parseFastMoves } from "@/lib/fastCube";

type Vec = [number, number, number];

export const TWO_BY_TWO_SOLVED = "UUUURRRRFFFFDDDDLLLLBBBB";

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"] as const;
type Face = (typeof FACE_ORDER)[number];

const FACE_NORMAL: Record<Face, Vec> = {
  U: [0, 1, 0],
  R: [1, 0, 0],
  F: [0, 0, 1],
  D: [0, -1, 0],
  L: [-1, 0, 0],
  B: [0, 0, -1],
};
const FACE_RIGHT: Record<Face, Vec> = {
  U: [1, 0, 0],
  R: [0, 0, -1],
  F: [1, 0, 0],
  D: [1, 0, 0],
  L: [0, 0, 1],
  B: [-1, 0, 0],
};
const FACE_UP: Record<Face, Vec> = {
  U: [0, 0, -1],
  R: [0, 1, 0],
  F: [0, 1, 0],
  D: [0, 0, 1],
  L: [0, 1, 0],
  B: [0, 1, 0],
};

function vadd(a: Vec, b: Vec): Vec {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}
function vscale(v: Vec, k: number): Vec {
  return [v[0] * k, v[1] * k, v[2] * k];
}
function rotateQuarter(v: Vec, axis: Vec): Vec {
  // clockwise viewed from the outward normal: −90° by the right-hand rule
  const cross: Vec = [
    axis[1] * v[2] - axis[2] * v[1],
    axis[2] * v[0] - axis[0] * v[2],
    axis[0] * v[1] - axis[1] * v[0],
  ];
  const dot = axis[0] * v[0] + axis[1] * v[1] + axis[2] * v[2];
  return vadd(vscale(axis, dot), vscale(cross, -1));
}
function rotateQuarterN(v: Vec, axis: Vec, turns: number): Vec {
  let result = v;
  for (let i = 0; i < ((turns % 4) + 4) % 4; i += 1) result = rotateQuarter(result, axis);
  return result;
}
/** Outward normal scaled to the face plane and unit corner offsets (±0.5). */
const stickerKey = (face: Face, row: number, col: number): [Vec, Vec] => {
  const normal = FACE_NORMAL[face]!;
  const right = FACE_RIGHT[face]!;
  const up = FACE_UP[face]!;
  const pos = vadd(
    vscale(normal, 0.5),
    vadd(vscale(right, col - 0.5), vscale(up, 0.5 - row)),
  );
  return [pos, normal];
};
/** For each facelet index (U R F D L B, row-major 2×2 per face): (cubie position, sticker normal). */
const INDEX_TO_KEY: readonly [Vec, Vec][] = (() => {
  const keys: [Vec, Vec][] = [];
  for (const face of FACE_ORDER)
    for (let row = 0; row < 2; row += 1)
      for (let col = 0; col < 2; col += 1) keys.push(stickerKey(face, row, col));
  return keys;
})();

function vecKey(v: Vec) {
  return v.join(",");
}

/** Rotation layer of `axis`: stickers whose cubie position satisfies pos·axis = 0.5. */
function layerPermutation(axis: Face, includeWholeCube: boolean): number[] {
  const axisVec = FACE_NORMAL[axis]!;
  const perm = Array.from({ length: 24 }, (_, i) => i);
  for (let source = 0; source < 24; source += 1) {
    const [pos, normal] = INDEX_TO_KEY[source]!;
    const coordinate = pos[0] * axisVec[0] + pos[1] * axisVec[1] + pos[2] * axisVec[2];
    if (!includeWholeCube && Math.abs(coordinate - 0.5) > 1e-6) continue;
    const newPos = rotateQuarter(pos, axisVec);
    const newNormal = rotateQuarter(normal, axisVec);
    // find the sticker whose (position, normal) matches the rotated pair
    let target = -1;
    for (let candidate = 0; candidate < INDEX_TO_KEY.length; candidate += 1) {
      const [candidatePos, candidateNormal] = INDEX_TO_KEY[candidate]!;
      if (vecKey(candidatePos) === vecKey(newPos) && vecKey(candidateNormal) === vecKey(newNormal)) {
        target = candidate;
        break;
      }
    }
    if (target < 0) throw new Error("2×2 geometry: rotated sticker not found");
    perm[source] = target;
  }
  return perm;
}

const BASE_PERMS: Record<string, number[]> = {};
for (const face of FACE_ORDER) BASE_PERMS[face] = layerPermutation(face, false);
BASE_PERMS["x"] = layerPermutation("R", true);
BASE_PERMS["y"] = layerPermutation("U", true);
BASE_PERMS["z"] = layerPermutation("F", true);

function composePermutation(first: number[], second: number[]): number[] {
  return second.map(index => first[index]!);
}
function inversePermutation(perm: number[]): number[] {
  const inverse = Array(24).fill(0);
  for (let source = 0; source < 24; source += 1) inverse[perm[source]!] = source;
  return inverse;
}

const MOVE_PERMS: Record<string, number[]> = {};
for (const [name, perm] of Object.entries(BASE_PERMS)) {
  MOVE_PERMS[name] = perm;
  MOVE_PERMS[`${name}'`] = inversePermutation(perm);
  MOVE_PERMS[`${name}2`] = composePermutation(perm, perm);
}

export function parseTwoByTwoMoves(text: string): string[] {
  return text
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function applyTwoByTwoMoves(initialState: string, text: string): string {
  let state = initialState;
  for (const move of parseTwoByTwoMoves(text)) {
    const perm = MOVE_PERMS[move];
    if (!perm) throw new Error(`Unsupported 2×2 move: ${move}`);
    const out = Array(24);
    for (let source = 0; source < 24; source += 1) out[perm[source]!] = state[source];
    state = out.join("");
  }
  return state;
}

/** The 24-facelet pre-image of `algorithm` (the inverse applied to solved). */
export function twoByTwoCaseState(algorithm: string): string {
  return applyTwoByTwoMoves(TWO_BY_TWO_SOLVED, invertAlgorithm(algorithm));
}

/** True when `algorithm` solves `state` back to the solved cube. */
export function solvesTwoByTwoCase(state: string, algorithm: string): boolean {
  return applyTwoByTwoMoves(state, algorithm) === TWO_BY_TWO_SOLVED;
}

void parseFastMoves;
void rotateQuarterN;
