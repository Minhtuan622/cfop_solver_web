import { type BldProfile, readBldProfile, writeBldProfile } from "@/features/bld/lib";
import { readBldLearningPath, writeBldLearningPath, type BldLearningPathProgress } from "@/features/bld/lib";
import { readLastLayerStudy, readMasteredCaseKeys, type StudyState, writeLastLayerStudy, writeMasteredCaseKeys } from "@/features/last-layer/lib";
import { readSolveHistory, SolveHistoryEntry, importSolveHistory } from "./solveHistory";
import { readCfopCloudChangeAt } from "./cloudSyncSignal";

export type CfopCloudState = {
  schema: "cfop-account-cloud-state";
  version: 1;
  capturedAt: number;
  timer: SolveHistoryEntry[];
  lastLayer: { study: StudyState; masteredCaseKeys: string[] };
  bldProfile: BldProfile;
  bldLearningPath: BldLearningPathProgress;
};

const maxTimerEntries = 500;
const maxDrillAttempts = 600;

export function createCfopCloudState(now = Date.now()): CfopCloudState {
  return {
    schema: "cfop-account-cloud-state",
    version: 1,
    capturedAt: readCfopCloudChangeAt() || 0,
    timer: readSolveHistory().slice(0, maxTimerEntries),
    lastLayer: { study: readLastLayerStudy(), masteredCaseKeys: Array.from(readMasteredCaseKeys()) },
    bldProfile: readBldProfile(),
    bldLearningPath: readBldLearningPath(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

export function parseCfopCloudState(value: unknown): CfopCloudState | null {
  if (!isRecord(value) || value.schema !== "cfop-account-cloud-state" || value.version !== 1 || !Array.isArray(value.timer) || !isRecord(value.lastLayer)) return null;
  const lastLayer = value.lastLayer;
  if (!Array.isArray(lastLayer.masteredCaseKeys)) return null;
  const state = value as unknown as CfopCloudState;
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
    byId.set(entry.id, existing ? newest(existing, entry, preferLocal) : entry);
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
  if (!remote) return { ...local, capturedAt: now };
  const preferLocal = local.capturedAt >= remote.capturedAt;
  return {
    schema: "cfop-account-cloud-state",
    version: 1,
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
