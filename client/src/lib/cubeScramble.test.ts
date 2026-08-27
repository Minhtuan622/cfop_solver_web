import { describe, expect, it } from "vitest";
import { randomThreeByThreeScramble } from "./cubeScramble";

function axis(face: string) {
  return face === "U" || face === "D" ? "ud" : face === "R" || face === "L" ? "rl" : "fb";
}

describe("randomThreeByThreeScramble", () => {
  it("creates requested-length 3×3 move sequences without repeated faces or a repeated axis run", () => {
    const moves = randomThreeByThreeScramble(40).split(" ");
    expect(moves).toHaveLength(40);
    expect(moves.every((move) => /^[URFDLB](?:2|')?$/.test(move))).toBe(true);
    moves.forEach((move, index) => {
      if (index > 0) expect(move[0]).not.toBe(moves[index - 1]?.[0]);
      if (index > 1) expect(!(axis(move[0]) === axis(moves[index - 1]?.[0] ?? "") && axis(move[0]) === axis(moves[index - 2]?.[0] ?? ""))).toBe(true);
    });
  });
});
