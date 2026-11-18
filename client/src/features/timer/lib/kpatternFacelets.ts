/**
 * KPattern → facelet string conversion for the 3×3×3.
 *
 * cubing.js tracks a solved-relative piece/orientation model; the app
 * renders cube state as a 54-character URFDLB facelet string. This module
 * bridges the two. The mapping tables below derive from the puzzle's own
 * geometry (Reid cubie naming) and were verified exhaustively against the
 * app's fastCube model over random scrambles (see kpatternFacelets.test).
 */
import type { KPattern } from "cubing/kpuzzle";

/** Reid cubie order — matches cubing.js's orbit position order. */
const REID_CORNERS = [
  "UFR", "URB", "UBL", "ULF", "DRF", "DFL", "DLB", "DBR",
] as const;
const REID_EDGES = [
  "UF", "UR", "UB", "UL", "DF", "DR", "DB", "DL", "FR", "FL", "BR", "BL",
] as const;
const CENTER_LETTERS = ["U", "L", "F", "R", "B", "D"] as const;

/**
 * Facelet indices (URFDLB order, row-major from outside each face) of the
 * stickers at each orbit position, in slot order (letter order of the
 * cubie's Reid name).
 */
const CORNER_SLOTS = [
  [8, 20, 9], // UFR (U,F,R)
  [2, 11, 45], // URB (U,R,B)
  [0, 47, 36], // UBL (U,B,L)
  [6, 38, 18], // ULF (U,L,F)
  [29, 15, 26], // DRF (D,R,F)
  [27, 24, 44], // DFL (D,F,L)
  [33, 42, 53], // DLB (D,L,B)
  [35, 51, 17], // DBR (D,B,R)
] as const;
const EDGE_SLOTS = [
  [7, 19], // UF (U,F)
  [5, 10], // UR (U,R)
  [1, 46], // UB (U,B)
  [3, 37], // UL (U,L)
  [28, 25], // DF (D,F)
  [32, 16], // DR (D,R)
  [34, 52], // DB (D,B)
  [30, 43], // DL (D,L)
  [23, 12], // FR (F,R)
  [21, 41], // FL (F,L)
  [48, 14], // BR (B,R)
  [50, 39], // BL (B,L)
] as const;
const CENTER_SLOTS = [4, 40, 22, 13, 49, 31] as const; // U L F R B D

function rotateLeft(value: string, offset: number): string {
  return value.slice(offset) + value.slice(0, offset);
}

/** Convert a 3×3×3 KPattern to the app's 54-character URFDLB facelet string. */
export function kpatternToFacelets(pattern: KPattern): string {
  const { CORNERS, EDGES, CENTERS } = pattern.patternData;
  const facelets = new Array<string>(54).fill("U");

  for (let position = 0; position < 8; position += 1) {
    const piece = CORNERS.pieces[position]!;
    const orientation = CORNERS.orientation[position]!;
    const rotated = rotateLeft(REID_CORNERS[piece], orientation);
    const slots = CORNER_SLOTS[position]!;
    for (let slot = 0; slot < 3; slot += 1) {
      facelets[slots[slot]!] = rotated[slot]!;
    }
  }
  for (let position = 0; position < 12; position += 1) {
    const piece = EDGES.pieces[position]!;
    const orientation = EDGES.orientation[position]!;
    const rotated = rotateLeft(REID_EDGES[piece], orientation);
    const slots = EDGE_SLOTS[position]!;
    for (let slot = 0; slot < 2; slot += 1) {
      facelets[slots[slot]!] = rotated[slot]!;
    }
  }
  for (let position = 0; position < 6; position += 1) {
    const piece = CENTERS.pieces[position]!;
    facelets[CENTER_SLOTS[position]!] = CENTER_LETTERS[piece]!;
  }

  return facelets.join("");
}

type KPuzzle = Awaited<
  ReturnType<typeof import("cubing/puzzles")["puzzles"]["3x3x3"]["kpuzzle"]>
>;

let kpuzzlePromise: Promise<KPuzzle> | null = null;

/** Loads the 3×3×3 KPuzzle lazily (cubing.js is heavy) and caches it. */
export function getKpuzzle(): Promise<KPuzzle> {
  if (!kpuzzlePromise) {
    kpuzzlePromise = import("cubing/puzzles").then(
      mod => mod.puzzles["3x3x3"].kpuzzle(),
    );
  }
  return kpuzzlePromise;
}

let SOLVED_PATTERN: KPattern | null = null;

/** The solved 3×3×3 pattern, loaded lazily. */
export async function getSolvedPattern(): Promise<KPattern> {
  if (!SOLVED_PATTERN) {
    SOLVED_PATTERN = (await getKpuzzle()).defaultPattern();
  }
  return SOLVED_PATTERN;
}

/** The pattern reached by applying an algorithm to the solved cube. */
export async function patternFromAlg(alg: string): Promise<KPattern> {
  const { Alg } = await import("cubing/alg");
  return (await getKpuzzle()).defaultPattern().applyAlg(new Alg(alg));
}

/** Facelet string of the cube reached by a scramble (async). */
export async function faceletsFromAlg(alg: string): Promise<string> {
  return kpatternToFacelets(await patternFromAlg(alg));
}
