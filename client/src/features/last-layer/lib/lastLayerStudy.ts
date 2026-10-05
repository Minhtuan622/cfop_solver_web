import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";
import { notifyCfopCloudStateChanged } from "@/lib/cloudSyncSignal";

export type StudyGrade = "again" | "hard" | "good" | "easy";
export type StudyRecord = {
  key: string;
  family: "zbll" | "1lll";
  group: string;
  id: string;
  attempts: number;
  lapses: number;
  averageMs: number;
  lastMs: number;
  intervalDays: number;
  dueAt: number;
  lastReviewedAt: number;
  lastGrade: StudyGrade;
};

export type StudyState = { records: Record<string, StudyRecord>; dailyGoal: number };
export type WeeklyReviewDay = { date: Date; dueCount: number; overdueCount: number; isToday: boolean };

const STORE = "cfop-last-layer-study-v1";
const MASTERED_STORE = "cfop-studio-mastered-last-layer-v1";
const MAX_RECORDS = 2000;

function caseKey(item: Pick<LastLayerCatalogCase, "family" | "id">) { return `${item.family}:${item.id}`; }
function boundedNumber(value: unknown, fallback: number, min: number, max: number) { return typeof value === "number" && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback; }

function normalizeRecord(raw: unknown): StudyRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<StudyRecord>;
  if (typeof item.key !== "string" || !item.key || (item.family !== "zbll" && item.family !== "1lll") || typeof item.group !== "string" || typeof item.id !== "string") return null;
  const lastGrade: StudyGrade = item.lastGrade === "again" || item.lastGrade === "hard" || item.lastGrade === "good" || item.lastGrade === "easy" ? item.lastGrade : "again";
  return {
    key: item.key.slice(0, 120), family: item.family, group: item.group.slice(0, 60), id: item.id.slice(0, 100),
    attempts: Math.round(boundedNumber(item.attempts, 0, 0, 10_000)), lapses: Math.round(boundedNumber(item.lapses, 0, 0, 10_000)),
    averageMs: Math.round(boundedNumber(item.averageMs, 0, 0, 3_600_000)), lastMs: Math.round(boundedNumber(item.lastMs, 0, 0, 3_600_000)),
    intervalDays: boundedNumber(item.intervalDays, 0, 0, 3650), dueAt: boundedNumber(item.dueAt, 0, 0, Number.MAX_SAFE_INTEGER),
    lastReviewedAt: boundedNumber(item.lastReviewedAt, 0, 0, Number.MAX_SAFE_INTEGER), lastGrade,
  };
}

export function readLastLayerStudy(): StudyState {
  try {
    const raw = readStoredJson<{ records?: unknown; dailyGoal?: unknown }>(STORE, {});
    const values = raw.records && typeof raw.records === "object" ? Object.values(raw.records) : [];
    const records = Object.fromEntries(values.map(normalizeRecord).filter((record): record is StudyRecord => Boolean(record)).slice(0, MAX_RECORDS).map((record) => [record.key, record]));
    return { records, dailyGoal: Math.round(boundedNumber(raw.dailyGoal, 12, 1, 200)) };
  } catch { return { records: {}, dailyGoal: 12 }; }
}

export function writeLastLayerStudy(state: StudyState) { writeStoredValue(STORE, JSON.stringify({ schema: "cfop-last-layer-study", version: 1, records: Object.fromEntries(Object.entries(state.records).slice(0, MAX_RECORDS)), dailyGoal: Math.round(boundedNumber(state.dailyGoal, 12, 1, 200)) })); notifyCfopCloudStateChanged(); }

export function readMasteredCaseKeys() {
  const raw = readStoredJson<unknown[]>(MASTERED_STORE, []);
  return new Set(raw.filter((item): item is string => typeof item === "string").slice(-1800));
}

export function writeMasteredCaseKeys(keys: Set<string>) { writeStoredValue(MASTERED_STORE, JSON.stringify(Array.from(keys).slice(-1800))); notifyCfopCloudStateChanged(); }

export function gradeCase(item: LastLayerCatalogCase, existing: StudyRecord | undefined, elapsedMs: number, grade: StudyGrade, now = Date.now()): StudyRecord {
  const prior = existing?.intervalDays ?? 0;
  const intervalDays = grade === "again" ? 0 : grade === "hard" ? Math.max(1, Math.round(Math.max(1, prior) * 1.3)) : grade === "good" ? (prior < 1 ? 1 : Math.round(prior * 2.5)) : (prior < 1 ? 3 : Math.round(prior * 3.5));
  const attempts = (existing?.attempts ?? 0) + 1;
  const lapses = (existing?.lapses ?? 0) + (grade === "again" ? 1 : 0);
  const previousAverage = existing?.averageMs ?? 0;
  const averageMs = previousAverage > 0 ? Math.round(previousAverage * 0.72 + elapsedMs * 0.28) : elapsedMs;
  return { key: caseKey(item), family: item.family, group: item.group, id: item.id, attempts, lapses, averageMs, lastMs: elapsedMs, intervalDays, dueAt: now + intervalDays * 86_400_000, lastReviewedAt: now, lastGrade: grade };
}

export function queueScore(item: LastLayerCatalogCase, record: StudyRecord | undefined, mastered: boolean, now = Date.now()) {
  if (!mastered) return -1_000_000 + (record?.attempts ?? 0) * 100 + (record?.lapses ?? 0) * 20;
  if (!record) return -700_000;
  const overdue = Math.max(0, now - record.dueAt) / 3_600_000;
  const weakness = record.lapses * 600 + record.averageMs / 20 + (record.lastGrade === "again" ? 1200 : record.lastGrade === "hard" ? 350 : 0);
  return -overdue * 200 - weakness;
}

export function prioritizeStudyQueue(cases: LastLayerCatalogCase[], records: Record<string, StudyRecord>, masteredKeys: Set<string>) { return [...cases].sort((left, right) => queueScore(left, records[caseKey(left)], masteredKeys.has(caseKey(left))) - queueScore(right, records[caseKey(right)], masteredKeys.has(caseKey(right)))); }

export function dueAndWeakCases(cases: LastLayerCatalogCase[], records: Record<string, StudyRecord>, masteredKeys: Set<string>, now = Date.now()) { return prioritizeStudyQueue(cases, records, masteredKeys).filter((item) => { const record = records[caseKey(item)]; return !masteredKeys.has(caseKey(item)) || !record || record.dueAt <= now || record.lastGrade === "again" || record.lapses > 0; }); }

export function todayReviewCount(records: Record<string, StudyRecord>, now = new Date()) { const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); return Object.values(records).filter((record) => record.lastReviewedAt >= start).length; }

export function weeklyReviewSchedule(records: Record<string, StudyRecord>, now = new Date()): WeeklyReviewDay[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;
  const values = Object.values(records).filter((record) => record.attempts > 0 && record.dueAt > 0);
  return Array.from({ length: 7 }, (_, index) => {
    const dayStart = start + index * dayMs;
    const dayEnd = dayStart + dayMs;
    const dueCount = values.filter((record) => index === 0 ? record.dueAt < dayEnd : record.dueAt >= dayStart && record.dueAt < dayEnd).length;
    const overdueCount = index === 0 ? values.filter((record) => record.dueAt < start).length : 0;
    return { date: new Date(dayStart), dueCount, overdueCount, isToday: index === 0 };
  });
}

export function exportLastLayerStudy(state: StudyState, masteredKeys: Set<string>) { return { schema: "cfop-last-layer-study", version: 1, exportedAt: new Date().toISOString(), study: state, masteredCaseKeys: Array.from(masteredKeys) }; }

export function importLastLayerStudy(payload: unknown): { state: StudyState; masteredKeys: Set<string> } {
  if (!payload || typeof payload !== "object") throw new Error("Invalid backup");
  const root = payload as { schema?: unknown; study?: unknown; masteredCaseKeys?: unknown };
  if (root.schema !== "cfop-last-layer-study" || !root.study || typeof root.study !== "object") throw new Error("Invalid backup");
  const study = root.study as { records?: unknown; dailyGoal?: unknown };
  const records = study.records && typeof study.records === "object" ? Object.fromEntries(Object.values(study.records).map(normalizeRecord).filter((record): record is StudyRecord => Boolean(record)).slice(0, MAX_RECORDS).map((record) => [record.key, record])) : {};
  const masteredKeys = new Set(Array.isArray(root.masteredCaseKeys) ? root.masteredCaseKeys.filter((item): item is string => typeof item === "string").slice(-1800) : []);
  return { state: { records, dailyGoal: Math.round(boundedNumber(study.dailyGoal, 12, 1, 200)) }, masteredKeys };
}

export { caseKey };
