/**
 * Square-1 algorithm catalog for the Square-1 study lane.
 *
 * Source: https://cubingapp.com/algorithms/SQ1-CP · /SQ1-Cube-Shape ·
 * /SQ1-CSP · /SQ1-EO · /SQ1-EP · /SQ1-OBL (extracted 2026-11-17, one
 * canonical algorithm per case — the first variant published on the page).
 *
 * Six sets, grouped exactly as the source subsets:
 * - cp (SQ1-CP): 8 cases, 3 groups
 * - cs (SQ1-Cube-Shape): 169 cases, 7 groups
 * - csp (SQ1-CSP): 179 cases, 7 groups
 * - eo (SQ1-EO): 7 cases, 1 groups
 * - ep (SQ1-EP): 40 cases, 8 groups
 * - obl (SQ1-OBL): 185 cases, 6 groups
 *
 * Algorithms are stored in standard parenthesized notation
 * "(x,y) / (x,y)" (the source omits the parentheses) so the app's 2D/3D
 * player (twisty) can parse them. Case pre-image states are derived at call
 * time via the inverted algorithm applied to the solved puzzle (cubing.js
 * KPuzzle); the catalog keeps a sentinel state for the icon preview.
 */
import { CP_CASES_SOURCE } from "./squareOneSets/cp";
import { CS_CASES_SOURCE } from "./squareOneSets/cs";
import { CSP_CASES_SOURCE } from "./squareOneSets/csp";
import { EO_CASES_SOURCE } from "./squareOneSets/eo";
import { EP_CASES_SOURCE } from "./squareOneSets/ep";
import { OBL_CASES_SOURCE } from "./squareOneSets/obl";

export type SquareOneFamily = "cp" | "cs" | "csp" | "eo" | "ep" | "obl";

export type SquareOneCaseRow = {
  id: string;
  family: SquareOneFamily;
  group: string;
  name: string;
  algorithm: string;
};

export const SQUARE_ONE_CATALOG: readonly SquareOneCaseRow[] = [
  ...CP_CASES_SOURCE,
  ...CS_CASES_SOURCE,
  ...CSP_CASES_SOURCE,
  ...EO_CASES_SOURCE,
  ...EP_CASES_SOURCE,
  ...OBL_CASES_SOURCE,
];

export const SQ1_FAMILIES = ["cp", "cs", "csp", "eo", "ep", "obl"] as const;
export const SQ1_COUNTS: Record<SquareOneFamily, number> = {
  cp: CP_CASES_SOURCE.length,
  cs: CS_CASES_SOURCE.length,
  csp: CSP_CASES_SOURCE.length,
  eo: EO_CASES_SOURCE.length,
  ep: EP_CASES_SOURCE.length,
  obl: OBL_CASES_SOURCE.length,
} as const;
// Union groups per family for the catalog drawer.
export const SQUARE_ONE_GROUPS_BY_SET: Record<SquareOneFamily, readonly string[]> = {
  "cp": ["Top Adj", "Top Opp", "Top Solved"],
  "cs": ["1 Slash", "2 Slashes", "3 Slashes", "4 Slashes", "5 Slashes", "6 Slashes", "7 Slashes"],
  "csp": ["4 Slashes", "5 Slashes", "6 Slashes", "2 Slashes", "3 Slashes", "7 Slashes", "1 Slash"],
  "eo": ["EO Algs"],
  "ep": ["Bottom Solved", "Top Opp", "Top Adj", "Top Ua", "Top Ub", "Top H", "Top Z", "Top Solved"],
  "obl": ["1 Slash", "2 Slashes", "3 Slashes", "4 Slashes", "5 Slashes", "6 Slashes"],
}

