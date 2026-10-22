import type { Language } from "@/lib/i18n";
import type { CrossColor } from "@/lib/solverRuntime";

/** A cube state the visitor painted earlier and can bring back in one click. */
export type RecentCubeState = {
  id: string;
  state: string;
  label: string;
  savedAt: string;
  crossColor: CrossColor;
};

const RECENT_STATE_KEY = "cfop-studio-recent-states-v1";
const RECENT_STATE_LIMIT = 8;

function isRecentState(value: unknown): value is RecentCubeState {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<RecentCubeState>;
  return typeof item.state === "string" && item.state.length === 54;
}

/** The states kept in the browser, newest first. */
export function readRecentStates(): RecentCubeState[] {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_STATE_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter(isRecentState).slice(0, RECENT_STATE_LIMIT) : [];
  } catch {
    return [];
  }
}

export function writeRecentStates(states: RecentCubeState[]) {
  localStorage.setItem(RECENT_STATE_KEY, JSON.stringify(states));
}

/** The short label a saved state carries in the list. */
export function recentStateLabel(language: Language, savedAt: Date) {
  return `State · ${new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(savedAt)}`;
}

/** Puts a state at the front of the list, without repeating itself. */
export function rememberRecentState(states: RecentCubeState[], state: string, crossColor: CrossColor, language: Language): RecentCubeState[] {
  if (state.length !== 54) return states;
  const now = new Date();
  const entry: RecentCubeState = {
    id: `${now.getTime()}-${state.slice(0, 6)}`,
    state,
    crossColor,
    label: recentStateLabel(language, now),
    savedAt: now.toISOString(),
  };
  return [entry, ...states.filter((item) => item.state !== state)].slice(0, RECENT_STATE_LIMIT);
}
