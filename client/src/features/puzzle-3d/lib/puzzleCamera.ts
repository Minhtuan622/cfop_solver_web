import type { PuzzleId } from "./puzzleIds";

export type PuzzleOrbit = { yaw: number; pitch: number; distance: number };
export type PointerPoint = { x: number; y: number };
export type ProjectedPoint = { x: number; y: number; z: number };

export const CAMERA_LIMITS = { min: 2.8, max: 13, pitch: 1.1 };
export const CAMERA_FILL = 0.9;
const FTO_HORIZONTAL_YAW_LIMIT = 1.35;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function clampDistance(distance: number) {
  return clamp(distance, CAMERA_LIMITS.min, CAMERA_LIMITS.max);
}

export function fitDistanceForPoints(
  points: readonly ProjectedPoint[],
  fov: number,
  aspect: number,
  fill = CAMERA_FILL
) {
  if (!points.length) return CAMERA_LIMITS.max;
  const tanVertical = Math.tan((fov * Math.PI) / 360);
  const tanHorizontal = tanVertical * Math.max(0.01, aspect);
  const screenFill = clamp(fill, 0.1, 1);
  let distance = 0;
  for (const point of points) {
    distance = Math.max(
      distance,
      point.z + Math.abs(point.x) / (screenFill * tanHorizontal),
      point.z + Math.abs(point.y) / (screenFill * tanVertical)
    );
  }
  return clampDistance(distance);
}

export function orbitFromDrag(start: PuzzleOrbit, deltaX: number, deltaY: number): PuzzleOrbit {
  return {
    ...start,
    yaw: start.yaw + deltaX * 0.012,
    pitch: clamp(start.pitch + deltaY * 0.012, -CAMERA_LIMITS.pitch, CAMERA_LIMITS.pitch),
  };
}

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

export function gapBetween([first, second]: PointerPoint[]) { return Math.hypot(first.x - second.x, first.y - second.y); }

export function defaultPuzzleCamera(puzzle: PuzzleId) {
  if (puzzle === "megaminx") return { fov: 29, distance: 6.1 };
  if (puzzle === "fto") return { fov: 28, distance: 5.95 };
  if (puzzle === "pyraminx") return { fov: 32, distance: 4.45 };
  if (puzzle === "skewb") return { fov: 33, distance: 4.65 };
  if (puzzle === "clock") return { fov: 31, distance: 7.45 };
  if (puzzle === "square1") return { fov: 32, distance: 7.15 };
  if (puzzle === "7x7x7") return { fov: 31, distance: 6.8 };
  if (puzzle === "3x3x3") return { fov: 34, distance: 5.4 };
  if (puzzle === "2x2x2") return { fov: 34, distance: 4.6 };
  if (puzzle === "6x6x6") return { fov: 32, distance: 6.5 };
  if (puzzle === "5x5x5") return { fov: 33, distance: 6.1 };
  if (puzzle === "4x4x4") return { fov: 34, distance: 5.8 };
  return { fov: 34, distance: 5.4 };
}
