/**
 * SRS study state for the Roux lane (CMLL and LSE).
 *
 * Same spaced-repetition engine as the other lanes (`lib/caseStudy.ts`) with
 * its own storage keys.
 */
import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["cmll", "lse"] as const;

export type RouxGrade = CaseStudyGrade;
export type RouxRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type RouxStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type RouxWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-roux-study-v1",
  masteredStorageKey: "cfop-studio-mastered-roux-v1",
  schema: "cfop-roux-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const rouxCaseKey = caseStudyKey;
export const readRouxStudy = store.read;
export const writeRouxStudy = store.write;
export const readMasteredRouxCaseKeys = store.readMasteredKeys;
export const writeMasteredRouxCaseKeys = store.writeMasteredKeys;
export const gradeRouxCase = store.grade;
export const exportRouxStudy = store.exportStudy;
export const importRouxStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";

export { rouxCaseKey as caseKey };
