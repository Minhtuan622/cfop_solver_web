import { beforeEach, describe, expect, it } from "vitest";
import {
  applyCfopCloudState,
  createCfopCloudState,
  MAX_CLOUD_TIMER_ENTRIES,
  MAX_CLOUD_TIMER_TOMBSTONES,
  mergeCfopCloudStates,
  parseCfopCloudState,
} from "@/lib/cloudSync";
import {
  deleteSolveHistory,
  readSolveHistory,
  type SolveHistoryEntry,
} from "@/lib/solveHistory";
import { writeStoredValue } from "@/lib/browserStorage";

function makeEntry(id: string, createdAt: number, deletedAt?: number): SolveHistoryEntry {
  return {
    id,
    createdAt,
    elapsedMs: 10_000,
    inspectionMs: 15_000,
    input: "R U R' U'",
    inputKind: "scramble",
    moves: 7,
    penalty: "none",
    solution: "R U R' U'",
    note: "",
    tags: [],
    phaseSplits: [],
    ...(deletedAt !== undefined ? { deletedAt } : {}),
  };
}

describe("B3: cloud sync tombstones and merge", () => {
  beforeEach(() => {
    localStorage.removeItem("cfop-solve-history-v1");
  });
  it("parseCfopCloudState vẫn đọc được bản schemaVersion 1 (payload cũ dùng `version`)", () => {
    const v1 = {
      schema: "cfop-account-cloud-state",
      version: 1,
      capturedAt: Date.now(),
      timer: [],
      lastLayer: { study: { records: {}, dailyGoal: 0 }, masteredCaseKeys: [] },
      bldProfile: { preferredAlgorithms: {}, memoRecords: {}, pairCards: {}, drillAttempts: [], reviewDays: [], audioEnabled: true, dailyGoal: 0 },
      bldLearningPath: { orientationDone: false, formulaDone: false, memoDone: false, sightedDone: false, selfCheckDone: false, reviewDone: false, lastStage: 0 },
    };
    const parsed = parseCfopCloudState(v1);
    expect(parsed).not.toBeNull();
    expect(parsed?.schemaVersion).toBe(1);
  });

  it("createCfopCloudState tạo bản schemaVersion 2", () => {
    const state = createCfopCloudState();
    expect(state.schemaVersion).toBe(2);
    expect(state.twoByTwo).toBeDefined();
    expect(state.pyraminx).toBeDefined();
    expect(state.skewb).toBeDefined();
    expect(state.sq1).toBeDefined();
    expect(state.parity).toBeDefined();
    expect(state.l2e).toBeDefined();
    expect(state.l3t).toBeDefined();
    expect(state.l3t2).toBeDefined();
  });

  it("parseCfopCloudState đọc được payload có twoByTwo và merge giữ 2×2 records", () => {
    const local = createCfopCloudState();
    local.twoByTwo = {
      study: {
        records: {
          "cll:CLL-AS-1": {
            key: "cll:CLL-AS-1",
            family: "cll",
            group: "AS",
            id: "CLL-AS-1",
            attempts: 5,
            lapses: 1,
            averageMs: 12_000,
            lastMs: 10_000,
            intervalDays: 4,
            dueAt: Date.now() + 200_000,
            lastReviewedAt: Date.now() - 1000,
            lastGrade: "good",
          },
        },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["cll:CLL-AS-1"],
    };
    const remote = createCfopCloudState();
    remote.twoByTwo = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };

    const merged = mergeCfopCloudStates(local, remote);
    expect(merged.twoByTwo?.study.records["cll:CLL-AS-1"]?.attempts).toBe(5);
    expect(merged.twoByTwo?.masteredCaseKeys).toContain("cll:CLL-AS-1");

    const parsed = parseCfopCloudState(JSON.parse(JSON.stringify(merged)));
    expect(parsed?.twoByTwo?.study.records["cll:CLL-AS-1"]?.intervalDays).toBe(4);
  });

  it("merge giữ pyraminx/skewb records và masteredCaseKeys", () => {
    const recordFor = <F extends string>(family: F, id: string, intervalDays: number) => ({
      key: `${family}:${id}`,
      family,
      group: "X",
      id,
      attempts: 3,
      lapses: 0,
      averageMs: 9_000,
      lastMs: 8_000,
      intervalDays,
      dueAt: Date.now() + 200_000,
      lastReviewedAt: Date.now() - 1_000,
      lastGrade: "good" as const,
    });
    const local = createCfopCloudState();
    local.pyraminx = {
      study: {
        records: { "l4e:L4E-DES-1": recordFor("l4e", "L4E-DES-1", 3) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["l4e:L4E-DES-1"],
    };
    local.skewb = {
      study: {
        records: { "sarah-intermediate:SI-Sledgehammer": recordFor("sarah-intermediate", "SI-Sledgehammer", 2) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["sarah-intermediate:SI-Sledgehammer"],
    };
    const remote = createCfopCloudState();
    remote.pyraminx = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };
    remote.skewb = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };

    const merged = mergeCfopCloudStates(local, remote);
    expect(merged.pyraminx?.study.records["l4e:L4E-DES-1"]?.attempts).toBe(3);
    expect(merged.pyraminx?.masteredCaseKeys).toContain("l4e:L4E-DES-1");
    expect(merged.skewb?.study.records["sarah-intermediate:SI-Sledgehammer"]?.attempts).toBe(3);
    expect(merged.skewb?.masteredCaseKeys).toContain("sarah-intermediate:SI-Sledgehammer");

    const parsed = parseCfopCloudState(JSON.parse(JSON.stringify(merged)));
    expect(parsed?.pyraminx?.study.records["l4e:L4E-DES-1"]?.intervalDays).toBe(3);
    expect(parsed?.skewb?.study.records["sarah-intermediate:SI-Sledgehammer"]?.intervalDays).toBe(2);
  });

  it("merge giữ sq1/parity/l2e/l3t/l3t2 records và masteredCaseKeys", () => {
    const recordFor = <F extends string>(family: F, id: string, intervalDays: number) => ({
      key: `${family}:${id}`,
      family,
      group: "L2E",
      id,
      attempts: 4,
      lapses: 0,
      averageMs: 15_000,
      lastMs: 14_000,
      intervalDays,
      dueAt: Date.now() + 200_000,
      lastReviewedAt: Date.now() - 1_000,
      lastGrade: "good" as const,
    });
    const local = createCfopCloudState();
    local.sq1 = {
      study: {
        records: { "cs:Kite-Kite": recordFor("cs", "Kite-Kite", 5) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["cs:Kite-Kite"],
    };
    local.parity = {
      study: {
        records: { "pll-parity:OPP-Parity": recordFor("pll-parity", "OPP-Parity", 6) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["pll-parity:OPP-Parity"],
    };
    local.l2e = {
      study: {
        records: { "l2e:L2E-1": recordFor("l2e", "L2E-1", 7) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["l2e:L2E-1"],
    };
    local.l3t = {
      study: {
        records: { "l3t:TL-1": recordFor("l3t", "TL-1", 8) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["l3t:TL-1"],
    };
    local.l3t2 = {
      study: {
        records: { "l3t2:TCP-A1": recordFor("l3t2", "TCP-A1", 9) },
        dailyGoal: 10,
      },
      masteredCaseKeys: ["l3t2:TCP-A1"],
    };
    const remote = createCfopCloudState();
    remote.sq1 = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };
    remote.parity = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };
    remote.l2e = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };
    remote.l3t = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };
    remote.l3t2 = { study: { records: {}, dailyGoal: 10 }, masteredCaseKeys: [] };

    const merged = mergeCfopCloudStates(local, remote);
    expect(merged.sq1?.study.records["cs:Kite-Kite"]?.attempts).toBe(4);
    expect(merged.sq1?.masteredCaseKeys).toContain("cs:Kite-Kite");
    expect(merged.parity?.study.records["pll-parity:OPP-Parity"]?.attempts).toBe(4);
    expect(merged.parity?.masteredCaseKeys).toContain("pll-parity:OPP-Parity");
    expect(merged.l2e?.study.records["l2e:L2E-1"]?.attempts).toBe(4);
    expect(merged.l2e?.masteredCaseKeys).toContain("l2e:L2E-1");
    expect(merged.l3t?.study.records["l3t:TL-1"]?.attempts).toBe(4);
    expect(merged.l3t?.masteredCaseKeys).toContain("l3t:TL-1");
    expect(merged.l3t2?.study.records["l3t2:TCP-A1"]?.attempts).toBe(4);
    expect(merged.l3t2?.masteredCaseKeys).toContain("l3t2:TCP-A1");

    const parsed = parseCfopCloudState(JSON.parse(JSON.stringify(merged)));
    expect(parsed?.sq1?.study.records["cs:Kite-Kite"]?.intervalDays).toBe(5);
    expect(parsed?.parity?.study.records["pll-parity:OPP-Parity"]?.intervalDays).toBe(6);
    expect(parsed?.l2e?.study.records["l2e:L2E-1"]?.intervalDays).toBe(7);
    expect(parsed?.l3t?.study.records["l3t:TL-1"]?.intervalDays).toBe(8);
    expect(parsed?.l3t2?.study.records["l3t2:TCP-A1"]?.intervalDays).toBe(9);
  });

  it("payload cũ không có twoByTwo vẫn hợp lệ và merge giữ nguyên", () => {
    const local = createCfopCloudState();
    const parsed = parseCfopCloudState({
      schema: "cfop-account-cloud-state",
      version: 2,
      capturedAt: Date.now(),
      schemaVersion: 2,
      timer: [],
      lastLayer: { study: { records: {}, dailyGoal: 0 }, masteredCaseKeys: [] },
      bldProfile: { preferredAlgorithms: {}, memoRecords: {}, pairCards: {}, drillAttempts: [], reviewDays: [], audioEnabled: true, dailyGoal: 0 },
      bldLearningPath: { orientationDone: false, formulaDone: false, memoDone: false, sightedDone: false, selfCheckDone: false, reviewDone: false, lastStage: 0 },
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.twoByTwo).toBeUndefined();
    expect(local.twoByTwo).toBeDefined();
  });

  it("xóa cục bộ rồi gộp với bản từ xa cũ giữ kết quả đã xóa (tombstone)", () => {
    const now = Date.now();
    // Ghi entry vào local storage trực tiếp (giữ ID cố định)
    writeStoredValue(
      "cfop-solve-history-v1",
      JSON.stringify([makeEntry("solve-to-delete", now - 1000)]),
    );
    expect(readSolveHistory().some((e) => e.id === "solve-to-delete")).toBe(true);

    // Xóa cục bộ → tombstone (deletedAt được ghi, entry bị lọc khỏi readSolveHistory)
    deleteSolveHistory("solve-to-delete");
    expect(readSolveHistory().some((e) => e.id === "solve-to-delete")).toBe(false);

    // Lấy tombstone trực tiếp từ localStorage (bypass bộ lọc readSolveHistory)
    const raw = JSON.parse(localStorage.getItem("cfop-solve-history-v1") || "[]") as SolveHistoryEntry[];
    const tombstoned = raw.find((e) => e.id === "solve-to-delete");
    expect(tombstoned?.deletedAt).toBeDefined();

    // Bản từ xa KHÔNG có entry này (bản cũ, chưa biết về việc xóa)
    const remoteState = createCfopCloudState();
    remoteState.timer = [];

    // Local state kèm tombstone (mô phỏng local storage chưa được apply merge)
    const localWithTombstone = createCfopCloudState();
    localWithTombstone.timer = [tombstoned!];
    const merged = mergeCfopCloudStates(localWithTombstone, remoteState);

    // Sau merge, entry đã xóa vẫn có deletedAt → không hồi sinh
    const deletedEntry = merged.timer.find((e) => e.id === "solve-to-delete");
    expect(deletedEntry?.deletedAt).toBeDefined();
  });

  it("hai thiết bị ghi xen kẽ không mất dữ liệu (interleaved writes)", () => {
    // Thiết bị A thêm solve A1, A2; thiết bị B thêm solve B1, B2
    const base = Date.now() - 100_000;
    const localEntries = [makeEntry("local-1", base + 1000), makeEntry("local-2", base + 2000)];
    const remoteEntries = [makeEntry("remote-1", base + 1500), makeEntry("remote-2", base + 2500)];

    const local = createCfopCloudState();
    local.timer = localEntries;
    const remote = createCfopCloudState();
    remote.timer = remoteEntries;

    const merged = mergeCfopCloudStates(local, remote);

    // Tất cả 4 entry phải tồn tại sau merge
    const ids = new Set(merged.timer.map((e) => e.id));
    expect(ids.has("local-1")).toBe(true);
    expect(ids.has("local-2")).toBe(true);
    expect(ids.has("remote-1")).toBe(true);
    expect(ids.has("remote-2")).toBe(true);
    expect(merged.timer.length).toBe(4);
  });

  it("mergeTimer không vượt quá MAX_CLOUD_TIMER_ENTRIES", () => {
    const many = Array.from({ length: MAX_CLOUD_TIMER_ENTRIES + 100 }, (_, i) =>
      makeEntry(`bulk-${i}`, Date.now() - i),
    );
    const local = createCfopCloudState();
    local.timer = many;
    const remote = createCfopCloudState();
    remote.timer = [];
    const merged = mergeCfopCloudStates(local, remote);
    expect(merged.timer.length).toBe(MAX_CLOUD_TIMER_ENTRIES);
  });

  it("MAX_CLOUD_TIMER_ENTRIES có giá trị 500", () => {
    expect(MAX_CLOUD_TIMER_ENTRIES).toBe(500);
  });

  it("gửi tombstone kèm bản đồng bộ để máy khác cũng xoá theo", () => {
    const now = Date.now();
    writeStoredValue(
      "cfop-solve-history-v1",
      JSON.stringify([makeEntry("keep", now - 1000), makeEntry("gone", now - 2000)]),
    );
    deleteSolveHistory("gone");
    const local = createCfopCloudState();
    expect(local.timer.map(entry => entry.id).sort()).toEqual(["gone", "keep"]);
    expect(local.timer.find(entry => entry.id === "gone")?.deletedAt).toBeGreaterThan(0);

    // Máy khác vẫn còn "gone" (bản cũ): sau khi gộp và áp dụng, "gone" bị xoá ở đó.
    localStorage.removeItem("cfop-solve-history-v1");
    const otherDevice = createCfopCloudState();
    otherDevice.timer = [makeEntry("keep", now - 1000), makeEntry("gone", now - 2000)];
    applyCfopCloudState(mergeCfopCloudStates(otherDevice, local));
    expect(readSolveHistory().map(entry => entry.id)).toEqual(["keep"]);
  });

  it("gộp giữ tối đa 500 lượt đang hiển thị cộng tối đa 100 tombstone", () => {
    const now = Date.now();
    const live = Array.from({ length: MAX_CLOUD_TIMER_ENTRIES + 20 }, (_, i) => makeEntry(`live-${i}`, now - i));
    const dead = Array.from({ length: MAX_CLOUD_TIMER_TOMBSTONES + 20 }, (_, i) => makeEntry(`dead-${i}`, now - 10_000 - i, now - i));
    const local = createCfopCloudState();
    local.timer = [...live, ...dead];
    const remote = createCfopCloudState();
    remote.timer = [];
    const merged = mergeCfopCloudStates(local, remote);
    expect(merged.timer.filter(entry => !entry.deletedAt)).toHaveLength(MAX_CLOUD_TIMER_ENTRIES);
    expect(merged.timer.filter(entry => entry.deletedAt)).toHaveLength(MAX_CLOUD_TIMER_TOMBSTONES);
    // Lượt đang hiển thị mới nhất được giữ, tombstone mới xoá nhất được giữ.
    expect(merged.timer.some(entry => entry.id === "live-0")).toBe(true);
    expect(merged.timer.some(entry => entry.id === "dead-0")).toBe(true);
    expect(merged.timer.some(entry => entry.id === `dead-${MAX_CLOUD_TIMER_TOMBSTONES + 19}`)).toBe(false);
  });
});
