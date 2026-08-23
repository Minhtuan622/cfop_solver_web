import { describe, expect, it } from "vitest";
import { SOLVED_FAST_STATE, stateFromScramble, validateRecordedSolution } from "./fastCube";

describe("validateRecordedSolution", () => {
  it("accepts a recorded sequence that exactly returns a scramble to solved", () => {
    expect(validateRecordedSolution(stateFromScramble("R U"), "U' R'")).toMatchObject({ valid: true, normalized: "U' R'" });
  });

  it("rejects a sequence that leaves the cube unsolved", () => {
    expect(validateRecordedSolution(stateFromScramble("R U"), "U'")).toMatchObject({ valid: false, error: "unfinished" });
  });

  it("rejects unsupported notation but allows an intentionally empty recording", () => {
    expect(validateRecordedSolution(SOLVED_FAST_STATE, "R Q")).toMatchObject({ valid: false, error: "unsupported" });
    expect(validateRecordedSolution(SOLVED_FAST_STATE, "")).toMatchObject({ valid: true, normalized: "", error: "empty" });
  });
});
