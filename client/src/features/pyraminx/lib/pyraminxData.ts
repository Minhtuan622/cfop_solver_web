/**
 * Pyraminx algorithm catalog for the Pyraminx study lane.
 *
 * Source: https://cubingapp.com/algorithms/Pyraminx-Last-Layer and
 * https://cubingapp.com/algorithms/Pyraminx-L4E (extracted 2026-11-17, one
 * canonical algorithm per case — the first variant published on the page).
 *
 * Two sets: Last Layer (5 cases, the down-edge-solved trigger set) and the
 * full Last-4-Edges set (35 cases, 5 subsets: down edge solved 5 · down edge
 * flipped 6 · upper edge solved 8 · upper edge flipped 8 · nothing placed 8).
 * The 5 Last-Layer cases are literally the down-edge-solved subset of L4E,
 * kept in both families because they are the page's canonical "last layer"
 * list and the full L4E list — same algorithms, separate SRS family keys.
 *
 * Case states are derived at call time via `invertedAlg` applied to the
 * solved puzzle (not supported by the app's own 2×2 model — the Pyraminx
 * orbits are solved here with cubing.js KPuzzle).
 */
export type PyraminxFamily = "ll" | "l4e";

export type PyraminxCaseRow = {
  id: string;
  family: PyraminxFamily;
  group: string;
  name: string;
  algorithm: string;
};

/** The 5 Last-Layer cases (down-edge-solved subset of L4E). */
export const LL_CASES_SOURCE: readonly PyraminxCaseRow[] = [
  { id: "LL-Sune", family: "ll", group: "LL", name: "Last Layer Sune", algorithm: "(R U R') U (R U R')" },
  { id: "LL-Antisune", family: "ll", group: "LL", name: "Last Layer Antisune", algorithm: "(R U' R') U' (R U' R')" },
  { id: "LL-2-Flip", family: "ll", group: "LL", name: "Last Layer 2-Flip", algorithm: "(L R' L' R) (U' R U R')" },
  { id: "LL-Unsexy-R", family: "ll", group: "LL", name: "Last Layer R' Unsexy R", algorithm: "R' (U' L' U L) R" },
  { id: "LL-Unsexy-L", family: "ll", group: "LL", name: "Last Layer L Unsexy L'", algorithm: "L (U R U' R') L'" },
];

/** The full Last-4-Edges set (35 cases in 5 subsets). */
export const L4E_CASES_SOURCE: readonly PyraminxCaseRow[] = [
  // Down Edge Solved (= the Last Layer set)
  { id: "L4E-DES-1", family: "l4e", group: "DES", name: "Down Edge Solved Sune", algorithm: "(R U R') U (R U R')" },
  { id: "L4E-DES-2", family: "l4e", group: "DES", name: "Down Edge Solved Antisune", algorithm: "(R U' R') U' (R U' R')" },
  { id: "L4E-DES-3", family: "l4e", group: "DES", name: "Down Edge Solved 2-Flip", algorithm: "(L R' L' R) (U' R U R')" },
  { id: "L4E-DES-4", family: "l4e", group: "DES", name: "Down Edge Solved R' Unsexy R", algorithm: "R' (U' L' U L) R" },
  { id: "L4E-DES-5", family: "l4e", group: "DES", name: "Down Edge Solved L Unsexy L'", algorithm: "L (U R U' R') L'" },
  // Down Edge Flipped
  { id: "L4E-DEF-1", family: "l4e", group: "DEF", name: "Down Edge Flipped #1", algorithm: "(R' L R L') U (R' L R L') U (R' L R L')" },
  { id: "L4E-DEF-2", family: "l4e", group: "DEF", name: "Down Edge Flipped #2", algorithm: "(L R' L' R) U (L R' L' R)" },
  { id: "L4E-DEF-3", family: "l4e", group: "DEF", name: "Down Edge Flipped #3", algorithm: "(R' L R L') U' (R' L R L')" },
  { id: "L4E-DEF-4", family: "l4e", group: "DEF", name: "Down Edge Flipped #4", algorithm: "U' (R' L R L') (R U' R')" },
  { id: "L4E-DEF-5", family: "l4e", group: "DEF", name: "Down Edge Flipped #5", algorithm: "U' (R U' R') (L' U' L)" },
  { id: "L4E-DEF-6", family: "l4e", group: "DEF", name: "Down Edge Flipped #6", algorithm: "U (L' U L) (R U R')" },
  // Upper Edge Solved
  { id: "L4E-UES-1", family: "l4e", group: "UES", name: "Upper Edge Solved #1", algorithm: "U L' U' L" },
  { id: "L4E-UES-2", family: "l4e", group: "UES", name: "Upper Edge Solved #2", algorithm: "U' R U R'" },
  { id: "L4E-UES-3", family: "l4e", group: "UES", name: "Upper Edge Solved #3", algorithm: "U' R U R'" },
  { id: "L4E-UES-4", family: "l4e", group: "UES", name: "Upper Edge Solved #4", algorithm: "R' L R L'" },
  { id: "L4E-UES-5", family: "l4e", group: "UES", name: "Upper Edge Solved #5", algorithm: "R' L R L2' U L" },
  { id: "L4E-UES-6", family: "l4e", group: "UES", name: "Upper Edge Solved #6", algorithm: "L R' L' R2 U' R'" },
  { id: "L4E-UES-7", family: "l4e", group: "UES", name: "Upper Edge Solved #7", algorithm: "R U' R'" },
  { id: "L4E-UES-8", family: "l4e", group: "UES", name: "Upper Edge Solved #8", algorithm: "L' U L" },
  // Upper Edge Flipped
  { id: "L4E-UEF-1", family: "l4e", group: "UEF", name: "Upper Edge Flipped #1", algorithm: "(R U R') U (R' L R L')" },
  { id: "L4E-UEF-2", family: "l4e", group: "UEF", name: "Upper Edge Flipped #2", algorithm: "(L' U' L) U' (L R' L' R)" },
  { id: "L4E-UEF-3", family: "l4e", group: "UEF", name: "Upper Edge Flipped #3", algorithm: "U (L' U L) U' (R U R')" },
  { id: "L4E-UEF-4", family: "l4e", group: "UEF", name: "Upper Edge Flipped #4", algorithm: "U' (R U' R') U (L' U' L)" },
  { id: "L4E-UEF-5", family: "l4e", group: "UEF", name: "Upper Edge Flipped #5", algorithm: "(R U R') U (L' U L)" },
  { id: "L4E-UEF-6", family: "l4e", group: "UEF", name: "Upper Edge Flipped #6", algorithm: "(L' U' L) U' (R U' R')" },
  { id: "L4E-UEF-7", family: "l4e", group: "UEF", name: "Upper Edge Flipped #7", algorithm: "U (R' L R L') U (L' U L)" },
  { id: "L4E-UEF-8", family: "l4e", group: "UEF", name: "Upper Edge Flipped #8", algorithm: "U' (L R' L' R) U' (R U' R')" },
  // Nothing Placed
  { id: "L4E-NP-1", family: "l4e", group: "NP", name: "Nothing Placed #1", algorithm: "U R U' R2' L R L'" },
  { id: "L4E-NP-2", family: "l4e", group: "NP", name: "Nothing Placed #2", algorithm: "U' L' U L2 R' L' R" },
  { id: "L4E-NP-3", family: "l4e", group: "NP", name: "Nothing Placed #3", algorithm: "U' (L' U' L) U (R U R')" },
  { id: "L4E-NP-4", family: "l4e", group: "NP", name: "Nothing Placed #4", algorithm: "U (R U R') U' (L' U' L)" },
  { id: "L4E-NP-5", family: "l4e", group: "NP", name: "Nothing Placed #5", algorithm: "U (R U' R') U' (R U R')" },
  { id: "L4E-NP-6", family: "l4e", group: "NP", name: "Nothing Placed #6", algorithm: "U' (L' U L) U (L' U' L)" },
  { id: "L4E-NP-7", family: "l4e", group: "NP", name: "Nothing Placed #7", algorithm: "U' (L' U L) (R U' R')" },
  { id: "L4E-NP-8", family: "l4e", group: "NP", name: "Nothing Placed #8", algorithm: "U (R U' R') (L' U L)" },
];

export const PYRAMINX_CATALOG: readonly PyraminxCaseRow[] = [
  ...LL_CASES_SOURCE,
  ...L4E_CASES_SOURCE,
];

/** Subset codes per family, in a stable learner-friendly order. */
export const LL_GROUPS = ["LL"] as const;
export const L4E_GROUPS = ["DES", "DEF", "UES", "UEF", "NP"] as const;
/** Groups browse-able per set; "all" browses the union (LL duplicates the DES subset). */
export const PYRAMINX_GROUPS_BY_SET: Record<PyraminxFamily | "all", readonly string[]> = {
  ll: LL_GROUPS,
  l4e: L4E_GROUPS,
  all: [...LL_GROUPS, ...L4E_GROUPS],
};
export const PYRAMINX_COUNTS = {
  ll: LL_CASES_SOURCE.length,
  l4e: L4E_CASES_SOURCE.length,
  all: LL_CASES_SOURCE.length + L4E_CASES_SOURCE.length,
} as const;
