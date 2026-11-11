import { type BldProfile, readBldProfile, writeBldProfile } from "@/features/bld/lib";
import { readBldLearningPath, writeBldLearningPath, type BldLearningPathProgress } from "@/features/bld/lib";
import { readLastLayerStudy, readMasteredCaseKeys, type StudyState, writeLastLayerStudy, writeMasteredCaseKeys } from "@/features/last-layer/lib";
import { readSolveHistory, SolveHistoryEntry, importSolveHistory } from "./solveHistory";
import { readCfopCloudChangeAt } from "./cloudSyncSignal";

export type CfopCloudState = {
  schema: "cfop-account-cloud-state";
  /**
   * Định dạng của payload (1 hoặc 2). KHÁC với `revision` — bộ đếm của dòng
   * cloud state trên máy chủ, tăng sau mỗi lần ghi và dùng để phát hiện
   * client đang giữ bản cũ.
   */
  schemaVersion: 1 | 2;
  capturedAt: number;
  timer: SolveHistoryEntry[];
  lastLayer: { study: StudyState; masteredCaseKeys: string[] };
  bldProfile: BldProfile;
  bldLearningPath: BldLearningPathProgress;
};

/** Giới hạn số lượng solve lưu trong lịch sử cloud state (dùng chung client/server). */
export const MAX_CLOUD_TIMER_ENTRIES = 500;

const maxTimerEntries = MAX_CLOUD_TIMER_ENTRIES;
const maxDrillAttempts = 600;

export function createCfopCloudState(now = Date.now()): CfopCloudState {
  return {
    schema: "cfop-account-cloud-state",
    schemaVersion: 2,
    capturedAt: readCfopCloudChangeAt() || 0,
    timer: readSolveHistory().slice(0, maxTimerEntries),
    lastLayer: { study: readLastLayerStudy(), masteredCaseKeys: Array.from(readMasteredCaseKeys()) },
    bldProfile: readBldProfile(),
    bldLearningPath: readBldLearningPath(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

export function parseCfopCloudState(value: unknown): CfopCloudState | null {
  if (!isRecord(value) || value.schema !== "cfop-account-cloud-state" || !Array.isArray(value.timer) || !isRecord(value.lastLayer)) return null;
  // Payload cũ lưu `version`; payload mới lưu `schemaVersion`. Đọc được cả hai
  // để không mất dữ liệu của tài khoản đã đồng bộ trước đây.
  const rawVersion = value.schemaVersion ?? value.version;
  if (rawVersion !== 1 && rawVersion !== 2) return null;
  const lastLayer = value.lastLayer;
  if (!Array.isArray(lastLayer.masteredCaseKeys)) return null;
  const state = value as unknown as CfopCloudState;
  state.schemaVersion = rawVersion;
  return Number.isFinite(state.capturedAt) && state.capturedAt >= 0 ? state : null;
}

function newest<T extends { createdAt?: number }>(left: T, right: T, preferRight: boolean) {
  const leftTime = left.createdAt ?? 0;
  const rightTime = right.createdAt ?? 0;
  return rightTime > leftTime || (rightTime === leftTime && preferRight) ? right : left;
}

function mergeTimer(local: SolveHistoryEntry[], remote: SolveHistoryEntry[], preferLocal: boolean) {
  const byId = new Map<string, SolveHistoryEntry>();
  for (const entry of remote) byId.set(entry.id, entry);
  for (const entry of local) {
    const existing = byId.get(entry.id);
    if (!existing) {
      byId.set(entry.id, entry);
      continue;
    }
    // Tombstone (deletedAt) luôn thắng: nếu bất kỳ bên nào đánh dấu xóa,
    // entry được coi là đã xóa để không bị khôi phục lại từ bản từ xa cũ.
    const localDeleted = !!entry.deletedAt;
    const remoteDeleted = !!existing.deletedAt;
    if (localDeleted || remoteDeleted) {
      const tombstone = localDeleted && (!remoteDeleted || (entry.deletedAt ?? 0) >= (existing.deletedAt ?? 0)) ? entry : existing;
      byId.set(entry.id, tombstone);
      continue;
    }
    byId.set(entry.id, newest(existing, entry, preferLocal));
  }
  return Array.from(byId.values()).sort((left, right) => right.createdAt - left.createdAt).slice(0, maxTimerEntries);
}

function mergeLastLayer(local: CfopCloudState["lastLayer"], remote: CfopCloudState["lastLayer"], preferLocal: boolean) {
  const records = { ...remote.study.records };
  for (const [key, record] of Object.entries(local.study.records)) {
    const existing = records[key];
    records[key] = !existing || record.lastReviewedAt > existing.lastReviewedAt || (record.lastReviewedAt === existing.lastReviewedAt && preferLocal) ? record : existing;
  }
  return {
    study: { records, dailyGoal: preferLocal ? local.study.dailyGoal : remote.study.dailyGoal },
    masteredCaseKeys: Array.from(new Set([...remote.masteredCaseKeys, ...local.masteredCaseKeys])).slice(-1800),
  };
}

function mergeBldProfile(local: BldProfile, remote: BldProfile, preferLocal: boolean): BldProfile {
  const preferredAlgorithms = { ...remote.preferredAlgorithms };
  for (const [key, value] of Object.entries(local.preferredAlgorithms)) {
    const existing = preferredAlgorithms[key];
    if (!existing || value.updatedAt > existing.updatedAt || (value.updatedAt === existing.updatedAt && preferLocal)) preferredAlgorithms[key] = value;
  }
  const memoRecords = { ...remote.memoRecords };
  for (const [key, value] of Object.entries(local.memoRecords)) {
    const existing = memoRecords[key];
    if (!existing || value.lastReviewedAt > existing.lastReviewedAt || (value.lastReviewedAt === existing.lastReviewedAt && preferLocal)) memoRecords[key] = value;
  }
  const pairCards = { ...remote.pairCards };
  for (const [key, value] of Object.entries(local.pairCards)) {
    const existing = pairCards[key];
    if (!existing || value.updatedAt > existing.updatedAt || (value.updatedAt === existing.updatedAt && preferLocal)) pairCards[key] = value;
  }
  const drill = new Map(remote.drillAttempts.map((item) => [item.id, item]));
  for (const item of local.drillAttempts) drill.set(item.id, item);
  return {
    preferredAlgorithms,
    memoRecords,
    pairCards,
    drillAttempts: Array.from(drill.values()).sort((left, right) => right.createdAt - left.createdAt).slice(0, maxDrillAttempts),
    reviewDays: Array.from(new Set([...remote.reviewDays, ...local.reviewDays])).sort().slice(-1600),
    audioEnabled: preferLocal ? local.audioEnabled : remote.audioEnabled,
    dailyGoal: preferLocal ? local.dailyGoal : remote.dailyGoal,
  };
}

export function mergeCfopCloudStates(local: CfopCloudState, remote: CfopCloudState | null, now = Date.now()): CfopCloudState {
  if (!remote) return { ...local, schemaVersion: 2, capturedAt: now };
  const preferLocal = local.capturedAt >= remote.capturedAt;
  return {
    schema: "cfop-account-cloud-state",
    schemaVersion: 2,
    capturedAt: now,
    timer: mergeTimer(local.timer, remote.timer, preferLocal),
    lastLayer: mergeLastLayer(local.lastLayer, remote.lastLayer, preferLocal),
    bldProfile: mergeBldProfile(local.bldProfile, remote.bldProfile, preferLocal),
    bldLearningPath: {
      orientationDone: local.bldLearningPath.orientationDone || remote.bldLearningPath.orientationDone,
      formulaDone: local.bldLearningPath.formulaDone || remote.bldLearningPath.formulaDone,
      memoDone: local.bldLearningPath.memoDone || remote.bldLearningPath.memoDone,
      sightedDone: local.bldLearningPath.sightedDone || remote.bldLearningPath.sightedDone,
      selfCheckDone: local.bldLearningPath.selfCheckDone || remote.bldLearningPath.selfCheckDone,
      reviewDone: local.bldLearningPath.reviewDone || remote.bldLearningPath.reviewDone,
      lastStage: Math.max(local.bldLearningPath.lastStage, remote.bldLearningPath.lastStage),
    },
  };
}

export function applyCfopCloudState(state: CfopCloudState) {
  importSolveHistory(state.timer);
  writeLastLayerStudy(state.lastLayer.study);
  writeMasteredCaseKeys(new Set(state.lastLayer.masteredCaseKeys));
  writeBldProfile(state.bldProfile);
  writeBldLearningPath(state.bldLearningPath);
}
