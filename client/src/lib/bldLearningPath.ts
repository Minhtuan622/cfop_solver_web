export type BldLearningPathProgress = { orientationDone: boolean; formulaDone: boolean; memoDone: boolean; lastStage: number };

const STORAGE_KEY = "cfop-bld-learning-path-v1";

export function readBldLearningPath(): BldLearningPathProgress {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Partial<BldLearningPathProgress>;
    return { orientationDone: Boolean(raw.orientationDone), formulaDone: Boolean(raw.formulaDone), memoDone: Boolean(raw.memoDone), lastStage: Math.min(4, Math.max(0, Number.isInteger(raw.lastStage) ? raw.lastStage! : 0)) };
  } catch {
    return { orientationDone: false, formulaDone: false, memoDone: false, lastStage: 0 };
  }
}

export function writeBldLearningPath(progress: BldLearningPathProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ schema: "cfop-bld-learning-path", version: 1, ...progress }));
}
