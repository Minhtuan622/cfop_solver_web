import { describe, expect, it } from "vitest";
import { buildCompetitionLeaderboard, compareCompetitionResults, competitionAo5, competitionAo12, competitionBestOf3, competitionFormatScore, competitionRoundLimit, createCompetitionCode, createCompetitionScramble, createCompetitionScrambleBundle, createSharedScramble, effectiveCompetitionTime } from "./competition";

describe("competition helpers", () => {
  it("tạo mã phòng dễ đọc và scramble 3×3 không lặp mặt liền nhau", () => {
    expect(createCompetitionCode()).toMatch(/^[A-Z2-9]{6}$/);
    const faces = createSharedScramble().split(" ").map((move) => move[0]);
    expect(faces).toHaveLength(20);
    expect(faces.every((face, index) => index === 0 || face !== faces[index - 1])).toBe(true);
  });

  it("tạo scramble Cubing.js cho event Blindfolded 4×4 và 5×5", async () => {
    const [fourBlind, fiveBlind] = await Promise.all([createCompetitionScramble("444bf"), createCompetitionScramble("555bf")]);
    expect(fourBlind.trim()).not.toBe("");
    expect(fiveBlind.trim()).not.toBe("");
    expect(fourBlind).toMatch(/[URFDLB]/);
    expect(fiveBlind).toMatch(/[URFDLB]/);
  }, 20_000);

  it("tạo bundle MBLD và xếp theo score, thời gian, rồi unsolved", async () => {
    const bundle = await createCompetitionScrambleBundle("333mbf", 3);
    expect(bundle).toHaveLength(3);
    expect(bundle.every((scramble) => /[URFDLB]/.test(scramble))).toBe(true);
    expect(competitionRoundLimit("ao12", "333mbf")).toBe(1);
    const stronger = { elapsedMs: 150_000, penalty: "none" as const, multiBlindAttempted: 5, multiBlindSolved: 4, multiBlindScore: 3 };
    const weaker = { elapsedMs: 90_000, penalty: "none" as const, multiBlindAttempted: 5, multiBlindSolved: 3, multiBlindScore: 1 };
    expect(compareCompetitionResults("333mbf", stronger, weaker)).toBeLessThan(0);
    expect(competitionFormatScore("ao5", [stronger], "333mbf")).toBe(3);
  }, 20_000);

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

  it("tổng hợp bảng xếp hạng từ các phòng đã chốt", () => {
    const results = [
      ...[10, 11, 12].map((seconds, index) => ({ roomId: 1, roomFormat: "best_of_3" as const, accountId: 1, displayName: "An", avatarUrl: null, roundSequence: index + 1, elapsedMs: seconds * 1_000, penalty: "none" as const })),
      ...[13, 14, 15].map((seconds, index) => ({ roomId: 1, roomFormat: "best_of_3" as const, accountId: 2, displayName: "Bình", avatarUrl: null, roundSequence: index + 1, elapsedMs: seconds * 1_000, penalty: "none" as const })),
      ...[9, 10, 11].map((seconds, index) => ({ roomId: 2, roomFormat: "best_of_3" as const, accountId: 1, displayName: "An", avatarUrl: null, roundSequence: index + 1, elapsedMs: seconds * 1_000, penalty: "none" as const })),
      ...[12, 13, 14].map((seconds, index) => ({ roomId: 2, roomFormat: "best_of_3" as const, accountId: 3, displayName: "Chi", avatarUrl: null, roundSequence: index + 1, elapsedMs: seconds * 1_000, penalty: "none" as const })),
    ];
    expect(buildCompetitionLeaderboard(results)).toMatchObject([
      { rank: 1, accountId: 1, points: 20, wins: 2, rooms: 2 },
      { rank: 2, accountId: 2, points: 6, wins: 0, rooms: 1 },
      { rank: 3, accountId: 3, points: 6, wins: 0, rooms: 1 },
    ]);
  });
});
