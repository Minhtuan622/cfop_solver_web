import { describe, expect, it } from "vitest";
import { distanceFromPinch, inertiaStep, inertiaStepForPuzzle, orbitFromDrag, orbitFromPuzzleDrag } from "./puzzleCamera";

describe("Puzzle3DCanvas controls", () => {
  it("moves the vertical camera axis in the same direction as the pointer", () => {
    const start = { yaw: 0, pitch: 0, distance: 6 };
    expect(orbitFromDrag(start, 0, -20).pitch).toBeLessThan(0);
    expect(orbitFromDrag(start, 0, 20).pitch).toBeGreaterThan(0);
    expect(orbitFromDrag(start, 20, 0).yaw).toBeGreaterThan(0);
  });

  it("zooms in when a pinch expands and clamps distances safely", () => {
    expect(distanceFromPinch(6, 100, 200)).toBe(3.6);
    expect(distanceFromPinch(6, 100, 40)).toBe(13);
  });

  it("keeps a light, decaying velocity after the user releases the model", () => {
    const next = inertiaStep({ yaw: 0, pitch: 0, distance: 6 }, { yaw: 0.2, pitch: -0.1 });
    expect(next.orbit.yaw).toBeGreaterThan(0);
    expect(next.orbit.pitch).toBeLessThan(0);
    expect(next.velocity.yaw).toBeLessThan(0.2);
    expect(next.velocity.pitch).toBeGreaterThan(-0.1);
  });

  it("keeps FTO drag intuitive: horizontal movement changes yaw and vertical movement changes pitch", () => {
    const start = { yaw: 0, pitch: 0, distance: 6 };
    expect(orbitFromPuzzleDrag("fto", start, 20, 0).yaw).toBeGreaterThan(0);
    expect(orbitFromPuzzleDrag("fto", start, 0, 20).pitch).toBeGreaterThan(0);
    expect(orbitFromPuzzleDrag("pyraminx", start, 20, 0).yaw).toBeGreaterThan(0);
    expect(orbitFromPuzzleDrag("pyraminx", start, 0, 20).pitch).toBeGreaterThan(0);
  });

  it("lets FTO rotate freely on the vertical axis but clamps its horizontal orbit, including inertia", () => {
    const start = { yaw: 0, pitch: 0, distance: 6 };
    expect(orbitFromPuzzleDrag("fto", start, 10_000, 0).yaw).toBeLessThanOrEqual(1.35);
    expect(orbitFromPuzzleDrag("fto", start, 0, 10_000).pitch).toBeGreaterThan(100);
    const inertial = inertiaStepForPuzzle("fto", { yaw: 1.34, pitch: 4, distance: 6 }, { yaw: 1, pitch: 1 });
    expect(inertial.orbit.yaw).toBeLessThanOrEqual(1.35);
    expect(inertial.orbit.pitch).toBeGreaterThan(4);
  });

});
