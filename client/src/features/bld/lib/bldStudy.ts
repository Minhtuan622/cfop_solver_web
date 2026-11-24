import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["edge", "corner", "special"] as const;

export type BldStudyGrade = CaseStudyGrade;
export type BldRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type BldStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type BldWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-bld-study-v1",
  masteredStorageKey: "cfop-studio-mastered-bld-v1",
  schema: "cfop-bld-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
  maxRecords: 6000,
  maxMasteredKeys: 6000,
});

export const bldCaseKey = caseStudyKey;
export const readBldStudy = store.read;
export const writeBldStudy = store.write;
export const readMasteredBldCaseKeys = store.readMasteredKeys;
export const writeMasteredBldCaseKeys = store.writeMasteredKeys;
export const gradeBldCase = store.grade;
export const exportBldStudy = store.exportStudy;
export const importBldStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { bldCaseKey as caseKey };
