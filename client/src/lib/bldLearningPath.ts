import { notifyCfopCloudStateChanged } from "./cloudSyncSignal";

export type BldLearningPathProgress = { orientationDone: boolean; formulaDone: boolean; memoDone: boolean; sightedDone: boolean; selfCheckDone: boolean; reviewDone: boolean; lastStage: number };

const STORAGE_KEY = "cfop-bld-learning-path-v1";

export function readBldLearningPath(): BldLearningPathProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<BldLearningPathProgress>;
    return { orientationDone: Boolean(raw.orientationDone), formulaDone: Boolean(raw.formulaDone), memoDone: Boolean(raw.memoDone), sightedDone: Boolean(raw.sightedDone), selfCheckDone: Boolean(raw.selfCheckDone), reviewDone: Boolean(raw.reviewDone), lastStage: Math.min(4, Math.max(0, Number.isInteger(raw.lastStage) ? raw.lastStage! : 0)) };
  } catch {
    return { orientationDone: false, formulaDone: false, memoDone: false, sightedDone: false, selfCheckDone: false, reviewDone: false, lastStage: 0 };
  }
}

export function writeBldLearningPath(progress: BldLearningPathProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: "cfop-bld-learning-path", version: 2, ...progress }));
  notifyCfopCloudStateChanged();
}
