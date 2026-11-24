export type PuzzleId =
  | "2x2x2"
  | "3x3x3"
  | "4x4x4"
  | "5x5x5"
  | "6x6x6"
  | "7x7x7"
  | "pyraminx"
  | "skewb"
  | "megaminx"
  | "fto"
  | "square1"
  | "clock";

export type SideEventPuzzle = "square1" | "clock";

export type FtoTeachingFace = "white" | "orange";

export function isSideEvent2DPuzzle(
  puzzle: string
): puzzle is SideEventPuzzle {
  return puzzle === "square1" || puzzle === "clock";
}

export function isCubeFamilyPuzzle(puzzle: string): boolean {
  return /^[234567]x[234567]x[234567]$/.test(puzzle);
}
