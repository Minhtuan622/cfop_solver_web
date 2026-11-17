/**
 * CFOP 3×3 algorithm catalog for the /study CFOP lane.
 *
 * Contents: full F2L 4 slot angles (164 cases from cubingapp.com's published
 * set — see `f2l4AnglesData.ts`), plus 57 OLL and 21 PLL cases — the standard
 * speedsolving set. Case states are NOT embedded: `cfopCaseState` derives
 * them from the algorithms via `applyFastMoves(SOLVED_FAST_STATE, invertAlgorithm(alg))`,
 * so every shown case is guaranteed to be solved by its own algorithm (pinned
 * by tests: cubeValidation for every derived state + alg round-trip).
 */
import { F2L_4ANGLES_ROWS } from "./f2l4AnglesData";
import { COLL_CASES } from "./cfopCollData";
import { OLLCP_CASES } from "./cfopOLLCPData";

export type CfopFamily = "f2l" | "oll" | "pll" | "coll" | "ollcp";

export type CfopCaseRow = {
  id: string;
  family: CfopFamily;
  /** FR/FL/BR/BL for F2L, "oll"/"pll" for the rest. */
  group: string;
  name: string;
  algorithm: string;
};

export const F2L_CASES: readonly CfopCaseRow[] = F2L_4ANGLES_ROWS;
export const F2L_4WAY_CASES: readonly CfopCaseRow[] = F2L_4ANGLES_ROWS;
export { COLL_CASES, OLLCP_CASES };

export const OLL_CASES: readonly CfopCaseRow[] = [
  { id: "OLL-01", family: "oll", group: "oll", name: "OLL 1", algorithm: "R U2 R2 F R F' U2 R' F R F'" },
  { id: "OLL-02", family: "oll", group: "oll", name: "OLL 2", algorithm: "F R U R' U' F' f R U R' U' f'" },
  { id: "OLL-03", family: "oll", group: "oll", name: "OLL 3", algorithm: "f R U R' U' F' U F R U2 R' U' f'" },
  { id: "OLL-04", family: "oll", group: "oll", name: "OLL 4", algorithm: "f R U R' U' f' U' F R U R' U' F'" },
  { id: "OLL-05", family: "oll", group: "oll", name: "OLL 5", algorithm: "r' U2 R U R' U r" },
  { id: "OLL-06", family: "oll", group: "oll", name: "OLL 6", algorithm: "r U2 R' U' R U' r'" },
  { id: "OLL-07", family: "oll", group: "oll", name: "OLL 7", algorithm: "r U R' U R U2 r'" },
  { id: "OLL-08", family: "oll", group: "oll", name: "OLL 8", algorithm: "R U2 R' U2 R F R' F' U2 R' F R F'" },
  { id: "OLL-09", family: "oll", group: "oll", name: "OLL 9 (Sune fish)", algorithm: "R U R' U' R' F R2 U R' U' R U R' U' F'" },
  { id: "OLL-10", family: "oll", group: "oll", name: "OLL 10", algorithm: "F R' F R2 U' R' U' R U R' F'" },
  { id: "OLL-11", family: "oll", group: "oll", name: "OLL 11", algorithm: "r U R' U R' F R F' R U2 r'" },
  { id: "OLL-12", family: "oll", group: "oll", name: "OLL 12", algorithm: "F R U R' U' R' F R2 U' R' U' R U R' U R" },  { id: "OLL-13", family: "oll", group: "oll", name: "OLL 13", algorithm: "F U R U' R2 F' R U R U' R'" },
  { id: "OLL-14", family: "oll", group: "oll", name: "OLL 14", algorithm: "R' F R U R' F' R F' U2 F U' R' F R" },
  { id: "OLL-15", family: "oll", group: "oll", name: "OLL 15", algorithm: "R U R' U' R U' R' U2 R U R' U2 R'" },
  { id: "OLL-16", family: "oll", group: "oll", name: "OLL 16", algorithm: "r U M U2 r' U M r2" },
  { id: "OLL-17", family: "oll", group: "oll", name: "OLL 17", algorithm: "R U R' U R' F R F' U2 R' F R F'" },
  { id: "OLL-18", family: "oll", group: "oll", name: "OLL 18", algorithm: "R U R' U R U' R' U R U2 R'" },
  { id: "OLL-19", family: "oll", group: "oll", name: "OLL 19", algorithm: "R U2 R2 U' R2 U2 R U2 R' U2 R U' R'" },
  { id: "OLL-20", family: "oll", group: "oll", name: "OLL 20", algorithm: "r U2 R' U R U2 r'" },
  { id: "OLL-21", family: "oll", group: "oll", name: "OLL 21", algorithm: "R U2 R' U2 R' F R2 U' R' U' R U R' U R" },
  { id: "OLL-22", family: "oll", group: "oll", name: "OLL 22", algorithm: "R U2 R2 U' R2 U' R2 U2 R" },
  { id: "OLL-23", family: "oll", group: "oll", name: "OLL 23", algorithm: "R2 D' R U2 R' D R U2 R" },
  { id: "OLL-24", family: "oll", group: "oll", name: "OLL 24", algorithm: "r U R' U' r' F R F'" },
  { id: "OLL-25", family: "oll", group: "oll", name: "OLL 25", algorithm: "F' r U R' U' r' F R" },
  { id: "OLL-26", family: "oll", group: "oll", name: "OLL 26 (Sune)", algorithm: "R U2 R' U' R U' R'" },
  { id: "OLL-27", family: "oll", group: "oll", name: "OLL 27 (Anti-Sune)", algorithm: "R U R' U R U2 R'" },
  { id: "OLL-28", family: "oll", group: "oll", name: "OLL 28 (x)", algorithm: "R U R' U R U2 R' U R2 U2 R'" },
  { id: "OLL-29", family: "oll", group: "oll", name: "OLL 29", algorithm: "R U R' U' R U' R' F' U' F R U R" },
  { id: "OLL-30", family: "oll", group: "oll", name: "OLL 30", algorithm: "F R' F R2 U' R' U' R U R' F2" },
  { id: "OLL-31", family: "oll", group: "oll", name: "OLL 31", algorithm: "R' U' F U R U' R' F' R" },
  { id: "OLL-32", family: "oll", group: "oll", name: "OLL 32", algorithm: "L U F' U' L' U L F L'" },
  { id: "OLL-33", family: "oll", group: "oll", name: "OLL 33", algorithm: "R U R' U R U' F R U' F'" },
  { id: "OLL-34", family: "oll", group: "oll", name: "OLL 34", algorithm: "R U R2 U' R' U' R U R' U R" },
  { id: "OLL-35", family: "oll", group: "oll", name: "OLL 35", algorithm: "R U2 R2 U' R U' R' U2 F R F'" },
  { id: "OLL-36", family: "oll", group: "oll", name: "OLL 36", algorithm: "F R' F' R U R U' R'" },
  { id: "OLL-37", family: "oll", group: "oll", name: "OLL 37", algorithm: "U F R U' R' U R U2 R' U' R U' R' F'" },
  { id: "OLL-38", family: "oll", group: "oll", name: "OLL 38", algorithm: "F R U R' U' F' U F2 R U' R' U R' U' F" },
  { id: "OLL-39", family: "oll", group: "oll", name: "OLL 39", algorithm: "L F' L' U' L U F U' L' U" },
  { id: "OLL-40", family: "oll", group: "oll", name: "OLL 40", algorithm: "F U R U' R' F R U2 R' U R U' R'" },
  { id: "OLL-41", family: "oll", group: "oll", name: "OLL 41", algorithm: "R U R' U R U2 R' F R U R' U' F'" },
  { id: "OLL-42", family: "oll", group: "oll", name: "OLL 42", algorithm: "F R U R' U' F' f R U' R' U' f'" },
  { id: "OLL-43", family: "oll", group: "oll", name: "OLL 43", algorithm: "R' U2 R U R' U2 R U R'" },
  { id: "OLL-44", family: "oll", group: "oll", name: "OLL 44", algorithm: "f R U R' U' f' U F R U R' U' F'" },
  { id: "OLL-45", family: "oll", group: "oll", name: "OLL 45", algorithm: "F R U R' U' F' R U R' U' R' F R F'" },
  { id: "OLL-46", family: "oll", group: "oll", name: "OLL 46", algorithm: "R' U' F U R U' R' F' U R U' R'" },
  { id: "OLL-47", family: "oll", group: "oll", name: "OLL 47", algorithm: "R' F R' U' F' U' R U' R'" },
  { id: "OLL-48", family: "oll", group: "oll", name: "OLL 48", algorithm: "F U R U' R' F R' F R F'" },
  { id: "OLL-49", family: "oll", group: "oll", name: "OLL 49", algorithm: "R U' R' U R U' R' U2 R U R'" },
  { id: "OLL-50", family: "oll", group: "oll", name: "OLL 50", algorithm: "R U2 R' U R U R2 U2 R2 U' R2" },
  { id: "OLL-51", family: "oll", group: "oll", name: "OLL 51", algorithm: "R U2 R' U R U2 R' U R U2 R' U2 R'" },
  { id: "OLL-52", family: "oll", group: "oll", name: "OLL 52", algorithm: "F R U R' U' F' U2 F2 U' F" },
  { id: "OLL-53", family: "oll", group: "oll", name: "OLL 53", algorithm: "r U R' U2 R U2 r' U' R U R'" },
  { id: "OLL-54", family: "oll", group: "oll", name: "OLL 54", algorithm: "r U R' U M U2 r' U M'" },
  { id: "OLL-55", family: "oll", group: "oll", name: "OLL 55", algorithm: "R U2 F R' F' R U2 R' F R F' U' F" },
  { id: "OLL-56", family: "oll", group: "oll", name: "OLL 56", algorithm: "R U2 R' U' R U2 R2 U2 R' U2 R" },
  { id: "OLL-57", family: "oll", group: "oll", name: "OLL 57", algorithm: "R' U' L U R U' L' U R U' R' U2 R" },
];

export const PLL_CASES: readonly CfopCaseRow[] = [
  { id: "PLL-Aa", family: "pll", group: "pll", name: "Aa perm", algorithm: "x R' U R' D2 R U' R' D2 R2 x'" },
  { id: "PLL-Ab", family: "pll", group: "pll", name: "Ab perm", algorithm: "x R2 D2 R U R' D2 R U' R x'" },
  { id: "PLL-E", family: "pll", group: "pll", name: "E perm", algorithm: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },
  { id: "PLL-F", family: "pll", group: "pll", name: "F perm", algorithm: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
  { id: "PLL-Ga", family: "pll", group: "pll", name: "Ga perm", algorithm: "R2 U R' U R' U' R U' R2 D U' R' U R D'" },
  { id: "PLL-Gb", family: "pll", group: "pll", name: "Gb perm", algorithm: "R' U' R U D' R2 U R' U R U' R2 D" },
  { id: "PLL-Gc", family: "pll", group: "pll", name: "Gc perm", algorithm: "R2 U' R' U' R U R' U R2 D' U R' U' R D" },
  { id: "PLL-Gd", family: "pll", group: "pll", name: "Gd perm", algorithm: "R U R' U' D R2 U' R U' R' U R2 D'" },
  { id: "PLL-H", family: "pll", group: "pll", name: "H perm", algorithm: "M2 U M2 U2 M2 U M2" },
  { id: "PLL-Ja", family: "pll", group: "pll", name: "Ja perm", algorithm: "R' U L' U2 R U' R' U2 R L U' R' U'" },
  { id: "PLL-Jb", family: "pll", group: "pll", name: "Jb perm", algorithm: "R U R' F' R U R' U' R' F R2 U' R' U'" },
  { id: "PLL-Na", family: "pll", group: "pll", name: "Na perm", algorithm: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'" },
  { id: "PLL-Nb", family: "pll", group: "pll", name: "Nb perm", algorithm: "R' U R U' R' U' R U R' F' R U R' U' R' F' R U2 R" },
  { id: "PLL-Ra", family: "pll", group: "pll", name: "Ra perm", algorithm: "R U' R' U' R U R D R' U' R D' R' U2 R' U' R U' R'" },
  { id: "PLL-Rb", family: "pll", group: "pll", name: "Rb perm", algorithm: "R' U2 R U2 R' F R U R' U' R' F' R2 U R' U R U2 R'" },
  { id: "PLL-T", family: "pll", group: "pll", name: "T perm", algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'" },
  { id: "PLL-Ua", family: "pll", group: "pll", name: "Ua perm", algorithm: "R U' R U R U R U' R' U' R2" },
  { id: "PLL-Ub", family: "pll", group: "pll", name: "Ub perm", algorithm: "R' U R' U' R' U' R' U R U R2" },
  { id: "PLL-V", family: "pll", group: "pll", name: "V perm", algorithm: "R' U R' U' R' F' R2 U' R' U R' F R F" },
  { id: "PLL-Y", family: "pll", group: "pll", name: "Y perm", algorithm: "R U' R' U' R U R' F' R U R' U' R' F R" },
  { id: "PLL-Z", family: "pll", group: "pll", name: "Z perm", algorithm: "M' U M2 U M2 U M' U2 M2" },
];

/** The full CFOP catalog in practice order: F2L (4 directions) → OLL → PLL → COLL → OLLCP. */
export const CFOP_CASES: readonly CfopCaseRow[] = [
  ...F2L_4WAY_CASES,
  ...OLL_CASES,
  ...PLL_CASES,
  ...COLL_CASES,
  ...OLLCP_CASES,
];
