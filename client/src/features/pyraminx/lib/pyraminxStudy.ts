import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["ll", "l4e"] as const;

export type PyraminxGrade = CaseStudyGrade;
export type PyraminxRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type PyraminxStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type PyraminxWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-pyraminx-study-v1",
  masteredStorageKey: "cfop-studio-mastered-pyraminx-v1",
  schema: "cfop-pyraminx-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const pyraminxCaseKey = caseStudyKey;
export const readPyraminxStudy = store.read;
export const writePyraminxStudy = store.write;
export const readMasteredPyraminxCaseKeys = store.readMasteredKeys;
export const writeMasteredPyraminxCaseKeys = store.writeMasteredKeys;
export const gradePyraminxCase = store.grade;
export const exportPyraminxStudy = store.exportStudy;
export const importPyraminxStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { pyraminxCaseKey as caseKey };
