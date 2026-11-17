// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { emptyBldProfile, readBldProfile, writeBldProfile } from "./bldProfile";

const STORE = "cfop-bld-profile-v1";

const memoRecord = (key: string, overrides: Record<string, unknown> = {}) => ({
  key,
  memo: "FR",
  kind: "edge",
  attempts: 3,
  lapses: 1,
  intervalDays: 4,
  dueAt: 1_800_000_000_000,
  lastReviewedAt: 1_700_000_000_000,
  lastGrade: "good",
  ...overrides,
});

describe("bldProfile: normalization on read", () => {
  beforeEach(() => localStorage.clear());

  it("keeps valid records and degrades invalid fields instead of dropping them", () => {
    const records = {
      valid: memoRecord("valid", { kind: "edge" }),
      noKey: memoRecord(""),
      noMemo: memoRecord("noMemo", { memo: "" }),
      kindJunk: memoRecord("kindJunk", { kind: "not-a-kind" }),
      gradeJunk: memoRecord("gradeJunk", { lastGrade: "???" }),
      numberish: memoRecord("numberish", { attempts: 1.6, lapses: "2" }),
    };
    localStorage.setItem(STORE, JSON.stringify({ memoRecords: records }));
    const profile = readBldProfile();

    expect(Object.keys(profile.memoRecords)).toHaveLength(4);
    expect(profile.memoRecords.kindJunk?.kind).toBe("mixed");
    expect(profile.memoRecords.gradeJunk?.lastGrade).toBe("again");
    expect(profile.memoRecords.numberish?.attempts).toBe(2);
    expect(profile.memoRecords.numberish?.lapses).toBe(0);
  });

  it("falls back to the default dailyGoal on garbage and keeps a valid one", () => {
    localStorage.setItem(STORE, JSON.stringify({ dailyGoal: "nope" }));
    expect(readBldProfile().dailyGoal).toBe(12);
    localStorage.setItem(STORE, JSON.stringify({ dailyGoal: 30 }));
    expect(readBldProfile().dailyGoal).toBe(30);
  });

  it("drops preferred algorithms without a usable algorithm", () => {
    localStorage.setItem(
      STORE,
      JSON.stringify({
        preferredAlgorithms: {
          good: { algorithm: "R U R'", updatedAt: 1_700_000_000_000 },
          bad: { algorithm: "" },
          alsoBad: { algorithm: 42 },
        },
      }),
    );
    const profile = readBldProfile();
    expect(Object.keys(profile.preferredAlgorithms)).toEqual(["good"]);
    expect(profile.preferredAlgorithms.good?.algorithm).toBe("R U R'");
  });

  it("drops drill attempts with an unknown kind or grade", () => {
    const attempts = [
      { id: "a", key: "FR", kind: "parity", grade: "good", durationMs: 1000, createdAt: 1_700_000_000_000 },
      { id: "b", key: "FR", kind: "flip", grade: "bad", durationMs: 1000, createdAt: 1_700_000_000_000 },
      { id: "c", key: "FR", kind: "twist", grade: "easy", durationMs: 1000, createdAt: 1_700_000_000_000 },
    ];
    localStorage.setItem(STORE, JSON.stringify({ drillAttempts: attempts }));
    expect(readBldProfile().drillAttempts.map(item => item.id)).toEqual(["a", "c"]);
  });

  it("round-trips a profile through write and read", () => {
    const profile = emptyBldProfile();
    profile.memoRecords["edge:FR"] = {
      key: "edge:FR",
      memo: "FR",
      kind: "edge",
      attempts: 2,
      lapses: 0,
      intervalDays: 1,
      dueAt: 1_700_000_000_000,
      lastReviewedAt: 1_700_000_000_000,
      lastGrade: "good",
    };
    writeBldProfile(profile);
    expect(readBldProfile().memoRecords["edge:FR"]?.memo).toBe("FR");
  });
});
