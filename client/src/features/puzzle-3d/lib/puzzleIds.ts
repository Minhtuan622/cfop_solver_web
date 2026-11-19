/** Every puzzle the 3D canvas can render. */
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

/**
 * Square-1 and Clock only have 2D support in Cubing.js (KPuzzle + SVG), so
 * they use the 2D preview while every other event uses the 3D player.
 */
export type SideEventPuzzle = "square1" | "clock";

/** The face a teaching preview focuses on. */
export type FtoTeachingFace = "white" | "orange";

/**
 * Square-1 and Clock are rendered with the Cubing.js 2D visualization. This
 * module deliberately imports nothing, so the predicate can be shared without
 * dragging Three.js or Cubing into the eager chunk.
 */
export function isSideEvent2DPuzzle(
  puzzle: string
): puzzle is SideEventPuzzle {
  return puzzle === "square1" || puzzle === "clock";
}

/**
 * N×N cubes share Cubing.js's six sticker materials. The studio renders
 * those in the z2 scheme (yellow up, red left, orange right), matching
 * the 2D diagrams.
 */
export function isCubeFamilyPuzzle(puzzle: string): boolean {
  return /^[234567]x[234567]x[234567]$/.test(puzzle);
}
