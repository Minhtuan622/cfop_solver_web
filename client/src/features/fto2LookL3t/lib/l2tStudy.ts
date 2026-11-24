import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["l3t2"] as const;

export type Fto2LookL3tGrade = CaseStudyGrade;
export type Fto2LookL3tRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type Fto2LookL3tStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type Fto2LookL3tWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-fto-2-look-l3t-study-v1",
  masteredStorageKey: "cfop-studio-mastered-fto-2-look-l3t-v1",
  schema: "cfop-fto-2-look-l3t-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const fto2LookL3tCaseKey = caseStudyKey;
export const readFto2LookL3tStudy = store.read;
export const writeFto2LookL3tStudy = store.write;
export const readMasteredFto2LookL3tCaseKeys = store.readMasteredKeys;
export const writeMasteredFto2LookL3tCaseKeys = store.writeMasteredKeys;
export const gradeFto2LookL3tCase = store.grade;
export const exportFto2LookL3tStudy = store.exportStudy;
export const importFto2LookL3tStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { fto2LookL3tCaseKey as caseKey };
