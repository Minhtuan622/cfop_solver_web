import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["l3t"] as const;

export type FtoL3tGrade = CaseStudyGrade;
export type FtoL3tRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type FtoL3tStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type FtoL3tWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-fto-l3t-study-v1",
  masteredStorageKey: "cfop-studio-mastered-fto-l3t-v1",
  schema: "cfop-fto-l3t-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const ftoL3tCaseKey = caseStudyKey;
export const readFtoL3tStudy = store.read;
export const writeFtoL3tStudy = store.write;
export const readMasteredFtoL3tCaseKeys = store.readMasteredKeys;
export const writeMasteredFtoL3tCaseKeys = store.writeMasteredKeys;
export const gradeFtoL3tCase = store.grade;
export const exportFtoL3tStudy = store.exportStudy;
export const importFtoL3tStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { ftoL3tCaseKey as caseKey };
