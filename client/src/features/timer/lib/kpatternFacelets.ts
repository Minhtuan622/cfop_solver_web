import type { KPattern } from "cubing/kpuzzle";

const REID_CORNERS = [
  "UFR", "URB", "UBL", "ULF", "DRF", "DFL", "DLB", "DBR",
] as const;
const REID_EDGES = [
  "UF", "UR", "UB", "UL", "DF", "DR", "DB", "DL", "FR", "FL", "BR", "BL",
] as const;
const CENTER_LETTERS = ["U", "L", "F", "R", "B", "D"] as const;

export const CORNER_SLOTS = [
  [8, 20, 9],
  [2, 11, 45],
  [0, 47, 36],
  [6, 38, 18],
  [29, 15, 26],
  [27, 24, 44],
  [33, 42, 53],
  [35, 51, 17],
] as const;
export const EDGE_SLOTS = [
  [7, 19],
  [5, 10],
  [1, 46],
  [3, 37],
  [28, 25],
  [32, 16],
  [34, 52],
  [30, 43],
  [23, 12],
  [21, 41],
  [48, 14],
  [50, 39],
] as const;
export const CENTER_SLOTS = [4, 40, 22, 13, 49, 31] as const;

function rotateLeft(value: string, offset: number): string {
  return value.slice(offset) + value.slice(0, offset);
}

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

export function getKpuzzle(): Promise<KPuzzle> {
  if (!kpuzzlePromise) {
    kpuzzlePromise = import("cubing/puzzles").then(
      mod => mod.puzzles["3x3x3"].kpuzzle(),
    );
  }
  return kpuzzlePromise;
}

let SOLVED_PATTERN: KPattern | null = null;

export async function getSolvedPattern(): Promise<KPattern> {
  if (!SOLVED_PATTERN) {
    SOLVED_PATTERN = (await getKpuzzle()).defaultPattern();
  }
  return SOLVED_PATTERN;
}

export async function patternFromAlg(alg: string): Promise<KPattern> {
  const { Alg } = await import("cubing/alg");
  return (await getKpuzzle()).defaultPattern().applyAlg(new Alg(alg));
}
