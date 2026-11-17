import { beforeEach, describe, expect, it } from "vitest";
import {
  readTwoByTwoStudy,
  writeTwoByTwoStudy,
  exportTwoByTwoStudy,
  importTwoByTwoStudy,
  gradeTwoByTwoCase,
  twoByTwoCaseKey,
  todayReviewCount,
} from "./twoByTwoStudy";
import { TWO_BY_TWO_CATALOG } from "./twoByTwoCatalog";

const CASE = TWO_BY_TWO_CATALOG[0]!;
const STORE = "cfop-twobytwo-study-v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("twoByTwoStudy SRS", () => {
  it("grades a case: attempts and interval grow", () => {
    const study = readTwoByTwoStudy();
    expect(study.records).toEqual({});
    const record = gradeTwoByTwoCase(CASE, undefined, 12_000, "good", 1_700_000_000_000);
    expect(record.attempts).toBe(1);
    expect(record.intervalDays).toBe(1);
    expect(record.family).toBe("cll");
  });

  it("round-trips state through write/read with its own storage key", () => {
    const study = readTwoByTwoStudy();
    study.records[twoByTwoCaseKey(CASE)] = {
      key: twoByTwoCaseKey(CASE),
      family: "cll",
      group: CASE.group,
      id: CASE.id,
      attempts: 3,
      lapses: 0,
      averageMs: 15_000,
      lastMs: 14_000,
      intervalDays: 4,
      dueAt: 1_800_000_000_000,
      lastReviewedAt: 1_700_000_000_000,
      lastGrade: "good",
    };
    writeTwoByTwoStudy(study);
    expect(window.localStorage.getItem(STORE)).toContain("cfop-twobytwo-study");
    const restored = readTwoByTwoStudy();
    expect(restored.records[twoByTwoCaseKey(CASE)]?.intervalDays).toBe(4);
  });

  it("drops records with broken links on read", () => {
    window.localStorage.setItem(
      STORE,
      JSON.stringify({
        records: {
          ok: {
            key: "ok",
            family: "cll",
            group: "AS",
            id: "CLL-AS-1",
            attempts: 1,
            lapses: 0,
            averageMs: 1000,
            lastMs: 1000,
            intervalDays: 1,
            dueAt: 1,
            lastReviewedAt: 1,
            lastGrade: "good",
          },
          notCll: { key: "notCll", family: "oll", group: "AS", id: "X" },
        },
      }),
    );
    expect(Object.keys(readTwoByTwoStudy().records)).toEqual(["ok"]);
  });

  it("export/import round-trips and rejects invalid backups", () => {
    const study = readTwoByTwoStudy();
    study.records[twoByTwoCaseKey(CASE)] = gradeTwoByTwoCase(CASE, undefined, 10_000, "good", 1_700_000_000_000);
    const payload = exportTwoByTwoStudy(study, new Set([`cll:${CASE.id}`]));
    const restored = importTwoByTwoStudy(JSON.parse(JSON.stringify(payload)));
    expect(restored.state.records[twoByTwoCaseKey(CASE)]?.intervalDays).toBe(1);
    expect(restored.masteredKeys.has(`cll:${CASE.id}`)).toBe(true);
    expect(() => importTwoByTwoStudy({ schema: "nope" })).toThrow("Invalid backup");
  });

  it("counts reviews done today", () => {
    const record = gradeTwoByTwoCase(CASE, undefined, 10_000, "good");
    expect(todayReviewCount({ [record.key]: record })).toBe(1);
  });
});
