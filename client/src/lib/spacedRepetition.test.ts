import { describe, expect, it } from "vitest";
import { spacedRepetitionInterval } from "./spacedRepetition";

describe("spacedRepetitionInterval", () => {
  it("resets to 0 on a miss", () => {
    expect(spacedRepetitionInterval(0, "again")).toBe(0);
    expect(spacedRepetitionInterval(30, "again")).toBe(0);
  });

  it("grows by 30 % on a hard grade, never below a day", () => {
    expect(spacedRepetitionInterval(0, "hard")).toBe(1);
    expect(spacedRepetitionInterval(1, "hard")).toBe(1);
    expect(spacedRepetitionInterval(10, "hard")).toBe(13);
    expect(spacedRepetitionInterval(100, "hard")).toBe(130);
  });

  it("starts at 1 day on a good grade, then grows by 2.5x", () => {
    expect(spacedRepetitionInterval(0, "good")).toBe(1);
    expect(spacedRepetitionInterval(1, "good")).toBe(3);
    expect(spacedRepetitionInterval(10, "good")).toBe(25);
  });

  it("starts at 3 days on an easy grade, then grows by 3.5x", () => {
    expect(spacedRepetitionInterval(0, "easy")).toBe(3);
    expect(spacedRepetitionInterval(1, "easy")).toBe(4);
    expect(spacedRepetitionInterval(3, "easy")).toBe(11);
  });
});
