/**
 * Chốt hợp đồng của 11 bộ lưu tiến độ học (SRS) theo lane: key localStorage,
 * định dạng ghi, giới hạn, export/import và thuật toán xếp hàng ôn. Mọi lane
 * phải cư xử giống hệt nhau, chỉ khác các tham số trong bảng `LANES`.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";
import { CFOP_CLOUD_SYNC_EVENT } from "@/lib/cloudSyncSignal";
import * as bld from "@/features/bld/lib/bldStudy";
import * as cfop from "@/features/cfop/lib/cfopStudy";
import * as l2e from "@/features/fiveByFiveL2E/lib/l2eStudy";
import * as parity from "@/features/fourByFourParity/lib/fourByFourParityStudy";
import * as l2t from "@/features/fto2LookL3t/lib/l2tStudy";
import * as l3t from "@/features/ftoL3t/lib/l3tStudy";
import * as lastLayer from "@/features/last-layer/lib/lastLayerStudy";
import * as pyraminx from "@/features/pyraminx/lib/pyraminxStudy";
import * as skewb from "@/features/skewb/lib/skewbStudy";
import * as roux from "@/features/roux/lib/rouxStudy";
import * as squareOne from "@/features/squareOne/lib/squareOneStudy";
import * as twoByTwo from "@/features/twoByTwo/lib/twoByTwoStudy";

type AnyRecord = { key: string; family: string; lastGrade: string; [field: string]: unknown };
type AnyState = { records: Record<string, AnyRecord>; dailyGoal: number };
type Grade = "again" | "hard" | "good" | "easy";

type Lane = {
  name: string;
  store: string;
  masteredStore: string;
  schema: string;
  family: string;
  defaultGoal: number;
  maxRecords: number;
  maxMastered: number;
  read: () => AnyState;
  write: (state: never) => void;
  readMastered: () => Set<string>;
  writeMastered: (keys: Set<string>) => void;
  grade: (item: LastLayerCatalogCase, existing: never, elapsedMs: number, grade: Grade, now?: number) => AnyRecord;
  exportStudy: (state: never, mastered: Set<string>) => Record<string, unknown>;
  importStudy: (payload: unknown) => { state: AnyState; masteredKeys: Set<string> };
  mod: {
    caseKey: (item: Pick<LastLayerCatalogCase, "family" | "id">) => string;
    queueScore: (...args: never[]) => number;
    prioritizeStudyQueue: (...args: never[]) => LastLayerCatalogCase[];
    dueAndWeakCases: (...args: never[]) => LastLayerCatalogCase[];
    todayReviewCount: (...args: never[]) => number;
    weeklyReviewSchedule: (...args: never[]) => unknown[];
  };
};

const LANES: Lane[] = [
  { name: "bld", store: "cfop-bld-study-v1", masteredStore: "cfop-studio-mastered-bld-v1", schema: "cfop-bld-study", family: "edge", defaultGoal: 10, maxRecords: 6000, maxMastered: 6000, read: bld.readBldStudy, write: bld.writeBldStudy, readMastered: bld.readMasteredBldCaseKeys, writeMastered: bld.writeMasteredBldCaseKeys, grade: bld.gradeBldCase, exportStudy: bld.exportBldStudy, importStudy: bld.importBldStudy, mod: bld },
  { name: "cfop", store: "cfop-cfop-study-v1", masteredStore: "cfop-studio-mastered-cfop-v1", schema: "cfop-cfop-study", family: "oll", defaultGoal: 12, maxRecords: 2000, maxMastered: 1800, read: cfop.readCfopStudy, write: cfop.writeCfopStudy, readMastered: cfop.readMasteredCfopCaseKeys, writeMastered: cfop.writeMasteredCfopCaseKeys, grade: cfop.gradeCfopCase, exportStudy: cfop.exportCfopStudy, importStudy: cfop.importCfopStudy, mod: cfop },
  { name: "l2e", store: "cfop-5x5l2e-study-v1", masteredStore: "cfop-studio-mastered-5x5l2e-v1", schema: "cfop-5x5l2e-study", family: "l2e", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: l2e.readFiveByFiveL2EStudy, write: l2e.writeFiveByFiveL2EStudy, readMastered: l2e.readMasteredFiveByFiveL2ECaseKeys, writeMastered: l2e.writeMasteredFiveByFiveL2ECaseKeys, grade: l2e.gradeFiveByFiveL2ECase, exportStudy: l2e.exportFiveByFiveL2EStudy, importStudy: l2e.importFiveByFiveL2EStudy, mod: l2e },
  { name: "parity", store: "cfop-4x4parity-study-v1", masteredStore: "cfop-studio-mastered-4x4parity-v1", schema: "cfop-4x4parity-study", family: "pll-parity", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: parity.readFourByFourParityStudy, write: parity.writeFourByFourParityStudy, readMastered: parity.readMasteredFourByFourParityCaseKeys, writeMastered: parity.writeMasteredFourByFourParityCaseKeys, grade: parity.gradeFourByFourParityCase, exportStudy: parity.exportFourByFourParityStudy, importStudy: parity.importFourByFourParityStudy, mod: parity },
  { name: "l2t", store: "cfop-fto-2-look-l3t-study-v1", masteredStore: "cfop-studio-mastered-fto-2-look-l3t-v1", schema: "cfop-fto-2-look-l3t-study", family: "l3t2", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: l2t.readFto2LookL3tStudy, write: l2t.writeFto2LookL3tStudy, readMastered: l2t.readMasteredFto2LookL3tCaseKeys, writeMastered: l2t.writeMasteredFto2LookL3tCaseKeys, grade: l2t.gradeFto2LookL3tCase, exportStudy: l2t.exportFto2LookL3tStudy, importStudy: l2t.importFto2LookL3tStudy, mod: l2t },
  { name: "l3t", store: "cfop-fto-l3t-study-v1", masteredStore: "cfop-studio-mastered-fto-l3t-v1", schema: "cfop-fto-l3t-study", family: "l3t", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: l3t.readFtoL3tStudy, write: l3t.writeFtoL3tStudy, readMastered: l3t.readMasteredFtoL3tCaseKeys, writeMastered: l3t.writeMasteredFtoL3tCaseKeys, grade: l3t.gradeFtoL3tCase, exportStudy: l3t.exportFtoL3tStudy, importStudy: l3t.importFtoL3tStudy, mod: l3t },
  { name: "last-layer", store: "cfop-last-layer-study-v1", masteredStore: "cfop-studio-mastered-last-layer-v1", schema: "cfop-last-layer-study", family: "zbll", defaultGoal: 12, maxRecords: 2000, maxMastered: 1800, read: lastLayer.readLastLayerStudy, write: lastLayer.writeLastLayerStudy, readMastered: lastLayer.readMasteredCaseKeys, writeMastered: lastLayer.writeMasteredCaseKeys, grade: lastLayer.gradeCase, exportStudy: lastLayer.exportLastLayerStudy, importStudy: lastLayer.importLastLayerStudy, mod: lastLayer },
  { name: "pyraminx", store: "cfop-pyraminx-study-v1", masteredStore: "cfop-studio-mastered-pyraminx-v1", schema: "cfop-pyraminx-study", family: "l4e", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: pyraminx.readPyraminxStudy, write: pyraminx.writePyraminxStudy, readMastered: pyraminx.readMasteredPyraminxCaseKeys, writeMastered: pyraminx.writeMasteredPyraminxCaseKeys, grade: pyraminx.gradePyraminxCase, exportStudy: pyraminx.exportPyraminxStudy, importStudy: pyraminx.importPyraminxStudy, mod: pyraminx },
  { name: "skewb", store: "cfop-skewb-study-v1", masteredStore: "cfop-studio-mastered-skewb-v1", schema: "cfop-skewb-study", family: "sarah-advanced", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: skewb.readSkewbStudy, write: skewb.writeSkewbStudy, readMastered: skewb.readMasteredSkewbCaseKeys, writeMastered: skewb.writeMasteredSkewbCaseKeys, grade: skewb.gradeSkewbCase, exportStudy: skewb.exportSkewbStudy, importStudy: skewb.importSkewbStudy, mod: skewb },
  { name: "roux", store: "cfop-roux-study-v1", masteredStore: "cfop-studio-mastered-roux-v1", schema: "cfop-roux-study", family: "cmll", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: roux.readRouxStudy, write: roux.writeRouxStudy, readMastered: roux.readMasteredRouxCaseKeys, writeMastered: roux.writeMasteredRouxCaseKeys, grade: roux.gradeRouxCase, exportStudy: roux.exportRouxStudy, importStudy: roux.importRouxStudy, mod: roux },
  { name: "squareOne", store: "cfop-sq1-study-v1", masteredStore: "cfop-studio-mastered-sq1-v1", schema: "cfop-sq1-study", family: "csp", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: squareOne.readSquareOneStudy, write: squareOne.writeSquareOneStudy, readMastered: squareOne.readMasteredSquareOneCaseKeys, writeMastered: squareOne.writeMasteredSquareOneCaseKeys, grade: squareOne.gradeSquareOneCase, exportStudy: squareOne.exportSquareOneStudy, importStudy: squareOne.importSquareOneStudy, mod: squareOne },
  { name: "twoByTwo", store: "cfop-twobytwo-study-v1", masteredStore: "cfop-studio-mastered-twobytwo-v1", schema: "cfop-twobytwo-study", family: "eg1", defaultGoal: 10, maxRecords: 2000, maxMastered: 1800, read: twoByTwo.readTwoByTwoStudy, write: twoByTwo.writeTwoByTwoStudy, readMastered: twoByTwo.readMasteredTwoByTwoCaseKeys, writeMastered: twoByTwo.writeMasteredTwoByTwoCaseKeys, grade: twoByTwo.gradeTwoByTwoCase, exportStudy: twoByTwo.exportTwoByTwoStudy, importStudy: twoByTwo.importTwoByTwoStudy, mod: twoByTwo },
];

// `prioritizeStudyQueue` luôn dùng giờ thật, nên mốc thời gian của test cũng là giờ thật.
const NOW = Date.now();
const caseOf = (lane: Lane, id: string, group = "G1") =>
  ({ id, family: lane.family, group, name: id, algorithm: "R U R'", state: "" }) as unknown as LastLayerCatalogCase;
const rawRecord = (lane: Lane, id: string, extra: Record<string, unknown> = {}) => ({
  key: `${lane.family}:${id}`, family: lane.family, group: "G1", id,
  attempts: 3, lapses: 1, averageMs: 9000, lastMs: 8000, intervalDays: 2,
  dueAt: NOW + 86_400_000, lastReviewedAt: NOW, lastGrade: "good", ...extra,
});

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe.each(LANES)("lane $name", lane => {
  it("đọc trạng thái rỗng với dailyGoal mặc định", () => {
    expect(lane.read()).toEqual({ records: {}, dailyGoal: lane.defaultGoal });
    window.localStorage.setItem(lane.store, "{not json");
    expect(lane.read()).toEqual({ records: {}, dailyGoal: lane.defaultGoal });
  });

  it("ghi đúng key, đúng định dạng JSON và báo cloud sync", () => {
    let events = 0;
    const listener = () => { events += 1; };
    window.addEventListener(CFOP_CLOUD_SYNC_EVENT, listener);
    const record = lane.grade(caseOf(lane, "A1"), undefined as never, 12_000, "good", NOW);
    lane.write({ records: { [record.key]: record }, dailyGoal: 500 } as never);
    window.removeEventListener(CFOP_CLOUD_SYNC_EVENT, listener);
    expect(events).toBe(1);
    expect(window.localStorage.getItem(lane.store)).toBe(
      JSON.stringify({ schema: lane.schema, version: 1, records: { [record.key]: record }, dailyGoal: 200 }),
    );
    expect(lane.read()).toEqual({ records: { [record.key]: record }, dailyGoal: 200 });
  });

  it("chuẩn hoá bản ghi lỗi, cắt chuỗi và giới hạn số bản ghi", () => {
    const records: Record<string, unknown> = {
      bad: rawRecord(lane, "bad", { family: "not-a-family" }),
      empty: rawRecord(lane, "", {}),
      clamp: rawRecord(lane, "x".repeat(150), { key: "k".repeat(200), group: "g".repeat(80), attempts: -4, lapses: 2.6, averageMs: 9e9, intervalDays: "x", lastGrade: "meh" }),
    };
    for (let index = 0; index < lane.maxRecords + 3; index += 1) records[`r${index}`] = rawRecord(lane, `r${index}`);
    window.localStorage.setItem(lane.store, JSON.stringify({ records, dailyGoal: 0 }));
    const state = lane.read();
    expect(state.dailyGoal).toBe(1);
    expect(Object.keys(state.records)).toHaveLength(lane.maxRecords);
    const clamped = state.records["k".repeat(120)];
    expect(clamped).toEqual({
      key: "k".repeat(120), family: lane.family, group: "g".repeat(60), id: "x".repeat(100),
      attempts: 0, lapses: 3, averageMs: 3_600_000, lastMs: 8000, intervalDays: 0,
      dueAt: NOW + 86_400_000, lastReviewedAt: NOW, lastGrade: "again",
    });
    expect(state.records[`${lane.family}:bad`]).toBeUndefined();
  });

  it("ghi và đọc danh sách case đã thuộc với giới hạn riêng", () => {
    const keys = new Set(Array.from({ length: lane.maxMastered + 3 }, (_, index) => `k${index}`));
    lane.writeMastered(keys);
    const stored = JSON.parse(window.localStorage.getItem(lane.masteredStore) ?? "[]") as string[];
    expect(stored).toHaveLength(lane.maxMastered);
    expect(stored[0]).toBe("k3");
    window.localStorage.setItem(lane.masteredStore, JSON.stringify(["a", 3, null, "b"]));
    expect([...lane.readMastered()]).toEqual(["a", "b"]);
  });

  it("chấm điểm case theo thang SRS chung", () => {
    const item = caseOf(lane, "A1", "Grp");
    const first = lane.grade(item, undefined as never, 12_000, "good", NOW);
    expect(first).toEqual({
      key: `${lane.family}:A1`, family: lane.family, group: "Grp", id: "A1", attempts: 1, lapses: 0,
      averageMs: 12_000, lastMs: 12_000, intervalDays: 1, dueAt: NOW + 86_400_000, lastReviewedAt: NOW, lastGrade: "good",
    });
    const second = lane.grade(item, first as never, 2_000, "again", NOW + 1);
    expect(second).toMatchObject({ attempts: 2, lapses: 1, averageMs: Math.round(12_000 * 0.72 + 2_000 * 0.28), lastGrade: "again" });
    expect(lane.mod.caseKey(item)).toBe(`${lane.family}:A1`);
  });

  it("export/import khứ hồi và từ chối schema lạ", () => {
    const record = lane.grade(caseOf(lane, "A1"), undefined as never, 5_000, "easy", NOW);
    const state = { records: { [record.key]: record }, dailyGoal: 33 };
    const exported = lane.exportStudy(state as never, new Set(["m1", "m2"]));
    expect(Object.keys(exported)).toEqual(["schema", "version", "exportedAt", "study", "masteredCaseKeys"]);
    expect(exported).toMatchObject({ schema: lane.schema, version: 1, study: state, masteredCaseKeys: ["m1", "m2"] });
    const restored = lane.importStudy(JSON.parse(JSON.stringify(exported)));
    expect(restored.state).toEqual(state);
    expect([...restored.masteredKeys]).toEqual(["m1", "m2"]);
    expect(() => lane.importStudy({ ...exported, schema: "other" })).toThrow("Invalid backup");
    expect(() => lane.importStudy(null)).toThrow("Invalid backup");
  });

  it("xếp hàng ôn và lịch tuần cho cùng kết quả ở mọi lane", () => {
    const cases = ["a", "b", "c", "d"].map(id => caseOf(lane, id));
    const records = {
      [`${lane.family}:a`]: rawRecord(lane, "a", { dueAt: NOW - 2 * 86_400_000, lastGrade: "hard" }),
      [`${lane.family}:b`]: rawRecord(lane, "b", { lapses: 0, lastGrade: "easy", dueAt: NOW + 3 * 86_400_000 }),
      [`${lane.family}:c`]: rawRecord(lane, "c", { lastReviewedAt: NOW - 3 * 86_400_000 }),
    };
    const mastered = new Set([`${lane.family}:a`, `${lane.family}:b`]);
    const ids = (list: LastLayerCatalogCase[]) => list.map(item => item.id);
    expect(lane.mod.queueScore(cases[0] as never, records[`${lane.family}:a`] as never, true as never, NOW as never)).toBeCloseTo(-48 * 200 - 600 - 450 - 350);
    expect(ids(lane.mod.prioritizeStudyQueue(cases as never, records as never, mastered as never))).toEqual(["d", "c", "a", "b"]);
    expect(ids(lane.mod.dueAndWeakCases(cases as never, records as never, mastered as never, NOW as never))).toEqual(["d", "c", "a"]);
    expect(lane.mod.todayReviewCount(records as never, new Date(NOW) as never)).toBe(2);
    const week = lane.mod.weeklyReviewSchedule(records as never, new Date(NOW) as never) as { dueCount: number; overdueCount: number; isToday: boolean }[];
    expect(week).toHaveLength(7);
    expect(week.map(day => day.dueCount).reduce((sum, value) => sum + value, 0)).toBe(3);
    expect(week[0]).toMatchObject({ isToday: true, overdueCount: 1 });
  });
});
