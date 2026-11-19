/**
 * SRS study state for the FTO 2-Look L3T lane (2-Look L3T).
 *
 * Mirrors the other lanes (same spaced-repetition ladder from
 * `lib/spacedRepetition.ts`) with its own storage keys. Records degrade
 * gracefully via zod.
 */
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

import { z } from "zod";
import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";
import { notifyCfopCloudStateChanged } from "@/lib/cloudSyncSignal";
import { spacedRepetitionInterval } from "@/lib/spacedRepetition";

export type Fto2LookL3tGrade = "again" | "hard" | "good" | "easy";
export type Fto2LookL3tRecord = {
  key: string;
  family: "l3t2";
  group: string;
  id: string;
  attempts: number;
  lapses: number;
  averageMs: number;
  lastMs: number;
  intervalDays: number;
  dueAt: number;
  lastReviewedAt: number;
  lastGrade: Fto2LookL3tGrade;
};

export type Fto2LookL3tStudyState = { records: Record<string, Fto2LookL3tRecord>; dailyGoal: number };
export type Fto2LookL3tWeeklyReviewDay = { date: Date; dueCount: number; overdueCount: number; isToday: boolean };

const STORE = "cfop-fto-2-look-l3t-study-v1";
const MASTERED_STORE = "cfop-studio-mastered-fto-2-look-l3t-v1";
const MAX_RECORDS = 2000;

export function fto2LookL3tCaseKey(item: Pick<LastLayerCatalogCase, "family" | "id">) {
  return `${item.family}:${item.id}`;
}

const boundedNumber = (fallback: number, min: number, max: number) =>
  z.number().finite().transform(value => Math.min(max, Math.max(min, value))).prefault(fallback).catch(fallback);
const boundedInt = (fallback: number, min: number, max: number) =>
  z.number().finite().transform(value => Math.round(Math.min(max, Math.max(min, value)))).prefault(fallback).catch(fallback);
const plainBoundedDailyGoal = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(200, Math.max(1, Math.round(value))) : 10;

const studyGradeSchema = z.enum(["again", "hard", "good", "easy"]);
const fto2LookL3tRecordSchema = z.object({
  key: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 120) : "")),
  family: z.enum(["l3t2"]),
  group: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 60) : "")),
  id: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 100) : "")),
  attempts: boundedInt(0, 0, 10_000),
  lapses: boundedInt(0, 0, 10_000),
  averageMs: boundedInt(0, 0, 3_600_000),
  lastMs: boundedInt(0, 0, 3_600_000),
  intervalDays: boundedNumber(0, 0, 3_650),
  dueAt: boundedNumber(0, 0, Number.MAX_SAFE_INTEGER),
  lastReviewedAt: boundedNumber(0, 0, Number.MAX_SAFE_INTEGER),
  lastGrade: studyGradeSchema.prefault("again").catch("again"),
});

function normalizeRecord(raw: unknown): Fto2LookL3tRecord | null {
  const parsed = fto2LookL3tRecordSchema.safeParse(raw);
  if (!parsed.success) return null;
  const record = parsed.data;
  if (!record.key || !record.group || !record.id) return null;
  return record;
}

export function readFto2LookL3tStudy(): Fto2LookL3tStudyState {
  try {
    const raw = readStoredJson<{ records?: unknown; dailyGoal?: unknown }>(STORE, {});
    const values = raw.records && typeof raw.records === "object" ? Object.values(raw.records) : [];
    const records = Object.fromEntries(
      values
        .map(normalizeRecord)
        .filter((record): record is Fto2LookL3tRecord => Boolean(record))
        .slice(0, MAX_RECORDS)
        .map(record => [record.key, record]),
    );
    return { records, dailyGoal: plainBoundedDailyGoal(raw.dailyGoal) };
  } catch {
    return { records: {}, dailyGoal: 10 };
  }
}

export function writeFto2LookL3tStudy(state: Fto2LookL3tStudyState) {
  writeStoredValue(
    STORE,
    JSON.stringify({
      schema: "cfop-fto-2-look-l3t-study",
      version: 1,
      records: Object.fromEntries(Object.entries(state.records).slice(0, MAX_RECORDS)),
      dailyGoal: plainBoundedDailyGoal(state.dailyGoal),
    }),
  );
  notifyCfopCloudStateChanged();
}

export function readMasteredFto2LookL3tCaseKeys() {
  const raw = readStoredJson<unknown[]>(MASTERED_STORE, []);
  return new Set(raw.filter((item): item is string => typeof item === "string").slice(-1800));
}

export function writeMasteredFto2LookL3tCaseKeys(keys: Set<string>) {
  writeStoredValue(MASTERED_STORE, JSON.stringify(Array.from(keys).slice(-1800)));
  notifyCfopCloudStateChanged();
}

export function gradeFto2LookL3tCase(item: LastLayerCatalogCase, existing: Fto2LookL3tRecord | undefined, elapsedMs: number, grade: Fto2LookL3tGrade, now = Date.now()): Fto2LookL3tRecord {
  const prior = existing?.intervalDays ?? 0;
  const intervalDays = spacedRepetitionInterval(prior, grade);
  const attempts = (existing?.attempts ?? 0) + 1;
  const lapses = (existing?.lapses ?? 0) + (grade === "again" ? 1 : 0);
  const previousAverage = existing?.averageMs ?? 0;
  const averageMs = previousAverage > 0 ? Math.round(previousAverage * 0.72 + elapsedMs * 0.28) : elapsedMs;
  return {
    key: fto2LookL3tCaseKey(item),
    family: item.family as Fto2LookL3tRecord["family"],
    group: item.group,
    id: item.id,
    attempts,
    lapses,
    averageMs,
    lastMs: elapsedMs,
    intervalDays,
    dueAt: now + intervalDays * 86_400_000,
    lastReviewedAt: now,
    lastGrade: grade,
  };
}

export function queueScore(item: LastLayerCatalogCase, record: Fto2LookL3tRecord | undefined, mastered: boolean, now = Date.now()) {
  if (!mastered) return -1_000_000 + (record?.attempts ?? 0) * 100 + (record?.lapses ?? 0) * 20;
  if (!record) return -700_000;
  const overdue = Math.max(0, now - record.dueAt) / 3_600_000;
  const weakness = record.lapses * 600 + record.averageMs / 20 + (record.lastGrade === "again" ? 1200 : record.lastGrade === "hard" ? 350 : 0);
  return -overdue * 200 - weakness;
}

export function prioritizeStudyQueue<T extends LastLayerCatalogCase>(cases: T[], records: Record<string, Fto2LookL3tRecord>, masteredKeys: Set<string>): T[] {
  return [...cases].sort((left, right) =>
    queueScore(left, records[fto2LookL3tCaseKey(left)], masteredKeys.has(fto2LookL3tCaseKey(left))) -
    queueScore(right, records[fto2LookL3tCaseKey(right)], masteredKeys.has(fto2LookL3tCaseKey(right))),
  );
}

export function dueAndWeakCases<T extends LastLayerCatalogCase>(cases: T[], records: Record<string, Fto2LookL3tRecord>, masteredKeys: Set<string>, now = Date.now()): T[] {
  return prioritizeStudyQueue(cases, records, masteredKeys).filter(item => {
    const record = records[fto2LookL3tCaseKey(item)];
    return !masteredKeys.has(fto2LookL3tCaseKey(item)) || !record || record.dueAt <= now || record.lastGrade === "again" || record.lapses > 0;
  });
}

export function todayReviewCount(records: Record<string, Fto2LookL3tRecord>, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Object.values(records).filter(record => record.lastReviewedAt >= start).length;
}

export function weeklyReviewSchedule(records: Record<string, Fto2LookL3tRecord>, now = new Date()): Fto2LookL3tWeeklyReviewDay[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 86_400_000;
  const values = Object.values(records).filter(record => record.attempts > 0 && record.dueAt > 0);
  return Array.from({ length: 7 }, (_, index) => {
    const dayStart = start + index * dayMs;
    const dayEnd = dayStart + dayMs;
    const dueCount = values.filter(record =>
      index === 0 ? record.dueAt < dayEnd : record.dueAt >= dayStart && record.dueAt < dayEnd,
    ).length;
    const overdueCount = index === 0 ? values.filter(record => record.dueAt < start).length : 0;
    return { date: new Date(dayStart), dueCount, overdueCount, isToday: index === 0 };
  });
}

export function exportFto2LookL3tStudy(state: Fto2LookL3tStudyState, masteredKeys: Set<string>) {
  return { schema: "cfop-fto-2-look-l3t-study", version: 1, exportedAt: new Date().toISOString(), study: state, masteredCaseKeys: Array.from(masteredKeys) };
}

export function importFto2LookL3tStudy(payload: unknown): { state: Fto2LookL3tStudyState; masteredKeys: Set<string> } {
  if (!payload || typeof payload !== "object") throw new Error("Invalid backup");
  const root = payload as { schema?: unknown; study?: unknown; masteredCaseKeys?: unknown };
  if (root.schema !== "cfop-fto-2-look-l3t-study" || !root.study || typeof root.study !== "object") throw new Error("Invalid backup");
  const study = root.study as { records?: unknown; dailyGoal?: unknown };
  const records = study.records && typeof study.records === "object"
    ? Object.fromEntries(
        Object.values(study.records)
          .map(normalizeRecord)
          .filter((record): record is Fto2LookL3tRecord => Boolean(record))
          .slice(0, MAX_RECORDS)
          .map(record => [record.key, record]),
      )
    : {};
  const masteredKeys = new Set(
    Array.isArray(root.masteredCaseKeys)
      ? root.masteredCaseKeys.filter((item): item is string => typeof item === "string").slice(-1800)
      : [],
  );
  return { state: { records, dailyGoal: plainBoundedDailyGoal(study.dailyGoal) }, masteredKeys };
}

export { fto2LookL3tCaseKey as caseKey };
