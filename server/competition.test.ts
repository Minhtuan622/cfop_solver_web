import { describe, expect, it } from "vitest";
import { competitionAo5, competitionAo12, competitionBestOf3, competitionFormatScore, createCompetitionCode, createSharedScramble, effectiveCompetitionTime } from "./competition";

describe("competition helpers", () => {
  it("tạo mã phòng dễ đọc và scramble 3×3 không lặp mặt liền nhau", () => {
    expect(createCompetitionCode()).toMatch(/^[A-Z2-9]{6}$/);
    const faces = createSharedScramble().split(" ").map((move) => move[0]);
    expect(faces).toHaveLength(20);
    expect(faces.every((face, index) => index === 0 || face !== faces[index - 1])).toBe(true);
  });

  it("chấm thời gian +2 và Ao5 theo quy tắc loại nhanh/chậm", () => {
    expect(effectiveCompetitionTime({ elapsedMs: 10_000, penalty: "+2" })).toBe(12_000);
    expect(competitionAo5([10, 11, 12, 13, 14].map((elapsedMs) => ({ elapsedMs: elapsedMs * 1_000, penalty: "none" as const })))).toBe(12_000);
    expect(competitionAo5([{ elapsedMs: 10_000, penalty: "DNF" }, ...[11, 12, 13, 14].map((elapsedMs) => ({ elapsedMs: elapsedMs * 1_000, penalty: "none" as const }))])).toBe(13_000);
    expect(competitionAo5([{ elapsedMs: 10_000, penalty: "DNF" }, { elapsedMs: 11_000, penalty: "DNF" }, ...[12, 13, 14].map((elapsedMs) => ({ elapsedMs: elapsedMs * 1_000, penalty: "none" as const }))])).toBeNull();
  });

  it("tính Best of 3 và Ao12 với cùng quy tắc penalty", () => {
    const three = [{ elapsedMs: 12_000, penalty: "none" as const }, { elapsedMs: 9_000, penalty: "+2" as const }, { elapsedMs: 11_000, penalty: "none" as const }];
    expect(competitionBestOf3(three)).toBe(11_000);
    expect(competitionFormatScore("best_of_3", three)).toBe(11_000);
    const twelve = Array.from({ length: 12 }, (_, index) => ({ elapsedMs: (10 + index) * 1_000, penalty: "none" as const }));
    expect(competitionAo12(twelve)).toBe(15_500);
    expect(competitionFormatScore("ao12", twelve)).toBe(15_500);
  });
});
