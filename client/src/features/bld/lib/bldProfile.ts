export type BldGrade = "again" | "hard" | "good" | "easy";
import { z } from "zod";
import { readStoredJson, writeStoredValue } from "@/lib/browserStorage";
import { notifyCfopCloudStateChanged } from "@/lib/cloudSyncSignal";
import { spacedRepetitionInterval } from "@/lib/spacedRepetition";

export type BldPreferredAlgorithm = { algorithm: string; updatedAt: number };
export type BldMemoKind = "edge" | "corner" | "mixed" | "parity" | "flip" | "twist" | "formula";
export type BldMemoRecord = { key: string; memo: string; kind: BldMemoKind; attempts: number; lapses: number; intervalDays: number; dueAt: number; lastReviewedAt: number; lastGrade: BldGrade };
export type BldPairCard = { keyword: string; imageUrl: string; updatedAt: number };
export type BldDrillKind = "parity" | "flip" | "twist";
export type BldDrillAttempt = { id: string; kind: BldDrillKind; key: string; grade: BldGrade; durationMs: number; createdAt: number };
export type BldProfile = { preferredAlgorithms: Record<string, BldPreferredAlgorithm>; memoRecords: Record<string, BldMemoRecord>; pairCards: Record<string, BldPairCard>; drillAttempts: BldDrillAttempt[]; reviewDays: string[]; audioEnabled: boolean; dailyGoal: number };

const STORE = "cfop-bld-profile-v1";
const MAX_ITEMS = 800;
const MAX_DRILL_ATTEMPTS = 600;
const MAX_REVIEW_DAYS = 1600;

/** A finite number clamped to [min, max]; invalid input falls back. */
const bounded = (fallback: number, min: number, max: number) =>
  z.number().finite().transform(value => Math.min(max, Math.max(min, value))).prefault(fallback).catch(fallback);
const boundedInt = (fallback: number, min: number, max: number) =>
  z.number().finite().transform(value => Math.round(Math.min(max, Math.max(min, value)))).prefault(fallback).catch(fallback);
const boundedDailyGoal = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(200, Math.max(1, Math.round(value))) : 12;

const cleanAlgorithm = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 600) : "";
const cleanKeyword = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 72) : "";
const cleanImageUrl = (value: unknown) => { if (typeof value !== "string" || !value.trim()) return ""; try { const url = new URL(value.trim()); return url.protocol === "https:" ? url.toString().slice(0, 1000) : ""; } catch { return ""; } };

const memoKindSchema = z.enum(["edge", "corner", "mixed", "parity", "flip", "twist", "formula"]);
const drillKindSchema = z.enum(["parity", "flip", "twist"]);
const bldGradeSchema = z.enum(["again", "hard", "good", "easy"]);

const preferredAlgorithmSchema = z.object({
  algorithm: z.unknown().transform(cleanAlgorithm),
  updatedAt: bounded(Date.now(), 0, Number.MAX_SAFE_INTEGER),
}).refine(value => value.algorithm.length > 0);

const memoRecordSchema = z.object({
  key: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 180) : "")),
  memo: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 80) : "")),
  kind: memoKindSchema.prefault("mixed").catch("mixed"),
  attempts: boundedInt(0, 0, 10_000),
  lapses: boundedInt(0, 0, 10_000),
  intervalDays: bounded(0, 0, 3_650),
  dueAt: bounded(0, 0, Number.MAX_SAFE_INTEGER),
  lastReviewedAt: bounded(0, 0, Number.MAX_SAFE_INTEGER),
  lastGrade: bldGradeSchema.prefault("again").catch("again"),
}).refine(value => value.key.length > 0 && value.memo.length > 0);

const pairCardSchema = z.object({
  keyword: z.unknown().transform(cleanKeyword),
  imageUrl: z.unknown().transform(cleanImageUrl),
  updatedAt: bounded(Date.now(), 0, Number.MAX_SAFE_INTEGER),
}).refine(value => value.keyword.length > 0 || value.imageUrl.length > 0);

const drillAttemptSchema = z.object({
  id: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 96) : "")),
  key: z.unknown().transform(value => (typeof value === "string" ? value.slice(0, 180) : "")),
  kind: drillKindSchema,
  grade: bldGradeSchema,
  durationMs: boundedInt(0, 0, 3_600_000),
  createdAt: bounded(0, 0, Number.MAX_SAFE_INTEGER),
}).refine(value => value.id.length > 0 && value.key.length > 0);

function normalizePreferred(raw: unknown): BldPreferredAlgorithm | null {
  const parsed = preferredAlgorithmSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
function normalizeRecord(raw: unknown): BldMemoRecord | null {
  const parsed = memoRecordSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
function normalizePairCard(raw: unknown): BldPairCard | null {
  const parsed = pairCardSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
function normalizeDrillAttempt(raw: unknown): BldDrillAttempt | null {
  const parsed = drillAttemptSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

function reviewDay(timestamp: number) { const date = new Date(timestamp); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
const reviewDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
function normalizeReviewDays(raw: unknown) { return Array.from(new Set((Array.isArray(raw) ? raw : []).filter(value => reviewDateSchema.safeParse(value).success).sort())).slice(-MAX_REVIEW_DAYS); }
function legacyReviewDays(records: Record<string, BldMemoRecord>) { return Array.from(new Set(Object.values(records).filter((record) => record.lastReviewedAt > 0).map((record) => reviewDay(record.lastReviewedAt)))).sort().slice(-MAX_REVIEW_DAYS); }

/** Build the profile from its loose storage/backup shape; both read paths use it. */
function assembleProfile(raw: Partial<BldProfile> & Record<string, unknown>): BldProfile {
  const preferredAlgorithms = Object.fromEntries(Object.entries(raw.preferredAlgorithms ?? {}).map(([key, value]) => [key.slice(0, 180), normalizePreferred(value)]).filter((entry): entry is [string, BldPreferredAlgorithm] => Boolean(entry[1])).slice(0, MAX_ITEMS));
  const memoRecords = Object.fromEntries(Object.values(raw.memoRecords ?? {}).map(normalizeRecord).filter((item): item is BldMemoRecord => Boolean(item)).slice(0, MAX_ITEMS).map((item) => [item.key, item]));
  const pairCards = Object.fromEntries(Object.entries(raw.pairCards ?? {}).map(([key, value]) => [key.toUpperCase().replaceAll(/[^A-Z]/g, "").slice(0, 8), normalizePairCard(value)]).filter((entry): entry is [string, BldPairCard] => Boolean(entry[0] && entry[1])).slice(0, MAX_ITEMS));
  const drillAttempts = (Array.isArray(raw.drillAttempts) ? raw.drillAttempts : []).map(normalizeDrillAttempt).filter((item): item is BldDrillAttempt => Boolean(item)).sort((left, right) => right.createdAt - left.createdAt).slice(0, MAX_DRILL_ATTEMPTS);
  const reviewDays = Array.isArray(raw.reviewDays) ? normalizeReviewDays(raw.reviewDays) : legacyReviewDays(memoRecords);
  return { preferredAlgorithms, memoRecords, pairCards, drillAttempts, reviewDays, audioEnabled: Boolean(raw.audioEnabled), dailyGoal: boundedDailyGoal(raw.dailyGoal) };
}

export function emptyBldProfile(): BldProfile { return { preferredAlgorithms: {}, memoRecords: {}, pairCards: {}, drillAttempts: [], reviewDays: [], audioEnabled: false, dailyGoal: 12 }; }
export function readBldProfile(): BldProfile { try { const raw = readStoredJson<Partial<BldProfile>>(STORE, {}); return assembleProfile(raw); } catch { return emptyBldProfile(); } }
export function writeBldProfile(profile: BldProfile) { writeStoredValue(STORE, JSON.stringify({ schema: "cfop-bld-profile", version: 3, ...profile, preferredAlgorithms: Object.fromEntries(Object.entries(profile.preferredAlgorithms).slice(0, MAX_ITEMS)), memoRecords: Object.fromEntries(Object.entries(profile.memoRecords).slice(0, MAX_ITEMS)), pairCards: Object.fromEntries(Object.entries(profile.pairCards).slice(0, MAX_ITEMS)), drillAttempts: profile.drillAttempts.slice(0, MAX_DRILL_ATTEMPTS), reviewDays: normalizeReviewDays(profile.reviewDays) })); notifyCfopCloudStateChanged(); }
export function profileExport(profile: BldProfile) { return { schema: "cfop-bld-profile", version: 3, exportedAt: new Date().toISOString(), profile }; }
export function importBldProfile(raw: unknown): BldProfile { if (!raw || typeof raw !== "object") throw new Error("Invalid BLD profile"); const root = raw as { schema?: unknown; profile?: unknown }; if (root.schema !== "cfop-bld-profile" || !root.profile || typeof root.profile !== "object") throw new Error("Invalid BLD profile"); return assembleProfile(root.profile as Partial<BldProfile>); }
export function preferenceKey(kind: "edge" | "corner" | "parity" | "flip" | "twist", key: string) { return `${kind}:${key}`; }
export function setPreferredAlgorithm(profile: BldProfile, key: string, algorithm: string): BldProfile { const cleaned = cleanAlgorithm(algorithm); const preferredAlgorithms = { ...profile.preferredAlgorithms }; if (cleaned) preferredAlgorithms[key] = { algorithm: cleaned, updatedAt: Date.now() }; else delete preferredAlgorithms[key]; return { ...profile, preferredAlgorithms }; }
export function gradeMemo(profile: BldProfile, item: Pick<BldMemoRecord, "key" | "memo" | "kind">, grade: BldGrade, now = Date.now()): BldProfile { const previous = profile.memoRecords[item.key]; const prior = previous?.intervalDays ?? 0; const intervalDays = spacedRepetitionInterval(prior, grade); const record: BldMemoRecord = { key: item.key, memo: item.memo, kind: item.kind, attempts: (previous?.attempts ?? 0) + 1, lapses: (previous?.lapses ?? 0) + (grade === "again" ? 1 : 0), intervalDays, dueAt: now + intervalDays * 86_400_000, lastReviewedAt: now, lastGrade: grade }; const reviewDays = Array.from(new Set([...profile.reviewDays, reviewDay(now)])).sort().slice(-MAX_REVIEW_DAYS); return { ...profile, memoRecords: { ...profile.memoRecords, [record.key]: record }, reviewDays }; }
export function reviewStreak(profile: BldProfile, now = Date.now()) { const reviewDays = new Set(profile.reviewDays); const cursor = new Date(now); cursor.setHours(0, 0, 0, 0); let current = 0; while (reviewDays.has(reviewDay(cursor.getTime()))) { current += 1; cursor.setDate(cursor.getDate() - 1); } let longest = 0; let run = 0; const sorted = Array.from(reviewDays).sort(); for (const day of sorted) { const date = new Date(`${day}T00:00:00`); const previous = new Date(date); previous.setDate(previous.getDate() - 1); run = reviewDays.has(reviewDay(previous.getTime())) ? run + 1 : 1; longest = Math.max(longest, run); } return { current, longest, reviewedToday: reviewDays.has(reviewDay(now)) }; }
export function dueMemoRecords(profile: BldProfile, now = Date.now()) { return Object.values(profile.memoRecords).filter((record) => !record.dueAt || record.dueAt <= now || record.lastGrade === "again").sort((left, right) => left.dueAt - right.dueAt || right.lapses - left.lapses); }
export function recordDrillAttempt(profile: BldProfile, attempt: Omit<BldDrillAttempt, "id" | "createdAt">, now = Date.now()): BldProfile { const entry: BldDrillAttempt = { ...attempt, id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now }; return { ...profile, drillAttempts: [entry, ...profile.drillAttempts].slice(0, MAX_DRILL_ATTEMPTS) }; }

/** Counts the memo records that were already reviewed today. */
export function reviewedToday(profile: BldProfile) { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(); return Object.values(profile.memoRecords).filter((record) => record.lastReviewedAt >= start).length; }
