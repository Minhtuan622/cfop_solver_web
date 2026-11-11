import { beforeEach, describe, expect, it } from "vitest";
import {
  createCfopCloudState,
  MAX_CLOUD_TIMER_ENTRIES,
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
});
