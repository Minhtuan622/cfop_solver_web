import { formatSolveTime } from "@/lib/solveHistory";
import type { Language, Translate } from "@/lib/i18n";

/** The wording of a failed account action; it lives with the other API helpers. */
export { errorMessage } from "@/lib/apiError";
export { wcaEventName } from "@/lib/wcaEvents";

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

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "CF";
}

export function formatWcaTime(centiseconds: number | null | undefined) {
  return centiseconds ? formatSolveTime(centiseconds * 10) : "—";
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
