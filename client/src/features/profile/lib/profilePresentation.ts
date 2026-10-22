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

export function errorMessage(error: unknown, t: Translate) {
  return error instanceof Error ? error.message : t("profile.error");
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
