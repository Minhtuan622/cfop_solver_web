import { describe, expect, it } from "vitest";
import { detectCompletedPhases } from "./phaseDetect";

const SOLVED = "U".repeat(9) + "R".repeat(9) + "F".repeat(9) + "D".repeat(9) + "L".repeat(9) + "B".repeat(9);

const withFaces = (dFace: string, uFace = "U".repeat(9), fFace = "F".repeat(9)) =>
  uFace + "R".repeat(9) + fFace + dFace + "L".repeat(9) + "B".repeat(9);

describe("detectCompletedPhases", () => {
  it("khối solved: cả ba pha đều xong", () => {
    expect(detectCompletedPhases(SOLVED)).toEqual({
      cross: true,
      f2l: true,
      oll: true,
    });
  });

  it("Cross xong nhưng F2L chưa: D chỉ đúng 4 cạnh, 4 góc lệch", () => {
    const d = "UDUDDDUDU";
    const result = detectCompletedPhases(withFaces(d));
    expect(result.cross).toBe(true);
    expect(result.f2l).toBe(false);
  });

  it("Cross chưa xong khi một cạnh D lệch màu", () => {
    const d = "UDUUDDUDU";
    expect(detectCompletedPhases(withFaces(d)).cross).toBe(false);
  });

  it("F2L xong (D đều màu) và U chưa đều → oll false", () => {
    const d = "D".repeat(9);
    const u = "U".repeat(4) + "R" + "U".repeat(4);
    const result = detectCompletedPhases(withFaces(d, u));
    expect(result.cross).toBe(true);
    expect(result.f2l).toBe(true);
    expect(result.oll).toBe(false);
  });

  it("cạnh giữa của F lệch màu thì F2L false dù D đều", () => {
    const f = "FFF" + "LLL" + "FFF";
    const result = detectCompletedPhases(withFaces("D".repeat(9), "U".repeat(9), f));
    expect(result.cross).toBe(true);
    expect(result.f2l).toBe(false);
  });

  it("OLL xong khi cả mặt U đều màu U", () => {
    expect(detectCompletedPhases(withFaces("D".repeat(9), "U".repeat(9))).oll).toBe(true);
  });

  it("chuỗi không hợp lệ → không pha nào xong", () => {
    expect(detectCompletedPhases("UUU")).toEqual({
      cross: false,
      f2l: false,
      oll: false,
    });
  });
});
