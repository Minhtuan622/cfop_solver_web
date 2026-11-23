/**
 * SRS study state for the Last Layer lane (ZBLL and 1LLL).
 *
 * Built on the shared `lib/caseStudy.ts` engine with its own storage keys.
 */
import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["zbll", "1lll"] as const;

export type StudyGrade = CaseStudyGrade;
export type StudyRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type StudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type WeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-last-layer-study-v1",
  masteredStorageKey: "cfop-studio-mastered-last-layer-v1",
  schema: "cfop-last-layer-study",
  families: FAMILIES,
  defaultDailyGoal: 12,
});

export const readLastLayerStudy = store.read;
export const writeLastLayerStudy = store.write;
export const readMasteredCaseKeys = store.readMasteredKeys;
export const writeMasteredCaseKeys = store.writeMasteredKeys;
export const gradeCase = store.grade;
export const exportLastLayerStudy = store.exportStudy;
export const importLastLayerStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { caseStudyKey as caseKey };
