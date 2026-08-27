import { describe, expect, it } from "vitest";
import { distanceFromPinch, ftoTargetMarkerPositions, inertiaStep, orbitFromDrag } from "./Puzzle3DCanvas";

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

  it("maps each FTO guide target to visible marker positions", () => {
    expect(ftoTargetMarkerPositions("up-edges")).toHaveLength(3);
    expect(ftoTargetMarkerPositions("middle-edges")).toHaveLength(2);
    expect(ftoTargetMarkerPositions("vertices")).toHaveLength(3);
    expect(ftoTargetMarkerPositions("centres")).toHaveLength(2);
  });
});
