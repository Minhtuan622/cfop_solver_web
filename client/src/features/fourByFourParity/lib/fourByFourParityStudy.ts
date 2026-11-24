import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["pll-parity"] as const;

export type FourByFourParityGrade = CaseStudyGrade;
export type FourByFourParityRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type FourByFourParityStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type FourByFourParityWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-4x4parity-study-v1",
  masteredStorageKey: "cfop-studio-mastered-4x4parity-v1",
  schema: "cfop-4x4parity-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const fourByFourParityCaseKey = caseStudyKey;
export const readFourByFourParityStudy = store.read;
export const writeFourByFourParityStudy = store.write;
export const readMasteredFourByFourParityCaseKeys = store.readMasteredKeys;
export const writeMasteredFourByFourParityCaseKeys = store.writeMasteredKeys;
export const gradeFourByFourParityCase = store.grade;
export const exportFourByFourParityStudy = store.exportStudy;
export const importFourByFourParityStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { fourByFourParityCaseKey as caseKey };
