import { formatSolveTime } from "@/lib/solveHistory";
import type { Language, Translate, WordPair } from "@/lib/i18n";

export type WcaRecordRow = {
  eventId: string;
  singleCentiseconds: number | null;
  averageCentiseconds: number | null;
  singleRanks: { world: number | null; continental: number | null; country: number | null };
  averageRanks: { world: number | null; continental: number | null; country: number | null };
};

export type WcaProfileData = {
  wcaId: string;
  name: string;
  countryName: string;
  countryIso2: string;
  avatarUrl: string | null;
  profileUrl: string;
  competitionCount: number;
  totalSolves: number;
  medals: { gold: number; silver: number; bronze: number; total: number };
  records: { national: number; continental: number; world: number; total: number };
  personalRecords: WcaRecordRow[];
};

/** The official WCA name of every event, in both languages. */
const WCA_EVENT_NAMES: Record<string, WordPair> = {
  "222": ["2×2×2", "2×2×2"],
  "333": ["3×3×3", "3×3×3"],
  "444": ["4×4×4", "4×4×4"],
  "555": ["5×5×5", "5×5×5"],
  "666": ["6×6×6", "6×6×6"],
  "777": ["7×7×7", "7×7×7"],
  "333bf": ["3×3 bịt mắt", "3×3 blindfolded"],
  "333fm": ["3×3 ít lượt xoay", "3×3 fewest moves"],
  "333oh": ["3×3 một tay", "3×3 one-handed"],
  clock: ["Clock", "Clock"],
  minx: ["Megaminx", "Megaminx"],
  pyram: ["Pyraminx", "Pyraminx"],
  skewb: ["Skewb", "Skewb"],
  sq1: ["Square-1", "Square-1"],
  "444bf": ["4×4 bịt mắt", "4×4 blindfolded"],
  "555bf": ["5×5 bịt mắt", "5×5 blindfolded"],
  "333mbf": ["3×3 nhiều khối bịt mắt", "3×3 multi-blind"],
};

/** The HTTP status a tRPC call failed with, when the failure came from the server. */
function httpStatus(error: unknown): number | undefined {
  const status = (error as { data?: { httpStatus?: unknown } } | null)?.data?.httpStatus;
  return typeof status === "number" ? status : undefined;
}

/** The tRPC error code a failed call came back with, such as `CONFLICT`. */
function trpcCode(error: unknown): string | undefined {
  const code = (error as { data?: { code?: unknown } } | null)?.data?.code;
  return typeof code === "string" ? code : undefined;
}

/**
 * The wording of a schema validation failure.
 *
 * The server answers with the whole zod payload as a JSON string, which is
 * never meant for a reader. The first field message is the one the visitor
 * needs, and the generic wording is the fallback when the payload carries
 * none.
 */
function validationMessage(message: string): string | null {
  try {
    const payload: unknown = JSON.parse(message);
    const issues = Array.isArray(payload) ? payload : [];
    const first = issues.find(
      (issue): issue is { message?: unknown } =>
        typeof issue === "object" && issue !== null,
    );
    const wording = first?.message;
    return typeof wording === "string" && wording.trim() ? wording : null;
  } catch {
    return null;
  }
}

/**
 * The message shown under a failed account action.
 *
 * A 4xx keeps the wording the server wrote for the visitor, unless the call
 * site knows the error code and offers its own translation. A 5xx is a
 * server-side failure whose message can carry SQL or stack details, so it
 * never reaches the interface, and neither does a raw validation payload.
 */
export function errorMessage(error: unknown, t: Translate, known?: Record<string, string>) {
  if (!(error instanceof Error)) return t("profile.error");
  const status = httpStatus(error);
  if (status !== undefined && status >= 500) return t("profile.errorServer");
  const code = trpcCode(error);
  if (code && known?.[code]) return t(known[code]);
  return validationMessage(error.message) ?? error.message;
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "CF";
}

export function formatWcaTime(centiseconds: number | null | undefined) {
  return centiseconds ? formatSolveTime(centiseconds * 10) : "—";
}

export function wcaEventName(eventId: string, language: Language) {
  const pair = WCA_EVENT_NAMES[eventId];
  if (!pair) return eventId.toUpperCase();
  return language === "vi" ? pair[0] : pair[1];
}

export function rankSummary(ranks: WcaRecordRow["singleRanks"], language: Language) {
  const parts = [["TG", ranks.world], ["CL", ranks.continental], ["QG", ranks.country]].filter((item): item is [string, number] => typeof item[1] === "number");
  const locale = language === "vi" ? "vi-VN" : "en-US";
  return parts.length ? parts.map(([label, rank]) => `${label} #${rank.toLocaleString(locale)}`).join(" · ") : "—";
}

export function comparisonMessage(deltaMs: number | null, t: Translate) {
  if (deltaMs === null) return t("profile.compare.deltaMissing");
  if (deltaMs === 0) return t("profile.compare.deltaEqual");
  const difference = formatSolveTime(Math.abs(deltaMs));
  return deltaMs < 0
    ? t("profile.compare.timerFaster", { value: difference })
    : t("profile.compare.wcaFaster", { value: difference });
}
