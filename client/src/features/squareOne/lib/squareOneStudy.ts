/**
 * SRS study state for the Square-1 lane (CP · CS · CSP · EO · EP · OBL).
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

const FAMILIES = ["cp", "cs", "csp", "eo", "ep", "obl"] as const;

export type SquareOneGrade = CaseStudyGrade;
export type SquareOneRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type SquareOneStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type SquareOneWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-sq1-study-v1",
  masteredStorageKey: "cfop-studio-mastered-sq1-v1",
  schema: "cfop-sq1-study",
  families: FAMILIES,
  defaultDailyGoal: 10,
});

export const squareOneCaseKey = caseStudyKey;
export const readSquareOneStudy = store.read;
export const writeSquareOneStudy = store.write;
export const readMasteredSquareOneCaseKeys = store.readMasteredKeys;
export const writeMasteredSquareOneCaseKeys = store.writeMasteredKeys;
export const gradeSquareOneCase = store.grade;
export const exportSquareOneStudy = store.exportStudy;
export const importSquareOneStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { squareOneCaseKey as caseKey };
