import { describe, expect, it } from "vitest";
import { emptyBldProfile } from "./bldProfile";
import { mergeCfopCloudStates, type CfopCloudState } from "./cloudSync";
import type { SolveHistoryEntry } from "./solveHistory";

const solve = (id: string, createdAt: number, elapsedMs: number): SolveHistoryEntry => ({ id, createdAt, elapsedMs, inspectionMs: 0, input: "R U R'", inputKind: "scramble", moves: 3, penalty: "none", solution: "", note: "", tags: [], phaseSplits: [] });

function state(capturedAt: number, timer: SolveHistoryEntry[]): CfopCloudState {
  return {
    schema: "cfop-account-cloud-state",
    version: 1,
    capturedAt,
    timer,
    lastLayer: { study: { records: {}, dailyGoal: 12 }, masteredCaseKeys: [] },
    bldProfile: emptyBldProfile(),
    bldLearningPath: { orientationDone: false, formulaDone: false, memoDone: false, sightedDone: false, selfCheckDone: false, reviewDone: false, lastStage: 0 },
  };
}

describe("mergeCfopCloudStates", () => {
  it("giữ toàn bộ solve có ID khác nhau và ưu tiên bản mới hơn khi cùng ID", () => {
    const local = state(100, [solve("shared", 10, 1_500), solve("local", 30, 2_000)]);
    const remote = state(200, [solve("shared", 10, 1_200), solve("remote", 20, 1_800)]);
    const merged = mergeCfopCloudStates(local, remote, 300);

    expect(merged.timer.map((item) => item.id)).toEqual(["local", "remote", "shared"]);
    expect(merged.timer.find((item) => item.id === "shared")?.elapsedMs).toBe(1_200);
    expect(merged.capturedAt).toBe(300);
  });

  it("gộp case đã thuộc, tiến độ học và ưu tiên record Study mới hơn", () => {
    const local = state(500, []);
    local.lastLayer.masteredCaseKeys = ["zbll:1"];
    local.lastLayer.study.records["zbll:1"] = { key: "zbll:1", family: "zbll", group: "A", id: "1", attempts: 3, lapses: 0, averageMs: 2200, lastMs: 2000, intervalDays: 3, dueAt: 700, lastReviewedAt: 500, lastGrade: "good" };
    local.bldLearningPath.memoDone = true;
    const remote = state(300, []);
    remote.lastLayer.masteredCaseKeys = ["1lll:2"];
    remote.lastLayer.study.records["zbll:1"] = { ...local.lastLayer.study.records["zbll:1"]!, attempts: 1, lastReviewedAt: 300 };
    remote.bldLearningPath.orientationDone = true;

    const merged = mergeCfopCloudStates(local, remote, 600);
    expect(merged.lastLayer.masteredCaseKeys).toEqual(expect.arrayContaining(["zbll:1", "1lll:2"]));
    expect(merged.lastLayer.study.records["zbll:1"]?.attempts).toBe(3);
    expect(merged.bldLearningPath.orientationDone).toBe(true);
    expect(merged.bldLearningPath.memoDone).toBe(true);
  });
});
