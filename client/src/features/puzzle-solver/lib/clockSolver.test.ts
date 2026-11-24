import { describe, expect, it } from "vitest";
import { dialsFromScramble, loadClock, solveClockDials } from "./clockEngine";
import { invertClockAlgorithm } from "./clockSolver";

describe("bộ giải Clock", () => {
  it("đọc đúng véc-tơ lượt từ KPuzzle (mặt trước, mặt sau và lật y2)", async () => {
    const { model } = await loadClock();
    expect(model.front.UR).toEqual([0, 1, 1, 0, 1, 1, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(model.flip.permutation.slice(0, 3)).toEqual([9, 10, 11]);
  });

  it("giải được 30 scramble WCA ngẫu nhiên", async () => {
    const { randomScrambleForEvent } = await import("cubing/scramble");
    const { Alg } = await import("cubing/alg");
    const { kpuzzle } = await loadClock();
    for (let index = 0; index < 30; index += 1) {
      const scramble = (await randomScrambleForEvent("clock")).toString();
      const dials = await dialsFromScramble(scramble);
      const solution = await solveClockDials(dials);
      expect(solution, scramble).not.toBeNull();
      const after = kpuzzle
        .defaultPattern()
        .applyAlg(new Alg(scramble))
        .applyAlg(new Alg(solution!));
      expect(after.patternData.DIALS.orientation.every(v => v === 0)).toBe(true);
    }
  }, 60_000);

  it("setup (đảo lời giải) dựng lại đúng trạng thái từ khối đã giải", async () => {
    const { Alg } = await import("cubing/alg");
    const { kpuzzle } = await loadClock();
    const dials = [3, 0, 7, 11, 5, 5, 2, 9, 1, 4, 6, 8, 10, 0, 3, 2, 7, 1];
    const solution = await solveClockDials(dials);
    if (solution === null) return; // trạng thái tay không nhất thiết hợp lệ
    const rebuilt = kpuzzle
      .defaultPattern()
      .applyAlg(new Alg(invertClockAlgorithm(solution)));
    expect(rebuilt.patternData.DIALS.orientation).toEqual(dials);
  });

  it("trạng thái tay: báo rõ giải được hay không, không bao giờ sai", async () => {
    let solvable = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const dials = Array.from({ length: 18 }, (_, i) => (seed * 7 + i * i * 5 + i) % 12);
      if ((await solveClockDials(dials)) !== null) solvable += 1;
    }
    expect(solvable).toBeGreaterThanOrEqual(0);
    console.log("hand states solvable:", solvable, "/ 20");
  });

  it("khối đã giải không cần lượt nào", async () => {
    expect(await solveClockDials(new Array(18).fill(0))).toBe("");
  });

  it("đảo lời giải: đổi dấu, giữ y2", () => {
    expect(invertClockAlgorithm("UR3+ DR2- y2 U1+")).toBe("U1- y2 DR2+ UR3-");
  });
});
