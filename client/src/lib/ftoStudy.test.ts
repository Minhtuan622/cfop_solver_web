import { FTO_SINGLE_LAYER_LEVELS, createFtoSingleLayerScramble, invertFtoScramble, readFtoSingleLayerAttempts, writeFtoSingleLayerAttempts } from "./ftoStudy";
import { describe, expect, it } from "vitest";

describe("FTO single-layer study", () => {
  it("creates a short beginner drill using only the faces selected for its level", () => {
    const level = FTO_SINGLE_LAYER_LEVELS[2]!;
    const scramble = createFtoSingleLayerScramble(level, () => 0.75);
    const moves = scramble.split(" ");
    expect(moves).toHaveLength(level.length);
    expect(moves.every((move) => level.faces.includes(move.replace("'", "")))).toBe(true);
    expect(moves.every((move, index) => index === 0 || move.replace("'", "") !== moves[index - 1]!.replace("'", ""))).toBe(true);
  });

  it("builds the inverse answer in reverse order", () => {
    expect(invertFtoScramble("U F' R BL'")).toBe("BL R' F U'");
  });

  it("keeps only valid locally stored FTO practice attempts", () => {
    const data = new Map<string, string>();
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key, value) };
    writeFtoSingleLayerAttempts([{ id: "a", levelId: "single-layer", scramble: "U F'", elapsedMs: 1_240, completedAt: 10 }], storage);
    expect(readFtoSingleLayerAttempts(storage)).toEqual([{ id: "a", levelId: "single-layer", scramble: "U F'", elapsedMs: 1_240, completedAt: 10 }]);
  });
});
