import type { LastLayerCatalogCase } from "@/lib/solverRuntime";

import { z } from "zod";
import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";
import { notifyCfopCloudStateChanged } from "@/lib/cloudSyncSignal";
import { spacedRepetitionInterval } from "@/lib/spacedRepetition";

export type CaseStudyGrade = "again" | "hard" | "good" | "easy";

export type CaseStudyRecord<Family extends string = string> = {
  key: string;
  family: Family;
  group: string;
  id: string;
  attempts: number;
  lapses: number;
  averageMs: number;
  lastMs: number;
  intervalDays: number;
  dueAt: number;
  lastReviewedAt: number;
  lastGrade: CaseStudyGrade;
};

export type CaseStudyState<Family extends string = string> = {
  records: Record<string, CaseStudyRecord<Family>>;
  dailyGoal: number;
};

export type CaseStudyWeeklyReviewDay = { date: Date; dueCount: number; overdueCount: number; isToday: boolean };

export type CaseStudyConfig<Families extends readonly [string, ...string[]]> = {
  storageKey: string;
  masteredStorageKey: string;
  schema: string;
  families: Families;
  defaultDailyGoal: number;
  maxRecords?: number;
  maxMasteredKeys?: number;
};

export function caseStudyKey(item: Pick<LastLayerCatalogCase, "family" | "id">) {
  return `${item.family}:${item.id}`;
}

const boundedNumber = (fallback: number, min: number, max: number) =>
  z.number().finite().transform(value => Math.min(max, Math.max(min, value))).prefault(fallback).catch(fallback);
const boundedInt = (fallback: number, min: number, max: number) =>
  z.number().finite().transform(value => Math.round(Math.min(max, Math.max(min, value)))).prefault(fallback).catch(fallback);
const boundedString = (max: number) =>
  z.unknown().transform(value => (typeof value === "string" ? value.slice(0, max) : ""));

const studyGradeSchema = z.enum(["again", "hard", "good", "easy"]);

export function createCaseStudyStore<const Families extends readonly [string, ...string[]]>(config: CaseStudyConfig<Families>) {
  type Family = Families[number];
  type StudyRecord = CaseStudyRecord<Family>;
  type StudyState = CaseStudyState<Family>;

  const maxRecords = config.maxRecords ?? 2000;
  const maxMasteredKeys = config.maxMasteredKeys ?? 1800;

  const boundedDailyGoal = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(200, Math.max(1, Math.round(value)))
      : config.defaultDailyGoal;

  const recordSchema = z.object({
    key: boundedString(120),
    family: z.enum(config.families),
    group: boundedString(60),
    id: boundedString(100),
    attempts: boundedInt(0, 0, 10_000),
    lapses: boundedInt(0, 0, 10_000),
    averageMs: boundedInt(0, 0, 3_600_000),
    lastMs: boundedInt(0, 0, 3_600_000),
    intervalDays: boundedNumber(0, 0, 3_650),
    dueAt: boundedNumber(0, 0, Number.MAX_SAFE_INTEGER),
    lastReviewedAt: boundedNumber(0, 0, Number.MAX_SAFE_INTEGER),
    lastGrade: studyGradeSchema.prefault("again").catch("again"),
  });

  function normalizeRecord(raw: unknown): StudyRecord | null {
    const parsed = recordSchema.safeParse(raw);
    if (!parsed.success) return null;
    const record = parsed.data as StudyRecord;
    if (!record.key || !record.group || !record.id) return null;
    return record;
  }

  function normalizeRecords(values: unknown[]): Record<string, StudyRecord> {
    return Object.fromEntries(
      values
        .map(normalizeRecord)
        .filter((record): record is StudyRecord => Boolean(record))
        .slice(0, maxRecords)
        .map(record => [record.key, record]),
    );
  }

  function normalizeMasteredKeys(values: unknown[]) {
    return values.filter((item): item is string => typeof item === "string").slice(-maxMasteredKeys);
  }

  function read(): StudyState {
    try {
      const raw = readStoredJson<{ records?: unknown; dailyGoal?: unknown }>(config.storageKey, {});
      const values = raw.records && typeof raw.records === "object" ? Object.values(raw.records) : [];
      return { records: normalizeRecords(values), dailyGoal: boundedDailyGoal(raw.dailyGoal) };
    } catch {
      return { records: {}, dailyGoal: config.defaultDailyGoal };
    }
  }

  function write(state: StudyState) {
    writeStoredValue(
      config.storageKey,
      JSON.stringify({
        schema: config.schema,
        version: 1,
        records: Object.fromEntries(Object.entries(state.records).slice(0, maxRecords)),
        dailyGoal: boundedDailyGoal(state.dailyGoal),
      }),
    );
    notifyCfopCloudStateChanged();
  }

  function readMasteredKeys() {
    return new Set(normalizeMasteredKeys(readStoredJson<unknown[]>(config.masteredStorageKey, [])));
  }

  function writeMasteredKeys(keys: Set<string>) {
    writeStoredValue(config.masteredStorageKey, JSON.stringify(Array.from(keys).slice(-maxMasteredKeys)));
    notifyCfopCloudStateChanged();
  }

  function grade(item: LastLayerCatalogCase, existing: StudyRecord | undefined, elapsedMs: number, studyGrade: CaseStudyGrade, now = Date.now()): StudyRecord {
    const prior = existing?.intervalDays ?? 0;
    const intervalDays = spacedRepetitionInterval(prior, studyGrade);
    const attempts = (existing?.attempts ?? 0) + 1;
    const lapses = (existing?.lapses ?? 0) + (studyGrade === "again" ? 1 : 0);
    const previousAverage = existing?.averageMs ?? 0;
    const averageMs = previousAverage > 0 ? Math.round(previousAverage * 0.72 + elapsedMs * 0.28) : elapsedMs;
    return {
      key: caseStudyKey(item),
      family: item.family as Family,
      group: item.group,
      id: item.id,
      attempts,
      lapses,
      averageMs,
      lastMs: elapsedMs,
      intervalDays,
      dueAt: now + intervalDays * 86_400_000,
      lastReviewedAt: now,
      lastGrade: studyGrade,
    };
  }

  function exportStudy(state: StudyState, masteredKeys: Set<string>) {
    return { schema: config.schema, version: 1, exportedAt: new Date().toISOString(), study: state, masteredCaseKeys: Array.from(masteredKeys) };
  }

  function importStudy(payload: unknown): { state: StudyState; masteredKeys: Set<string> } {
    if (!payload || typeof payload !== "object") throw new Error("Invalid backup");
    const root = payload as { schema?: unknown; study?: unknown; masteredCaseKeys?: unknown };
    if (root.schema !== config.schema || !root.study || typeof root.study !== "object") throw new Error("Invalid backup");
    const study = root.study as { records?: unknown; dailyGoal?: unknown };
    const records = study.records && typeof study.records === "object" ? normalizeRecords(Object.values(study.records)) : {};
    const masteredKeys = new Set(Array.isArray(root.masteredCaseKeys) ? normalizeMasteredKeys(root.masteredCaseKeys) : []);
    return { state: { records, dailyGoal: boundedDailyGoal(study.dailyGoal) }, masteredKeys };
  }

  return { read, write, readMasteredKeys, writeMasteredKeys, grade, exportStudy, importStudy };
}

export function queueScore(item: LastLayerCatalogCase, record: CaseStudyRecord | undefined, mastered: boolean, now = Date.now()) {
  if (!mastered) return -1_000_000 + (record?.attempts ?? 0) * 100 + (record?.lapses ?? 0) * 20;
  if (!record) return -700_000;
  const overdue = Math.max(0, now - record.dueAt) / 3_600_000;
  const weakness = record.lapses * 600 + record.averageMs / 20 + (record.lastGrade === "again" ? 1200 : record.lastGrade === "hard" ? 350 : 0);
  return -overdue * 200 - weakness;
}

export function prioritizeStudyQueue<T extends LastLayerCatalogCase>(cases: T[], records: Record<string, CaseStudyRecord>, masteredKeys: Set<string>): T[] {
  return [...cases].sort((left, right) =>
    queueScore(left, records[caseStudyKey(left)], masteredKeys.has(caseStudyKey(left))) -
    queueScore(right, records[caseStudyKey(right)], masteredKeys.has(caseStudyKey(right))),
  );
}

export function dueAndWeakCases<T extends LastLayerCatalogCase>(cases: T[], records: Record<string, CaseStudyRecord>, masteredKeys: Set<string>, now = Date.now()): T[] {
  return prioritizeStudyQueue(cases, records, masteredKeys).filter(item => {
    const record = records[caseStudyKey(item)];
    return !masteredKeys.has(caseStudyKey(item)) || !record || record.dueAt <= now || record.lastGrade === "again" || record.lapses > 0;
  });
}

export function todayReviewCount(records: Record<string, CaseStudyRecord>, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Object.values(records).filter(record => record.lastReviewedAt >= start).length;
}

export function weeklyReviewSchedule(records: Record<string, CaseStudyRecord>, now = new Date()): CaseStudyWeeklyReviewDay[] {
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
