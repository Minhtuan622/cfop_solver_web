/**
 * SRS study state for the Skewb lane (Sarah Intermediate and Sarah Advanced).
 *
 * Mirrors the 2×2 / CFOP study engines (same spaced-repetition ladder from
 * `lib/spacedRepetition.ts`) with its own storage keys. Records degrade
 * gracefully via zod.
 */
import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["sarah-intermediate", "sarah-advanced"] as const;

export type SkewbGrade = CaseStudyGrade;
export type SkewbRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type SkewbStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type SkewbWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-skewb-study-v1",
  masteredStorageKey: "cfop-studio-mastered-skewb-v1",
  schema: "cfop-skewb-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const skewbCaseKey = caseStudyKey;
export const readSkewbStudy = store.read;
export const writeSkewbStudy = store.write;
export const readMasteredSkewbCaseKeys = store.readMasteredKeys;
export const writeMasteredSkewbCaseKeys = store.writeMasteredKeys;
export const gradeSkewbCase = store.grade;
export const exportSkewbStudy = store.exportStudy;
export const importSkewbStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { skewbCaseKey as caseKey };
