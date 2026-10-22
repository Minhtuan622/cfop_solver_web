/** Every puzzle the 3D canvas can render. */
export type PuzzleId =
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

/** The two events that need the hand-built Three.js model instead of Cubing. */
export type SideEventPuzzle = "square1" | "clock";

/** The face a teaching preview focuses on. */
export type FtoTeachingFace = "white" | "orange";

/**
 * Square-1 and Clock are drawn by the custom Three.js model, every other
 * event by the Cubing player. This module deliberately imports nothing, so
 * both the eagerly loaded canvas and the lazy side-event chunk can share it
 * without dragging Three.js into the eager chunk.
 */
export function isSideEvent3DPuzzle(
  puzzle: string
): puzzle is SideEventPuzzle {
  return puzzle === "square1" || puzzle === "clock";
}
