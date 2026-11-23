/**
 * SRS study state for the 2×2 lane (both CLL and PBL).
 *
 * Mirrors the CFOP study engine (same spaced-repetition ladder from
 * `lib/spacedRepetition.ts`) with its own storage keys, so 2×2 progress never
 * mixes with 3×3 CFOP progress. Records degrade gracefully via zod.
 */
import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["cll", "pbl", "eg1", "eg2"] as const;

export type TwoByTwoGrade = CaseStudyGrade;
export type TwoByTwoRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type TwoByTwoStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type TwoByTwoWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-twobytwo-study-v1",
  masteredStorageKey: "cfop-studio-mastered-twobytwo-v1",
  schema: "cfop-twobytwo-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const twoByTwoCaseKey = caseStudyKey;
export const readTwoByTwoStudy = store.read;
export const writeTwoByTwoStudy = store.write;
export const readMasteredTwoByTwoCaseKeys = store.readMasteredKeys;
export const writeMasteredTwoByTwoCaseKeys = store.writeMasteredKeys;
export const gradeTwoByTwoCase = store.grade;
export const exportTwoByTwoStudy = store.exportStudy;
export const importTwoByTwoStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { twoByTwoCaseKey as caseKey };
