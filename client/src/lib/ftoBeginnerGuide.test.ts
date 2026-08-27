import { describe, expect, it } from "vitest";
import {
  FTO_BENCISCO_WALKTHROUGH,
  FTO_BENCISCO_WALKTHROUGH_SCRAMBLE,
  ftoWalkthroughDisplayAlgorithms,
  ftoWalkthroughSolution,
  ftoWalkthroughStateAfter,
  ftoWalkthroughStateBefore,
} from "./ftoBeginnerGuide";

describe("FTO Bencisco walkthrough", () => {
  it("starts from a white center/hexagon and follows the complete Bencisco stage order", () => {
    expect(FTO_BENCISCO_WALKTHROUGH.map((phase) => phase.id)).toEqual([
      "white-center",
      "first-two-triples",
      "second-center",
      "last-two-centers",
      "last-bottom-triple",
      "last-three-triples",
    ]);
    expect(FTO_BENCISCO_WALKTHROUGH[0].objectiveVi).toMatch(/white center \(hexagon\)/i);
    expect(FTO_BENCISCO_WALKTHROUGH[0].objectiveVi).toMatch(/6 mảnh/i);
    expect(FTO_BENCISCO_WALKTHROUGH[0].checkVi).toMatch(/3 cạnh hình thoi trắng/i);
  });

  it("keeps objective, recognition, grip, actions and self-checks on every visual stage", () => {
    expect(FTO_BENCISCO_WALKTHROUGH.every((phase) => phase.objectiveVi && phase.lookForVi && phase.holdVi && phase.actionsVi.length === 3 && phase.checkVi && phase.algorithm)).toBe(true);
    expect(ftoWalkthroughDisplayAlgorithms(FTO_BENCISCO_WALKTHROUGH[2]).join(" ")).toMatch(/^Ro'/);
  });

  it("uses one fixed scramble and carries every After state into the next Before state", () => {
    expect(FTO_BENCISCO_WALKTHROUGH_SCRAMBLE).toBeTruthy();
    for (let index = 0; index < FTO_BENCISCO_WALKTHROUGH.length - 1; index += 1) {
      expect(ftoWalkthroughStateAfter(index)).toBe(ftoWalkthroughStateBefore(index + 1));
    }
  });

  it("uses the fixed scramble and parser-compatible reconstruction from the Bencisco example", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    expect(FTO_BENCISCO_WALKTHROUGH_SCRAMBLE).toBe("L' U' R BL F' R' L BL' U B' D L B' F' R' BR' BL BR F' D' BR' BL U D' BR");
    expect(() => solved.applyAlg(new Alg(`${FTO_BENCISCO_WALKTHROUGH_SCRAMBLE} ${ftoWalkthroughSolution()}`))).not.toThrow();
  });

  it("uses the source First Center reconstruction rather than a synthetic inverse sequence", () => {
    expect(FTO_BENCISCO_WALKTHROUGH[0].algorithm).toBe("T' Uv' R U' Uv' T F D F' D' Uv' R'");
    expect(ftoWalkthroughDisplayAlgorithms(FTO_BENCISCO_WALKTHROUGH[0]).join(" ")).toBe("T' Uo' R U' Uo' T F D F' D' Uo' R'");
  });

  it("keeps every checkpoint addressable from the one source scramble", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    for (let index = 0; index < FTO_BENCISCO_WALKTHROUGH.length; index += 1) {
      expect(() => kpuzzle.defaultPattern().applyAlg(new Alg(ftoWalkthroughStateBefore(index)))).not.toThrow();
      expect(() => kpuzzle.defaultPattern().applyAlg(new Alg(ftoWalkthroughStateAfter(index)))).not.toThrow();
    }
  });

});
