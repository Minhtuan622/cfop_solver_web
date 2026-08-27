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
    expect(FTO_BENCISCO_WALKTHROUGH[0].checkVi).toMatch(/9 sticker trắng/i);
  });

  it("keeps objective, recognition, grip, actions and self-checks on every visual stage", () => {
    expect(FTO_BENCISCO_WALKTHROUGH.every((phase) => phase.objectiveVi && phase.lookForVi && phase.holdVi && phase.actionsVi.length === 3 && phase.checkVi && phase.algorithm)).toBe(true);
    expect(ftoWalkthroughDisplayAlgorithms(FTO_BENCISCO_WALKTHROUGH[2]).join(" ")).toMatch(/^Rv'/);
  });

  it("uses one fixed scramble and carries every After state into the next Before state", () => {
    expect(FTO_BENCISCO_WALKTHROUGH_SCRAMBLE).toBeTruthy();
    for (let index = 0; index < FTO_BENCISCO_WALKTHROUGH.length - 1; index += 1) {
      expect(ftoWalkthroughStateAfter(index)).toBe(ftoWalkthroughStateBefore(index + 1));
    }
  });

  it("returns the single Bencisco walkthrough scramble to the exact solved FTO state", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const solved = kpuzzle.defaultPattern();
    const restored = solved.applyAlg(new Alg(`${FTO_BENCISCO_WALKTHROUGH_SCRAMBLE} ${ftoWalkthroughSolution()}`));
    expect(restored.patternData).toEqual(solved.patternData);
  });

  it("renders a complete white U face after the white-center milestone", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    const stateAfterWhiteCenter = kpuzzle.defaultPattern().applyAlg(new Alg(ftoWalkthroughStateAfter(0)));
    const svg = await puzzles.fto.svg(stateAfterWhiteCenter);
    const uFace = svg.match(/<g id="U"[^>]*>([\s\S]*?)<\/g>/)?.[1] ?? "";
    const fills = [...uFace.matchAll(/fill: (#[0-9a-f]+);/gi)].map((match) => match[1].toLowerCase());
    expect(fills).toEqual(Array(9).fill("#ffffff"));
  });

  it("keeps the white U face intact across every Bencisco checkpoint", async () => {
    const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
    const kpuzzle = await puzzles.fto.kpuzzle();
    for (let index = 0; index < FTO_BENCISCO_WALKTHROUGH.length; index += 1) {
      const pattern = kpuzzle.defaultPattern().applyAlg(new Alg(ftoWalkthroughStateBefore(index)));
      const svg = await puzzles.fto.svg(pattern);
      const uFace = svg.match(/<g id="U"[^>]*>([\s\S]*?)<\/g>/)?.[1] ?? "";
      const fills = [...uFace.matchAll(/fill: (#[0-9a-f]+);/gi)].map((match) => match[1].toLowerCase());
      expect(fills).toEqual(Array(9).fill("#ffffff"));
    }
  });
});
