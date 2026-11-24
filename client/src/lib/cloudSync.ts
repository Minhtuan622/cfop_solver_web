import { type BldProfile, readBldProfile, writeBldProfile } from "@/features/bld/lib";
import { readBldLearningPath, writeBldLearningPath, type BldLearningPathProgress } from "@/features/bld/lib";
import { readLastLayerStudy, readMasteredCaseKeys, type StudyState, writeLastLayerStudy, writeMasteredCaseKeys } from "@/features/last-layer/lib";
import { readTwoByTwoStudy, readMasteredTwoByTwoCaseKeys, type TwoByTwoStudyState, writeTwoByTwoStudy, writeMasteredTwoByTwoCaseKeys } from "@/features/twoByTwo/lib/twoByTwoStudy";
import { readPyraminxStudy, readMasteredPyraminxCaseKeys, type PyraminxStudyState, writePyraminxStudy, writeMasteredPyraminxCaseKeys } from "@/features/pyraminx/lib/pyraminxStudy";
import { readRouxStudy, readMasteredRouxCaseKeys, type RouxStudyState, writeRouxStudy, writeMasteredRouxCaseKeys } from "@/features/roux/lib/rouxStudy";
import { readSkewbStudy, readMasteredSkewbCaseKeys, type SkewbStudyState, writeSkewbStudy, writeMasteredSkewbCaseKeys } from "@/features/skewb/lib/skewbStudy";
import { readSquareOneStudy, readMasteredSquareOneCaseKeys, type SquareOneStudyState, writeSquareOneStudy, writeMasteredSquareOneCaseKeys } from "@/features/squareOne/lib/squareOneStudy";
import { readFourByFourParityStudy, readMasteredFourByFourParityCaseKeys, type FourByFourParityStudyState, writeFourByFourParityStudy, writeMasteredFourByFourParityCaseKeys } from "@/features/fourByFourParity/lib/fourByFourParityStudy";
import { readFiveByFiveL2EStudy, readMasteredFiveByFiveL2ECaseKeys, type FiveByFiveL2EStudyState, writeFiveByFiveL2EStudy, writeMasteredFiveByFiveL2ECaseKeys } from "@/features/fiveByFiveL2E/lib/l2eStudy";
import { readFtoL3tStudy, readMasteredFtoL3tCaseKeys, type FtoL3tStudyState, writeFtoL3tStudy, writeMasteredFtoL3tCaseKeys } from "@/features/ftoL3t/lib/l3tStudy";
import { readFto2LookL3tStudy, readMasteredFto2LookL3tCaseKeys, type Fto2LookL3tStudyState, writeFto2LookL3tStudy, writeMasteredFto2LookL3tCaseKeys } from "@/features/fto2LookL3t/lib/l2tStudy";
import { readStoredSolveHistory, SolveHistoryEntry, importSolveHistory, MAX_SOLVE_TOMBSTONES } from "./solveHistory";
import { readCfopCloudChangeAt } from "./cloudSyncSignal";

export type CfopCloudState = {
  schema: "cfop-account-cloud-state";
  schemaVersion: 1 | 2;
  capturedAt: number;
  timer: SolveHistoryEntry[];
  lastLayer: { study: StudyState; masteredCaseKeys: string[] };
  bldProfile: BldProfile;
  bldLearningPath: BldLearningPathProgress;
  twoByTwo?: { study: TwoByTwoStudyState; masteredCaseKeys: string[] };
  pyraminx?: { study: PyraminxStudyState; masteredCaseKeys: string[] };
  skewb?: { study: SkewbStudyState; masteredCaseKeys: string[] };
  roux?: { study: RouxStudyState; masteredCaseKeys: string[] };
  sq1?: { study: SquareOneStudyState; masteredCaseKeys: string[] };
  parity?: { study: FourByFourParityStudyState; masteredCaseKeys: string[] };
  l2e?: { study: FiveByFiveL2EStudyState; masteredCaseKeys: string[] };
  l3t?: { study: FtoL3tStudyState; masteredCaseKeys: string[] };
  l3t2?: { study: Fto2LookL3tStudyState; masteredCaseKeys: string[] };
};

export const MAX_CLOUD_TIMER_ENTRIES = 500;

const maxTimerEntries = MAX_CLOUD_TIMER_ENTRIES;
export const MAX_CLOUD_TIMER_TOMBSTONES = MAX_SOLVE_TOMBSTONES;

export const MAX_CLOUD_MOVE_TRACES = 200;

function capTimerEntries(entries: SolveHistoryEntry[]) {
  let traces = 0;
  const live = entries
    .filter(entry => !entry.deletedAt)
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, maxTimerEntries)
    .map(entry => {
      if (!entry.moveTimes) return entry;
      traces += 1;
      if (traces <= MAX_CLOUD_MOVE_TRACES) return entry;
      const { moveTimes: _dropped, ...rest } = entry;
      return rest;
    });
  const tombstones = entries
    .filter(entry => entry.deletedAt)
    .sort((left, right) => (right.deletedAt ?? 0) - (left.deletedAt ?? 0))
    .slice(0, MAX_CLOUD_TIMER_TOMBSTONES);
  return [...live, ...tombstones].sort((left, right) => right.createdAt - left.createdAt);
}
const maxDrillAttempts = 600;

export function createCfopCloudState(now = Date.now()): CfopCloudState {
  return {
    schema: "cfop-account-cloud-state",
    schemaVersion: 2,
    capturedAt: readCfopCloudChangeAt() || 0,
    timer: capTimerEntries(readStoredSolveHistory()),
    lastLayer: { study: readLastLayerStudy(), masteredCaseKeys: Array.from(readMasteredCaseKeys()) },
    bldProfile: readBldProfile(),
    bldLearningPath: readBldLearningPath(),
    twoByTwo: {
      study: readTwoByTwoStudy(),
      masteredCaseKeys: Array.from(readMasteredTwoByTwoCaseKeys()),
    },
    pyraminx: {
      study: readPyraminxStudy(),
      masteredCaseKeys: Array.from(readMasteredPyraminxCaseKeys()),
    },
    skewb: {
      study: readSkewbStudy(),
      masteredCaseKeys: Array.from(readMasteredSkewbCaseKeys()),
    },
    roux: {
      study: readRouxStudy(),
      masteredCaseKeys: Array.from(readMasteredRouxCaseKeys()),
    },
    sq1: {
      study: readSquareOneStudy(),
      masteredCaseKeys: Array.from(readMasteredSquareOneCaseKeys()),
    },
    parity: {
      study: readFourByFourParityStudy(),
      masteredCaseKeys: Array.from(readMasteredFourByFourParityCaseKeys()),
    },
    l2e: {
      study: readFiveByFiveL2EStudy(),
      masteredCaseKeys: Array.from(readMasteredFiveByFiveL2ECaseKeys()),
    },
    l3t: {
      study: readFtoL3tStudy(),
      masteredCaseKeys: Array.from(readMasteredFtoL3tCaseKeys()),
    },
    l3t2: {
      study: readFto2LookL3tStudy(),
      masteredCaseKeys: Array.from(readMasteredFto2LookL3tCaseKeys()),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

export function parseCfopCloudState(value: unknown): CfopCloudState | null {
  if (!isRecord(value) || value.schema !== "cfop-account-cloud-state" || !Array.isArray(value.timer) || !isRecord(value.lastLayer)) return null;
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
    const localDeleted = !!entry.deletedAt;
    const remoteDeleted = !!existing.deletedAt;
    if (localDeleted || remoteDeleted) {
      const tombstone = localDeleted && (!remoteDeleted || (entry.deletedAt ?? 0) >= (existing.deletedAt ?? 0)) ? entry : existing;
      byId.set(entry.id, tombstone);
      continue;
    }
    byId.set(entry.id, newest(existing, entry, preferLocal));
  }
  return capTimerEntries(Array.from(byId.values()));
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

function mergeLaneProgress<Study extends { records: Record<string, { lastReviewedAt: number }>; dailyGoal: number }>(
  local: { study: Study; masteredCaseKeys: string[] } | undefined,
  remote: { study: Study; masteredCaseKeys: string[] } | undefined,
  preferLocal: boolean,
): { study: Study; masteredCaseKeys: string[] } | undefined {
  if (!local) return remote;
  if (!remote) return local;
  const records = { ...remote.study.records };
  for (const [key, record] of Object.entries(local.study.records)) {
    const existing = records[key];
    records[key] = !existing || record.lastReviewedAt > existing.lastReviewedAt || (record.lastReviewedAt === existing.lastReviewedAt && preferLocal) ? record : existing;
  }
  const study = { records, dailyGoal: preferLocal ? local.study.dailyGoal : remote.study.dailyGoal } as Study;
  return {
    study,
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
    twoByTwo: mergeLaneProgress(local.twoByTwo, remote.twoByTwo, preferLocal),
    pyraminx: mergeLaneProgress(local.pyraminx, remote.pyraminx, preferLocal),
    skewb: mergeLaneProgress(local.skewb, remote.skewb, preferLocal),
    roux: mergeLaneProgress(local.roux, remote.roux, preferLocal),
    sq1: mergeLaneProgress(local.sq1, remote.sq1, preferLocal),
    parity: mergeLaneProgress(local.parity, remote.parity, preferLocal),
    l2e: mergeLaneProgress(local.l2e, remote.l2e, preferLocal),
    l3t: mergeLaneProgress(local.l3t, remote.l3t, preferLocal),
    l3t2: mergeLaneProgress(local.l3t2, remote.l3t2, preferLocal),
  };
}

export function applyCfopCloudState(state: CfopCloudState) {
  importSolveHistory(state.timer);
  writeLastLayerStudy(state.lastLayer.study);
  writeMasteredCaseKeys(new Set(state.lastLayer.masteredCaseKeys));
  writeBldProfile(state.bldProfile);
  writeBldLearningPath(state.bldLearningPath);
  if (state.twoByTwo) {
    writeTwoByTwoStudy(state.twoByTwo.study);
    writeMasteredTwoByTwoCaseKeys(new Set(state.twoByTwo.masteredCaseKeys));
  }
  if (state.pyraminx) {
    writePyraminxStudy(state.pyraminx.study);
    writeMasteredPyraminxCaseKeys(new Set(state.pyraminx.masteredCaseKeys));
  }
  if (state.skewb) {
    writeSkewbStudy(state.skewb.study);
    writeMasteredSkewbCaseKeys(new Set(state.skewb.masteredCaseKeys));
  }
  if (state.roux) {
    writeRouxStudy(state.roux.study);
    writeMasteredRouxCaseKeys(new Set(state.roux.masteredCaseKeys));
  }
  if (state.sq1) {
    writeSquareOneStudy(state.sq1.study);
    writeMasteredSquareOneCaseKeys(new Set(state.sq1.masteredCaseKeys));
  }
  if (state.parity) {
    writeFourByFourParityStudy(state.parity.study);
    writeMasteredFourByFourParityCaseKeys(new Set(state.parity.masteredCaseKeys));
  }
  if (state.l2e) {
    writeFiveByFiveL2EStudy(state.l2e.study);
    writeMasteredFiveByFiveL2ECaseKeys(new Set(state.l2e.masteredCaseKeys));
  }
  if (state.l3t) {
    writeFtoL3tStudy(state.l3t.study);
    writeMasteredFtoL3tCaseKeys(new Set(state.l3t.masteredCaseKeys));
  }
  if (state.l3t2) {
    writeFto2LookL3tStudy(state.l3t2.study);
    writeMasteredFto2LookL3tCaseKeys(new Set(state.l3t2.masteredCaseKeys));
  }
}
