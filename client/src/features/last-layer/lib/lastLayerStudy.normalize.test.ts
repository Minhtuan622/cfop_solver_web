// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readLastLayerStudy, writeLastLayerStudy } from "./lastLayerStudy";

const STORE = "cfop-last-layer-study-v1";

const record = (key: string, overrides: Record<string, unknown> = {}) => ({
  key,
  family: "zbll",
  group: "AS",
  id: "AS-001",
  attempts: 3,
  lapses: 1,
  averageMs: 12_000,
  lastMs: 11_000,
  intervalDays: 4,
  dueAt: 1_800_000_000_000,
  lastReviewedAt: 1_700_000_000_000,
  lastGrade: "good",
  ...overrides,
});

describe("lastLayerStudy: normalization on read", () => {
  beforeEach(() => localStorage.clear());

  it("keeps valid records and drops the ones with broken links", () => {
    const records = {
      valid: record("kept"),
      noFamily: record("noFamily", { family: "nope" }),
      noGroup: record("noGroup", { group: "" }),
      noId: record("noId", { id: "" }),
      badGrade: record("badGrade", { lastGrade: "???" }),
    };
    localStorage.setItem(STORE, JSON.stringify({ records }));
    const study = readLastLayerStudy();
    expect(Object.keys(study.records).sort()).toEqual(["badGrade", "kept"]);
    expect(study.records.badGrade?.lastGrade).toBe("again");
  });

  it("falls back to the default dailyGoal on garbage and keeps a valid one", () => {
    localStorage.setItem(STORE, JSON.stringify({ dailyGoal: "nope" }));
    expect(readLastLayerStudy().dailyGoal).toBe(12);
    localStorage.setItem(STORE, JSON.stringify({ dailyGoal: 25 }));
    expect(readLastLayerStudy().dailyGoal).toBe(25);
  });

  it("computes dailyGoal and rounds it the same way as before", () => {
    localStorage.setItem(STORE, JSON.stringify({ dailyGoal: 19.4 }));
    expect(readLastLayerStudy().dailyGoal).toBe(19);
  });

  it("round-trips a study state through write and read", () => {
    writeLastLayerStudy({
      dailyGoal: 20,
      records: {
        kept: record("kept"),
      },
    });
    const study = readLastLayerStudy();
    expect(study.dailyGoal).toBe(20);
    expect(study.records.kept?.group).toBe("AS");
  });
});
