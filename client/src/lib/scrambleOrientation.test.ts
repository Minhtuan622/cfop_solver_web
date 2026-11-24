import { describe, expect, it } from "vitest";
import { applyFastMoves, invertAlgorithm, SOLVED_FAST_STATE } from "./fastCube";
import {
  CROSS_TO_D_ROTATION,
  heldAlgorithm,
  heldMove,
  orientForCross,
  previewSetupAlg,
  scrambledState,
  solutionSetupRotation,
  studioScrambleAlg,
  wcaLettersToStudio,
} from "./scrambleOrientation";

const center = (state: string, faceIndex: number) => state[faceIndex * 9 + 4];
const FACES = ["U", "R", "F", "D", "L", "B"] as const;

describe("scrambledState", () => {
  it("lượt U của scramble xoay mặt trắng (D trong khung studio)", () => {
    const state = scrambledState("U");
    expect(state.slice(27, 36)).toBe("DDDDDDDDD");
    expect(state.slice(0, 9)).toBe("UUUUUUUUU");
    expect(state.slice(24, 27)).not.toBe("FFF");
    expect(state.slice(18, 24)).toBe("FFFFFF");
  });

  it("lượt R của scramble xoay mặt đỏ (L trong khung studio)", () => {
    const state = scrambledState("R");
    expect(state.slice(9, 18)).toBe("RRRRRRRRR");
    expect(state.slice(36, 45)).toBe("LLLLLLLLL");
    expect([18, 21, 24].map(i => state[i]).join("")).not.toBe("FFF");
  });

  it("giữ tâm ở vị trí gốc và khớp scramble rỗng", () => {
    expect(scrambledState("")).toBe(SOLVED_FAST_STATE);
    const state = scrambledState("R U R' F2 D L'");
    FACES.forEach((face, index) => expect(center(state, index)).toBe(face));
  });
});

describe("orientForCross", () => {
  it.each(FACES)("đưa màu cross %s xuống mặt D", cross => {
    expect(center(orientForCross(SOLVED_FAST_STATE, cross), 3)).toBe(cross);
  });

  it("dùng đúng phép xoay trong setup của Cubing.js", () => {
    expect(previewSetupAlg("R U", "D")).toBe("z2 R U z2");
    expect(previewSetupAlg("R U", "U")).toBe(`z2 R U z2 ${CROSS_TO_D_ROTATION.U}`);
  });
});

describe("ký hiệu theo hướng đang cầm", () => {
  it("phép xoay đầu lời giải tính từ hướng lúc tráo (trắng U, xanh lá F)", () => {
    expect(solutionSetupRotation("D", "scramble")).toBe("z2");
    expect(solutionSetupRotation("U", "scramble")).toBe("");
    expect(solutionSetupRotation("D", "state")).toBe("");
    expect(solutionSetupRotation("U", "state")).toBe("z2");
  });

  it.each(["U", "R", "F", "L", "B"] as const)(
    "lời giải viết lại theo cross %s vẫn giải đúng khối đã lật",
    cross => {
      const scramble = "R U2 F' L D B2 R' U F2 D' L2 B";
      const actualSolution = invertAlgorithm(studioScrambleAlg(scramble));
      const held = orientForCross(scrambledState(scramble), cross);
      const done = applyFastMoves(held, heldAlgorithm(actualSolution, cross));
      expect(done).toBe(orientForCross(SOLVED_FAST_STATE, cross));
    }
  );

  it("cross trắng giữ nguyên ký hiệu, wide giữ cách viết Xw", () => {
    expect(heldAlgorithm("R U' Rw2", "D")).toBe("R U' Rw2");
    expect(heldMove("Rw", "U")).toBe("Lw");
  });

  it("BLD: đổi chữ cái khung WCA sang màu studio", () => {
    expect(wcaLettersToStudio("URFDLB")).toBe("DLFURB");
  });
});
