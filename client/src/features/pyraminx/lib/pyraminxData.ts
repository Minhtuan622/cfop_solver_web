export type PyraminxFamily = "ll" | "l4e";

export type PyraminxCaseRow = {
  id: string;
  family: PyraminxFamily;
  group: string;
  name: string;
  algorithm: string;
};

export const LL_CASES_SOURCE: readonly PyraminxCaseRow[] = [
  { id: "LL-Sune", family: "ll", group: "LL", name: "Last Layer Sune", algorithm: "(R U R') U (R U R')" },
  { id: "LL-Antisune", family: "ll", group: "LL", name: "Last Layer Antisune", algorithm: "(R U' R') U' (R U' R')" },
  { id: "LL-2-Flip", family: "ll", group: "LL", name: "Last Layer 2-Flip", algorithm: "(L R' L' R) (U' R U R')" },
  { id: "LL-Unsexy-R", family: "ll", group: "LL", name: "Last Layer R' Unsexy R", algorithm: "R' (U' L' U L) R" },
  { id: "LL-Unsexy-L", family: "ll", group: "LL", name: "Last Layer L Unsexy L'", algorithm: "L (U R U' R') L'" },
];

export const L4E_CASES_SOURCE: readonly PyraminxCaseRow[] = [
  { id: "L4E-DES-1", family: "l4e", group: "DES", name: "Down Edge Solved Sune", algorithm: "(R U R') U (R U R')" },
  { id: "L4E-DES-2", family: "l4e", group: "DES", name: "Down Edge Solved Antisune", algorithm: "(R U' R') U' (R U' R')" },
  { id: "L4E-DES-3", family: "l4e", group: "DES", name: "Down Edge Solved 2-Flip", algorithm: "(L R' L' R) (U' R U R')" },
  { id: "L4E-DES-4", family: "l4e", group: "DES", name: "Down Edge Solved R' Unsexy R", algorithm: "R' (U' L' U L) R" },
  { id: "L4E-DES-5", family: "l4e", group: "DES", name: "Down Edge Solved L Unsexy L'", algorithm: "L (U R U' R') L'" },
  { id: "L4E-DEF-1", family: "l4e", group: "DEF", name: "Down Edge Flipped #1", algorithm: "(R' L R L') U (R' L R L') U (R' L R L')" },
  { id: "L4E-DEF-2", family: "l4e", group: "DEF", name: "Down Edge Flipped #2", algorithm: "(L R' L' R) U (L R' L' R)" },
  { id: "L4E-DEF-3", family: "l4e", group: "DEF", name: "Down Edge Flipped #3", algorithm: "(R' L R L') U' (R' L R L')" },
  { id: "L4E-DEF-4", family: "l4e", group: "DEF", name: "Down Edge Flipped #4", algorithm: "U' (R' L R L') (R U' R')" },
  { id: "L4E-DEF-5", family: "l4e", group: "DEF", name: "Down Edge Flipped #5", algorithm: "U' (R U' R') (L' U' L)" },
  { id: "L4E-DEF-6", family: "l4e", group: "DEF", name: "Down Edge Flipped #6", algorithm: "U (L' U L) (R U R')" },
  { id: "L4E-UES-1", family: "l4e", group: "UES", name: "Upper Edge Solved #1", algorithm: "U L' U' L" },
  { id: "L4E-UES-2", family: "l4e", group: "UES", name: "Upper Edge Solved #2", algorithm: "U' R U R'" },
  { id: "L4E-UES-3", family: "l4e", group: "UES", name: "Upper Edge Solved #3", algorithm: "U' R U R'" },
  { id: "L4E-UES-4", family: "l4e", group: "UES", name: "Upper Edge Solved #4", algorithm: "R' L R L'" },
  { id: "L4E-UES-5", family: "l4e", group: "UES", name: "Upper Edge Solved #5", algorithm: "R' L R L2' U L" },
  { id: "L4E-UES-6", family: "l4e", group: "UES", name: "Upper Edge Solved #6", algorithm: "L R' L' R2 U' R'" },
  { id: "L4E-UES-7", family: "l4e", group: "UES", name: "Upper Edge Solved #7", algorithm: "R U' R'" },
  { id: "L4E-UES-8", family: "l4e", group: "UES", name: "Upper Edge Solved #8", algorithm: "L' U L" },
  { id: "L4E-UEF-1", family: "l4e", group: "UEF", name: "Upper Edge Flipped #1", algorithm: "(R U R') U (R' L R L')" },
  { id: "L4E-UEF-2", family: "l4e", group: "UEF", name: "Upper Edge Flipped #2", algorithm: "(L' U' L) U' (L R' L' R)" },
  { id: "L4E-UEF-3", family: "l4e", group: "UEF", name: "Upper Edge Flipped #3", algorithm: "U (L' U L) U' (R U R')" },
  { id: "L4E-UEF-4", family: "l4e", group: "UEF", name: "Upper Edge Flipped #4", algorithm: "U' (R U' R') U (L' U' L)" },
  { id: "L4E-UEF-5", family: "l4e", group: "UEF", name: "Upper Edge Flipped #5", algorithm: "(R U R') U (L' U L)" },
  { id: "L4E-UEF-6", family: "l4e", group: "UEF", name: "Upper Edge Flipped #6", algorithm: "(L' U' L) U' (R U' R')" },
  { id: "L4E-UEF-7", family: "l4e", group: "UEF", name: "Upper Edge Flipped #7", algorithm: "U (R' L R L') U (L' U L)" },
  { id: "L4E-UEF-8", family: "l4e", group: "UEF", name: "Upper Edge Flipped #8", algorithm: "U' (L R' L' R) U' (R U' R')" },
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

export const LL_GROUPS = ["LL"] as const;
export const L4E_GROUPS = ["DES", "DEF", "UES", "UEF", "NP"] as const;
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
