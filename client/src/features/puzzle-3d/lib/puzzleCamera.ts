import type { PuzzleId } from "./puzzleIds";

export type PuzzleOrbit = { yaw: number; pitch: number; distance: number };
export type Point = { x: number; y: number };

export const CAMERA_LIMITS = { min: 3.6, max: 13, pitch: 1.1 };
const FTO_HORIZONTAL_YAW_LIMIT = 1.35;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function clampDistance(distance: number) {
  return clamp(distance, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
}

export function orbitFromDrag(start: PuzzleOrbit, deltaX: number, deltaY: number): PuzzleOrbit {
  return {
    ...start,
    yaw: start.yaw + deltaX * 0.012,
    pitch: clamp(start.pitch + deltaY * 0.012, -CAMERA_LIMITS.pitch, CAMERA_LIMITS.pitch),
  };
}

/** Keep drag direction intuitive even though the FTO model is rolled to show its white face on the left. */
export function orbitFromPuzzleDrag(puzzle: PuzzleId, start: PuzzleOrbit, deltaX: number, deltaY: number): PuzzleOrbit {
  if (puzzle === "fto") return {
    ...start,
    yaw: clamp(start.yaw + deltaX * 0.012, -FTO_HORIZONTAL_YAW_LIMIT, FTO_HORIZONTAL_YAW_LIMIT),
    pitch: start.pitch + deltaY * 0.012,
  };
  return orbitFromDrag(start, deltaX, deltaY);
}

export function distanceFromPinch(startDistance: number, startGap: number, currentGap: number) {
  if (startGap <= 0 || currentGap <= 0) return clampDistance(startDistance);
  return clampDistance(startDistance * (startGap / currentGap));
}

export function inertiaStep(orbit: PuzzleOrbit, velocity: { yaw: number; pitch: number }) {
  const nextVelocity = { yaw: velocity.yaw * 0.91, pitch: velocity.pitch * 0.91 };
  return {
    orbit: { ...orbit, yaw: orbit.yaw + nextVelocity.yaw, pitch: clamp(orbit.pitch + nextVelocity.pitch, -CAMERA_LIMITS.pitch, CAMERA_LIMITS.pitch) },
    velocity: nextVelocity,
  };
}

export function inertiaStepForPuzzle(puzzle: PuzzleId, orbit: PuzzleOrbit, velocity: { yaw: number; pitch: number }) {
  if (puzzle === "fto") {
    const nextVelocity = { yaw: velocity.yaw * 0.91, pitch: velocity.pitch * 0.91 };
    return {
      orbit: { ...orbit, yaw: clamp(orbit.yaw + nextVelocity.yaw, -FTO_HORIZONTAL_YAW_LIMIT, FTO_HORIZONTAL_YAW_LIMIT), pitch: orbit.pitch + nextVelocity.pitch },
      velocity: nextVelocity,
    };
  }
  return inertiaStep(orbit, velocity);
}

export function gapBetween([first, second]: Point[]) { return Math.hypot(first.x - second.x, first.y - second.y); }

export function defaultPuzzleCamera(puzzle: PuzzleId) {
  if (puzzle === "megaminx") return { fov: 29, distance: 6.1, height: "18rem" };
  if (puzzle === "fto") return { fov: 28, distance: 5.95, height: "17rem" };
  if (puzzle === "pyraminx") return { fov: 32, distance: 4.45, height: "16rem" };
  if (puzzle === "skewb") return { fov: 33, distance: 4.65, height: "16rem" };
  if (puzzle === "clock") return { fov: 31, distance: 7.45, height: "12rem" };
  if (puzzle === "square1") return { fov: 32, distance: 7.15, height: "13rem" };
  if (puzzle === "7x7x7") return { fov: 31, distance: 6.8, height: "15rem" };
  if (puzzle === "6x6x6") return { fov: 32, distance: 6.5, height: "15rem" };
  if (puzzle === "5x5x5") return { fov: 33, distance: 6.1, height: "14rem" };
  if (puzzle === "4x4x4") return { fov: 34, distance: 5.8, height: "14rem" };
  return { fov: 34, distance: 5.4, height: "14rem" };
}
