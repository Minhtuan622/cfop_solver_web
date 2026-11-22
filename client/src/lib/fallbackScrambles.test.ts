import { describe, expect, it } from "vitest";
import { fallbackScramble, squareOne } from "./fallbackScrambles";

const tokens = (scramble: string) => scramble.split(/\s+/).filter(Boolean);
const wideFaces = (scramble: string) =>
  new Set(tokens(scramble).filter(move => move.includes("w")).map(move => move.replace(/['2]$/, "")));

describe("fallbackScramble theo chuẩn WCA", () => {
  it("2×2 chỉ dùng R, U, F với 11 lượt", () => {
    const moves = tokens(fallbackScramble("222"));
    expect(moves).toHaveLength(11);
    expect(moves.every(move => /^[RUF]['2]?$/.test(move))).toBe(true);
  });

  it("4×4 chỉ có wide Uw/Rw/Fw (không phải bộ lượt 5×5)", () => {
    for (let run = 0; run < 20; run += 1) {
      const scramble = fallbackScramble("444");
      expect(tokens(scramble)).toHaveLength(40);
      for (const wide of wideFaces(scramble)) expect(["Uw", "Rw", "Fw"]).toContain(wide);
    }
  });

  it("5×5 dùng đủ 6 mặt wide hai tầng, 60 lượt", () => {
    const moves = tokens(fallbackScramble("555"));
    expect(moves).toHaveLength(60);
    expect(moves.every(move => /^[URFDLB]w?['2]?$/.test(move))).toBe(true);
  });

  it("6×6 có 3 tầng chỉ ở 3Uw/3Rw/3Fw, 7×7 có 3 tầng ở cả 6 mặt", () => {
    const six = tokens(fallbackScramble("666"));
    expect(six).toHaveLength(80);
    expect(six.filter(move => move.startsWith("3")).every(move => /^3[URF]w/.test(move))).toBe(true);
    const seven = tokens(fallbackScramble("777"));
    expect(seven).toHaveLength(100);
    expect(seven.every(move => /^(3?[URFDLB]w|[URFDLB])['2]?$/.test(move))).toBe(true);
  });

  it("không có lượt thừa cùng trục (vd. U D U)", () => {
    const axis = (move: string) => "UD".includes(move.replace(/^3/, "")[0]) ? 0 : "RL".includes(move.replace(/^3/, "")[0]) ? 1 : 2;
    for (let run = 0; run < 30; run += 1) {
      const moves = tokens(fallbackScramble("555"));
      for (let index = 1; index < moves.length; index += 1) {
        const base = (move: string) => move.replace(/['2]$/, "");
        expect(base(moves[index])).not.toBe(base(moves[index - 1]));
        if (index >= 2 && axis(moves[index]) === axis(moves[index - 1]) && axis(moves[index]) === axis(moves[index - 2])) {
          expect(new Set([moves[index], moves[index - 1], moves[index - 2]].map(base)).size).toBe(3);
        }
      }
    }
  });

  it("FMC bắt đầu và kết thúc bằng R' U' F", () => {
    const scramble = fallbackScramble("333fm");
    expect(scramble.startsWith("R' U' F ")).toBe(true);
    expect(scramble.endsWith(" R' U' F")).toBe(true);
  });

  it("BLD kết thúc bằng phép xoay wide/hướng hợp lệ", () => {
    for (let run = 0; run < 20; run += 1) {
      const tail = tokens(fallbackScramble("333bf")).slice(20);
      expect(tail.every(move => /^(Rw|Uw)['2]?$/.test(move))).toBe(true);
    }
  });

  it("Megaminx: 7 dòng, mỗi dòng 10 lượt R/D rồi U hoặc U'", () => {
    const lines = fallbackScramble("minx").split("\n");
    expect(lines).toHaveLength(7);
    for (const line of lines) {
      const moves = tokens(line);
      expect(moves).toHaveLength(11);
      expect(moves.slice(0, 10).every((move, index) => move === `${index % 2 ? "D" : "R"}++` || move === `${index % 2 ? "D" : "R"}--`)).toBe(true);
      expect(["U", "U'"]).toContain(moves[10]);
    }
  });

  it("Clock theo định dạng WCA 2023", () => {
    const moves = tokens(fallbackScramble("clock"));
    expect(moves).toHaveLength(15);
    expect(moves[9]).toBe("y2");
    expect(moves.filter(move => move !== "y2").every(move => /^(UR|DR|DL|UL|U|R|D|L|ALL)[0-6][+-]$/.test(move))).toBe(true);
  });

  it("Square-1 chỉ gồm các bước (a,b)/ hợp lệ", () => {
    const steps = squareOne().split(" ");
    expect(steps).toHaveLength(12);
    expect(steps.every(step => /^\(-?[0-6],-?[0-6]\)\/$/.test(step))).toBe(true);
    expect(steps.every(step => step !== "(0,0)/")).toBe(true);
  });

  it("Pyraminx và Skewb chỉ dùng lượt của khối đó", () => {
    expect(tokens(fallbackScramble("pyram")).every(move => /^[ULRBulrb]'?$/.test(move))).toBe(true);
    expect(tokens(fallbackScramble("skewb")).every(move => /^[RULB]'?$/.test(move))).toBe(true);
  });
});
