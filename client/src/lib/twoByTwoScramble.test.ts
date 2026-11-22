import { describe, expect, it } from "vitest";
import { applyFastMoves, SOLVED_FAST_STATE } from "./fastCube";
import { randomTwoByTwoScramble, twoByTwoDistance, twoByTwoTables } from "./twoByTwoScramble";

/** 24 ô góc của khối 3×3 (URFDLB, 9 ô mỗi mặt). */
const CORNER_STICKERS = [0, 2, 6, 8].flatMap(i => [0, 1, 2, 3, 4, 5].map(face => face * 9 + i));
const cornersOf = (state: string) => CORNER_STICKERS.map(index => state[index]).join("");

describe("randomTwoByTwoScramble", () => {
  it("bảng BFS phủ đủ 3 674 160 trạng thái, xa nhất 11 lượt (HTM, R/U/F)", () => {
    const { dist } = twoByTwoTables();
    let max = 0;
    let atEleven = 0;
    let unreached = 0;
    for (const d of dist) {
      if (d === 255) unreached += 1;
      else if (d > max) max = d;
      if (d === 11) atEleven += 1;
    }
    expect(unreached).toBe(0);
    expect(dist.length).toBe(3_674_160);
    expect(max).toBe(11);
    // Số trạng thái cần đúng 11 lượt của nhóm <R,U,F> (HTM) là 2644.
    expect(atEleven).toBe(2644);
  });

  it("chỉ dùng R, U, F, từ 4 đến 11 lượt, và là lời giải tối ưu", () => {
    for (let run = 0; run < 200; run += 1) {
      const scramble = randomTwoByTwoScramble();
      const moves = scramble.split(" ");
      expect(moves.every(move => /^[RUF]['2]?$/.test(move))).toBe(true);
      expect(moves.length).toBeGreaterThanOrEqual(4);
      expect(moves.length).toBeLessThanOrEqual(11);
      for (let i = 1; i < moves.length; i += 1) expect(moves[i][0]).not.toBe(moves[i - 1][0]);
      // Độ dài scramble đúng bằng khoảng cách tối ưu của trạng thái tạo ra.
      expect(twoByTwoDistance(scramble)).toBe(moves.length);
    }
  });

  it("mô hình góc khớp với khối mô phỏng 3×3 (fastCube)", () => {
    for (let run = 0; run < 50; run += 1) {
      const scramble = randomTwoByTwoScramble();
      const corners = cornersOf(applyFastMoves(SOLVED_FAST_STATE, scramble));
      // Trạng thái khác nhau giữa hai mô hình sẽ làm khoảng cách sai: khối đã
      // giải ⇔ khoảng cách 0.
      expect(corners === cornersOf(SOLVED_FAST_STATE)).toBe(twoByTwoDistance(scramble) === 0);
      expect(twoByTwoDistance(scramble)).toBeGreaterThanOrEqual(4);
    }
    // Một lượt đơn lẻ: cả hai mô hình đều thấy khối chưa giải, khoảng cách 1.
    expect(twoByTwoDistance("R")).toBe(1);
    expect(twoByTwoDistance("R U R' U'")).toBe(4);
    expect(twoByTwoDistance("R R'")).toBe(0);
  });
});
