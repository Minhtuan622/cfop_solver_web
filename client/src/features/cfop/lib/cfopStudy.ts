/**
 * SRS study state for the CFOP study lane (F2L / OLL / PLL cases).
 *
 * Mirrors the Last Layer study engine (same spaced repetition ladder in
 * `lib/spacedRepetition.ts`) but with its own storage keys and the CFOP
 * case families, so the two lanes never share progress. Records degrade
 * gracefully via zod, like the other persisted state in the app.
 */
import {
  caseStudyKey,
  createCaseStudyStore,
  type CaseStudyGrade,
  type CaseStudyRecord,
  type CaseStudyState,
  type CaseStudyWeeklyReviewDay,
} from "@/lib/caseStudy";

const FAMILIES = ["f2l", "oll", "pll", "coll", "ollcp"] as const;

export type CfopGrade = CaseStudyGrade;
export type CfopRecord = CaseStudyRecord<(typeof FAMILIES)[number]>;
export type CfopStudyState = CaseStudyState<(typeof FAMILIES)[number]>;
export type CfopWeeklyReviewDay = CaseStudyWeeklyReviewDay;

const store = createCaseStudyStore({
  storageKey: "cfop-cfop-study-v1",
  masteredStorageKey: "cfop-studio-mastered-cfop-v1",
  schema: "cfop-cfop-study",
  families: FAMILIES,
  defaultDailyGoal: 12,
});

export const cfopCaseKey = caseStudyKey;
export const readCfopStudy = store.read;
export const writeCfopStudy = store.write;
export const readMasteredCfopCaseKeys = store.readMasteredKeys;
export const writeMasteredCfopCaseKeys = store.writeMasteredKeys;
export const gradeCfopCase = store.grade;
export const exportCfopStudy = store.exportStudy;
export const importCfopStudy = store.importStudy;
export {
  dueAndWeakCases,
  prioritizeStudyQueue,
  queueScore,
  todayReviewCount,
  weeklyReviewSchedule,
} from "@/lib/caseStudy";
export { cfopCaseKey as caseKey };
