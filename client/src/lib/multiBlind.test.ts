import { describe, expect, it } from "vitest";
import { compareMultiBlindResults, multiBlindResult, multiBlindTimeLimitMs } from "./multiBlind";

describe("Multi-Blind scoring", () => {
  it("scores solved cubes minus unsolved cubes and keeps the WCA validity threshold", () => {
    expect(multiBlindResult({ attempted: 10, solved: 8 }, 42 * 60_000)).toMatchObject({ score: 6, unsolved: 2, scoreValid: true, valid: true });
    expect(multiBlindResult({ attempted: 4, solved: 1 }, 1_000)).toMatchObject({ score: -2, scoreValid: false, valid: false });
  });

  it("applies the 10-minute-per-cube limit below six and a 60-minute limit otherwise", () => {
    expect(multiBlindTimeLimitMs(5)).toBe(50 * 60_000);
    expect(multiBlindTimeLimitMs(6)).toBe(60 * 60_000);
    expect(multiBlindResult({ attempted: 2, solved: 2 }, 20 * 60_000 + 1).valid).toBe(false);
  });

  it("breaks ties by time and then fewer unsolved cubes", () => {
    const early = multiBlindResult({ attempted: 8, solved: 6 }, 30_000);
    const late = multiBlindResult({ attempted: 8, solved: 6 }, 31_000);
    expect(compareMultiBlindResults(early, late, 30_000, 31_000)).toBeLessThan(0);
    const fewerMisses = multiBlindResult({ attempted: 6, solved: 5 }, 30_000);
    expect(compareMultiBlindResults(fewerMisses, early, 30_000, 30_000)).toBeLessThan(0);
  });
});
