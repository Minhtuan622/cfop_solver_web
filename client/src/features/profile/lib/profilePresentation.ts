import { formatSolveTime } from "./solveHistory";

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

const WCA_EVENT_NAMES: Record<string, string> = {
  "222": "2×2×2", "333": "3×3×3", "444": "4×4×4", "555": "5×5×5", "666": "6×6×6", "777": "7×7×7",
  "333bf": "3×3 bịt mắt", "333fm": "3×3 ít lượt xoay", "333oh": "3×3 một tay", clock: "Clock", minx: "Megaminx",
  pyram: "Pyraminx", skewb: "Skewb", sq1: "Square-1", "444bf": "4×4 bịt mắt", "555bf": "5×5 bịt mắt", "333mbf": "3×3 nhiều khối bịt mắt",
};

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Không thể hoàn tất. Hãy thử lại.";
}

export function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "CF";
}

export function formatWcaTime(centiseconds: number | null | undefined) {
  return centiseconds ? formatSolveTime(centiseconds * 10) : "—";
}

export function wcaEventName(eventId: string) {
  return WCA_EVENT_NAMES[eventId] ?? eventId.toUpperCase();
}

export function rankSummary(ranks: WcaRecordRow["singleRanks"]) {
  const parts = [["TG", ranks.world], ["CL", ranks.continental], ["QG", ranks.country]].filter((item): item is [string, number] => typeof item[1] === "number");
  return parts.length ? parts.map(([label, rank]) => `${label} #${rank.toLocaleString("vi-VN")}`).join(" · ") : "—";
}

export function comparisonMessage(deltaMs: number | null) {
  if (deltaMs === null) return "Cần dữ liệu ở cả hai nguồn";
  if (deltaMs === 0) return "Hai nguồn bằng nhau";
  const difference = formatSolveTime(Math.abs(deltaMs));
  return deltaMs < 0 ? `Timer nhanh hơn ${difference}` : `WCA nhanh hơn ${difference}`;
}
