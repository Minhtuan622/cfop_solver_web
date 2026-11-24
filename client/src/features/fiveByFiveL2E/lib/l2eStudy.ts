import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["l2e"] as const;

export type FiveByFiveL2EGrade = CaseStudyGrade;
export type FiveByFiveL2ERecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type FiveByFiveL2EStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type FiveByFiveL2EWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-5x5l2e-study-v1",
  masteredStorageKey: "cfop-studio-mastered-5x5l2e-v1",
  schema: "cfop-5x5l2e-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const fiveByFiveL2ECaseKey = caseStudyKey;
export const readFiveByFiveL2EStudy = store.read;
export const writeFiveByFiveL2EStudy = store.write;
export const readMasteredFiveByFiveL2ECaseKeys = store.readMasteredKeys;
export const writeMasteredFiveByFiveL2ECaseKeys = store.writeMasteredKeys;
export const gradeFiveByFiveL2ECase = store.grade;
export const exportFiveByFiveL2EStudy = store.exportStudy;
export const importFiveByFiveL2EStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { fiveByFiveL2ECaseKey as caseKey };
