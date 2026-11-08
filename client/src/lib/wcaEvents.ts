import type { Language, WordPair } from "./i18n";

/** The official WCA name of every current event, in both languages. */
const WCA_EVENT_NAMES: Record<string, WordPair> = {
  "222": ["2×2×2", "2×2×2"],
  "333": ["3×3×3", "3×3×3"],
  "444": ["4×4×4", "4×4×4"],
  "555": ["5×5×5", "5×5×5"],
  "666": ["6×6×6", "6×6×6"],
  "777": ["7×7×7", "7×7×7"],
  "333bf": ["3×3 bịt mắt", "3×3 blindfolded"],
  "333fm": ["3×3 ít nước nhất", "3×3 fewest moves"],
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

/** A short, scannable label for an event, used on competition cards. */
const WCA_EVENT_SHORT_NAMES: Record<string, WordPair> = {
  "222": ["2×2", "2×2"],
  "333": ["3×3", "3×3"],
  "444": ["4×4", "4×4"],
  "555": ["5×5", "5×5"],
  "666": ["6×6", "6×6"],
  "777": ["7×7", "7×7"],
  "333bf": ["3BLD", "3BLD"],
  "333fm": ["FMC", "FMC"],
  "333oh": ["OH", "OH"],
  clock: ["Clock", "Clock"],
  minx: ["Mega", "Mega"],
  pyram: ["Pyra", "Pyra"],
  skewb: ["Skewb", "Skewb"],
  sq1: ["SQ1", "SQ1"],
  "444bf": ["4BLD", "4BLD"],
  "555bf": ["5BLD", "5BLD"],
  "333mbf": ["MBLD", "MBLD"],
};

/** The WCA event name for the language of the interface. */
export function wcaEventName(eventId: string, language: Language) {
  const pair = WCA_EVENT_NAMES[eventId];
  if (!pair) return eventId.toUpperCase();
  return language === "vi" ? pair[0] : pair[1];
}

/** A short label for an event, used on competition cards. */
export function wcaEventShortName(eventId: string, language: Language) {
  const pair = WCA_EVENT_SHORT_NAMES[eventId];
  if (!pair) return eventId.toUpperCase();
  return language === "vi" ? pair[0] : pair[1];
}
