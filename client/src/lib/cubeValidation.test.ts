import { describe, expect, it } from "vitest";
import {
  assertValidCubeState,
  validateCubeState,
} from "./cubeValidation";
import { SOLVED_FAST_STATE } from "./fastCube";
import {
  ONE_LLL_DIRECT_CASES,
  ZBLL_DIRECT_CASES,
} from "@/features/last-layer/lib/directCaseCatalogData";

const solved = SOLVED_FAST_STATE;

describe("cubeValidation: valid states", () => {
  it("accepts the solved state", () => {
    expect(validateCubeState(solved)).toEqual({
      valid: true,
      message: "Trạng thái hợp lệ · 54 sticker · 9 mỗi màu",
    });
  });

  it("accepts every verified inverse fixture shipped with the solver", () => {
    for (const row of [...ONE_LLL_DIRECT_CASES, ...ZBLL_DIRECT_CASES])
      expect(validateCubeState(row.state).valid, row.id).toBe(true);
  });
});

describe("cubeValidation: facelet checks", () => {
  it("rejects the wrong sticker count", () => {
    const invalid = `${"U".repeat(10)}${solved.slice(9)}`;
    expect(invalid.length).toBe(55);
    expect(validateCubeState(invalid).message).toMatch(/54 stickers/);
  });

  it("rejects unknown colors", () => {
    const invalid = `${solved.slice(0, 18)}XX${solved.slice(20)}`;
    expect(validateCubeState(invalid).message).toMatch(/Unknown colors/);
  });

  it("rejects a color with the wrong count", () => {
    const invalid = solved.replace(/^U/, "F");
    expect(validateCubeState(invalid).message).toMatch(
      /Color U must appear exactly 9 times/
    );
  });

  it("rejects a center mismatch", () => {
    const chars = solved.split("");
    [chars[4], chars[13]] = [chars[13]!, chars[4]!]; // U center <-> R center
    expect(validateCubeState(chars.join("")).message).toMatch(/Center mismatch/);
  });
});

describe("cubeValidation: cubie checks", () => {
  it("rejects an edge flip", () => {
    const chars = solved.split("");
    [chars[5], chars[10]] = [chars[10]!, chars[5]!];
    expect(validateCubeState(chars.join("")).message).toMatch(
      /Edge orientation sum is not even/
    );
  });

  it("rejects a parity mismatch (two swapped corners)", () => {
    const chars = solved.split("");
    // swap the UFR and UFL corner cubies in full (3 facelets each)
    for (const [a, b] of [
      [8, 6],
      [9, 18],
      [20, 38],
    ] as const)
      [chars[a], chars[b]] = [chars[b]!, chars[a]!];
    expect(validateCubeState(chars.join("")).message).toMatch(/parity/);
  });
});
