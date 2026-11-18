import { describe, expect, it } from "vitest";
import {
  DEFAULT_LAYER_SELECTION,
  SOLVED_FAST_STATE,
  facesUniform,
  inspectionPenalty,
  layerSelectionForKey,
  normalizePlayKey,
  playActionForKey,
} from "./playCube";
import { applyFastMoves, stateFromScramble } from "./fastCube";

const sel = (oSl: number, oSr: number) => ({ oSl, oSr });

describe("normalizePlayKey", () => {
  it("normalizes letters to lowercase and keeps punctuation", () => {
    expect(normalizePlayKey({ key: "I" })).toBe("i");
    expect(normalizePlayKey({ key: ";" })).toBe(";");
    expect(normalizePlayKey({ key: "," })).toBe(",");
    expect(normalizePlayKey({ key: "." })).toBe(".");
    expect(normalizePlayKey({ key: "/" })).toBe("/");
    expect(normalizePlayKey({ key: "9" })).toBe("9");
  });

  it("maps space and arrows and Escape", () => {
    expect(normalizePlayKey({ key: " " })).toBe(" ");
    expect(normalizePlayKey({ key: "ArrowUp" })).toBe("arrowup");
    expect(normalizePlayKey({ key: "Escape" })).toBe("escape");
  });

  it("ignores modifier combinations", () => {
    expect(normalizePlayKey({ key: "i", ctrlKey: true })).toBeNull();
    expect(normalizePlayKey({ key: "i", altKey: true })).toBeNull();
    expect(normalizePlayKey({ key: "i", metaKey: true })).toBeNull();
  });
});

describe("playActionForKey — csTimer table", () => {
  it("maps the right hand to R/U/F moves", () => {
    expect(playActionForKey("i", sel(1, 1))).toMatchObject({ move: "R", rotation: false });
    expect(playActionForKey("k", sel(1, 1))).toMatchObject({ move: "R'" });
    expect(playActionForKey("j", sel(1, 1))).toMatchObject({ move: "U" });
    expect(playActionForKey("f", sel(1, 1))).toMatchObject({ move: "U'" });
    expect(playActionForKey("h", sel(1, 1))).toMatchObject({ move: "F" });
    expect(playActionForKey("g", sel(1, 1))).toMatchObject({ move: "F'" });
  });

  it("maps the left hand to L/D/B moves", () => {
    expect(playActionForKey("d", sel(1, 1))).toMatchObject({ move: "L" });
    expect(playActionForKey("e", sel(1, 1))).toMatchObject({ move: "L'" });
    expect(playActionForKey("s", sel(1, 1))).toMatchObject({ move: "D" });
    expect(playActionForKey("l", sel(1, 1))).toMatchObject({ move: "D'" });
    expect(playActionForKey("w", sel(1, 1))).toMatchObject({ move: "B" });
    expect(playActionForKey("o", sel(1, 1))).toMatchObject({ move: "B'" });
  });

  it("widens side face moves when the layer is extended", () => {
    expect(playActionForKey("i", sel(1, 2))).toMatchObject({ move: "r" });
    expect(playActionForKey("k", sel(1, 2))).toMatchObject({ move: "r'" });
    expect(playActionForKey("d", sel(2, 1))).toMatchObject({ move: "l" });
    expect(playActionForKey("e", sel(2, 1))).toMatchObject({ move: "l'" });
  });

  it("escalates wide keys to full rotations at max selection", () => {
    expect(playActionForKey("u", sel(1, 1))).toMatchObject({ move: "r", rotation: false });
    expect(playActionForKey("u", sel(1, 2))).toMatchObject({ move: "x", rotation: true });
    expect(playActionForKey("m", sel(1, 2))).toMatchObject({ move: "x'", rotation: true });
    expect(playActionForKey("r", sel(2, 1))).toMatchObject({ move: "x", rotation: true });
    expect(playActionForKey("v", sel(2, 1))).toMatchObject({ move: "x'", rotation: true });
  });

  it("maps wide, slice and rotation moves", () => {
    expect(playActionForKey(",", sel(1, 1))).toMatchObject({ move: "u" });
    expect(playActionForKey("c", sel(1, 1))).toMatchObject({ move: "u'" });
    expect(playActionForKey("z", sel(1, 1))).toMatchObject({ move: "d" });
    expect(playActionForKey("/", sel(1, 1))).toMatchObject({ move: "d'" });
    expect(playActionForKey(".", sel(1, 1))).toMatchObject({ move: "M'" });
    expect(playActionForKey("x", sel(1, 1))).toMatchObject({ move: "M'" });
    expect(playActionForKey("5", sel(1, 1))).toMatchObject({ move: "M" });
    expect(playActionForKey("6", sel(1, 1))).toMatchObject({ move: "M" });
    expect(playActionForKey("1", sel(1, 1))).toMatchObject({ move: "S'" });
    expect(playActionForKey("0", sel(1, 1))).toMatchObject({ move: "S" });
    expect(playActionForKey("2", sel(1, 1))).toMatchObject({ move: "E" });
    expect(playActionForKey("9", sel(1, 1))).toMatchObject({ move: "E'" });
    expect(playActionForKey(";", sel(1, 1))).toMatchObject({ move: "y", rotation: true });
    expect(playActionForKey("a", sel(1, 1))).toMatchObject({ move: "y'", rotation: true });
    expect(playActionForKey("t", sel(1, 1))).toMatchObject({ move: "x", rotation: true });
    expect(playActionForKey("y", sel(1, 1))).toMatchObject({ move: "x", rotation: true });
    expect(playActionForKey("n", sel(1, 1))).toMatchObject({ move: "x'", rotation: true });
    expect(playActionForKey("b", sel(1, 1))).toMatchObject({ move: "x'", rotation: true });
    expect(playActionForKey("p", sel(1, 1))).toMatchObject({ move: "z", rotation: true });
    expect(playActionForKey("q", sel(1, 1))).toMatchObject({ move: "z'", rotation: true });
  });

  it("returns layers, camera nudges, space and escape without touching moves", () => {
    expect(playActionForKey("3", sel(2, 1))).toEqual({ kind: "layer", selection: { oSl: 1, oSr: 1 } });
    expect(playActionForKey("4", sel(1, 1))).toEqual({ kind: "layer", selection: { oSl: 2, oSr: 1 } });
    expect(playActionForKey("7", sel(1, 1))).toEqual({ kind: "layer", selection: { oSl: 1, oSr: 2 } });
    expect(playActionForKey("8", sel(1, 2))).toEqual({ kind: "layer", selection: { oSl: 1, oSr: 1 } });
    expect(playActionForKey("arrowleft", sel(1, 1))).toEqual({ kind: "camera", yaw: -1, pitch: 0 });
    expect(playActionForKey("arrowup", sel(1, 1))).toEqual({ kind: "camera", yaw: 0, pitch: 1 });
    expect(playActionForKey(" ", sel(1, 1))).toEqual({ kind: "space" });
    expect(playActionForKey("escape", sel(1, 1))).toEqual({ kind: "escape" });
  });

  it("returns null for unmapped keys", () => {
    expect(playActionForKey("!", sel(1, 1))).toBeNull();
    expect(playActionForKey("enter", sel(1, 1))).toBeNull();
  });
});

describe("layerSelectionForKey", () => {
  it("clamps the selection to 1..2 and resets on space", () => {
    expect(layerSelectionForKey(sel(1, 1), "4")).toEqual(sel(2, 1));
    expect(layerSelectionForKey(sel(2, 1), "4")).toEqual(sel(2, 1));
    expect(layerSelectionForKey(sel(1, 1), "3")).toEqual(sel(1, 1));
    expect(layerSelectionForKey(sel(1, 2), "7")).toEqual(sel(1, 2));
    expect(layerSelectionForKey(sel(1, 2), "8")).toEqual(sel(1, 1));
    expect(layerSelectionForKey(sel(2, 2), " ")).toEqual(DEFAULT_LAYER_SELECTION);
  });
});

describe("facesUniform", () => {
  it("is true for the solved cube", () => {
    expect(facesUniform(SOLVED_FAST_STATE)).toBe(true);
  });

  it("is true after a whole-cube rotation (the solved check must ignore orientation)", () => {
    expect(facesUniform(applyFastMoves(SOLVED_FAST_STATE, "y"))).toBe(true);
    expect(facesUniform(applyFastMoves(SOLVED_FAST_STATE, "x2 z'"))).toBe(true);
  });

  it("is false for a scrambled cube and for truncated input", () => {
    expect(facesUniform(stateFromScramble("R U R' U'"))).toBe(false);
    expect(facesUniform(SOLVED_FAST_STATE.slice(0, 20))).toBe(false);
    expect(facesUniform("")).toBe(false);
  });
});

describe("inspectionPenalty", () => {
  it("follows WCA: DNF over 17s, +2 over 15s", () => {
    expect(inspectionPenalty(0)).toBe("none");
    expect(inspectionPenalty(15_000)).toBe("none");
    expect(inspectionPenalty(15_001)).toBe("+2");
    expect(inspectionPenalty(17_000)).toBe("+2");
    expect(inspectionPenalty(17_001)).toBe("DNF");
  });
});
