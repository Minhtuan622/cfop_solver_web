import { beforeEach, describe, expect, it } from "vitest";
import {
  cfopCaseKey,
  readCfopStudy,
  writeCfopStudy,
  exportCfopStudy,
  importCfopStudy,
  gradeCfopCase,
  todayReviewCount,
} from "./cfopStudy";
import { listCfopCases } from "./cfopCatalog";

const CASE = listCfopCases({ family: "oll", limit: 1 })[0]!;
const STORE = "cfop-cfop-study-v1";

beforeEach(() => {
  window.localStorage.clear();
});

describe("cfopStudy SRS", () => {
  it("grades a case: attempts and interval grow", () => {
    const profile = readCfopStudy();
    expect(profile.records).toEqual({});
    const record = gradeCfopCase(CASE, undefined, 12_000, "good", 1_700_000_000_000);
    expect(record.attempts).toBe(1);
    expect(record.intervalDays).toBe(1);
    expect(record.family).toBe("oll");
  });

  it("round-trips state through write/read", () => {
    const state = readCfopStudy();
    state.records[cfopCaseKey(CASE)] = {
      key: cfopCaseKey(CASE),
      family: "oll",
      group: "oll",
      id: CASE.id,
      attempts: 2,
      lapses: 0,
      averageMs: 11_000,
      lastMs: 10_000,
      intervalDays: 3,
      dueAt: 1_800_000_000_000,
      lastReviewedAt: 1_700_000_000_000,
      lastGrade: "good",
    };
    writeCfopStudy(state);
    const restored = readCfopStudy();
    expect(restored.records[cfopCaseKey(CASE)]?.intervalDays).toBe(3);
  });

  it("drops records with broken links on read", () => {
    window.localStorage.setItem(
      STORE,
      JSON.stringify({
        records: {
          ok: {
            key: "ok",
            family: "oll",
            group: "oll",
            id: "x",
            attempts: 1,
            lapses: 0,
            averageMs: 1000,
            lastMs: 1000,
            intervalDays: 1,
            dueAt: 1,
            lastReviewedAt: 1,
            lastGrade: "good",
          },
          noFamily: { key: "noFamily", family: "nope", group: "g", id: "i" },
          noId: { key: "noId", family: "oll", group: "g", id: "" },
        },
      }),
    );
    const study = readCfopStudy();
    expect(Object.keys(study.records)).toEqual(["ok"]);
  });

  it("export/import round-trips and rejects invalid backups", () => {
    const state = readCfopStudy();
    state.records[cfopCaseKey(CASE)] = gradeCfopCase(CASE, undefined, 10_000, "good", 1_700_000_000_000);
    const payload = exportCfopStudy(state, new Set(["oll:OLL-26"]));
    const restored = importCfopStudy(JSON.parse(JSON.stringify(payload)));
    expect(restored.state.records[cfopCaseKey(CASE)]?.intervalDays).toBe(1);
    expect(restored.masteredKeys.has("oll:OLL-26")).toBe(true);
    expect(() => importCfopStudy({ schema: "nope" })).toThrow("Invalid backup");
  });

  it("counts reviews done today", () => {
    const record = gradeCfopCase(CASE, undefined, 10_000, "good");
    expect(todayReviewCount({ [record.key]: record })).toBe(1);
  });
});
