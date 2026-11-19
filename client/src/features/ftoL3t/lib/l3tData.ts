/**
 * FTO 3-Look L3T catalog for the FTO L3T study lane.
 *
 * The FTO (Face-Turning Octahedron) is solved with the Bencisco method; this
 * is its beginner-friendly finish. All algorithms are from HCubist's
 * 3-Look L3T sheet (hcubist.com/learn/algorithms/fto-3-look-l3t, accessed
 * 2026-11-18), which splits the finish into:
 *   PF  — pair formation (form the three pairs), 9 cases
 *   TL  — solve the top layer, 5 cases
 *   LT  — solve the last triangles, 3 cases
 * 17 cases, shown in practice order PF → TL → LT (no PF 7 — as published).
 *
 * Notation (the published macros are expanded so the cubing.js twisty-player
 * can apply them):
 *   S  = R' L R L'   S'  = L R' L' R      (sledge / inverse sledge)
 *   H  = R U' R' U   H'  = U' R U R'      (HCubist's hedge, edge-in-front grip)
 * Whole-cube regrips from the sheet ("{L,U}", "{U,BR}"…) are NOT moves — they
 * mark the required hand regrip (hold yellow on U, edge/corner in front as
 * the case requires) and are dropped. FTO turns are 120°; lowercase letters
 * (r …) are the FTO wide turns, as on the sheet.
 *
 * Every algorithm below parses cleanly through cubing.js's FTO KPuzzle and
 * round-trips (inverse then algorithm = solved) — verified 2026-11-18, this
 * is the same verification level as the 4×4 PLL parity lane.
 */
export type FtoL3tFamily = "l3t";
export type FtoL3tGroup = "PF" | "TL" | "LT";

export type FtoL3tCaseRow = {
  id: string;
  family: FtoL3tFamily;
  group: FtoL3tGroup;
  name: string;
  algorithm: string;
};

/** The 17 3-Look L3T cases (practice order: PF, TL, LT). */
export const FTO_L3T_CASES: readonly FtoL3tCaseRow[] = [
  // PF — pair formation (form the pairs, ends ready for TL)
  { id: "PF-1",  family: "l3t", group: "PF", name: "PF 1",  algorithm: "R' L R L' F" },
  { id: "PF-2",  family: "l3t", group: "PF", name: "PF 2",  algorithm: "L R' L' R F' R U' R' U F" },
  { id: "PF-3",  family: "l3t", group: "PF", name: "PF 3",  algorithm: "L R' L' R F' L R' L' R F" },
  { id: "PF-4",  family: "l3t", group: "PF", name: "PF 4",  algorithm: "L R' L' R F' L R' L' R F'" },
  { id: "PF-5",  family: "l3t", group: "PF", name: "PF 5",  algorithm: "R' L R L' F'" },
  { id: "PF-6",  family: "l3t", group: "PF", name: "PF 6",  algorithm: "L R' L' R F" },
  { id: "PF-8",  family: "l3t", group: "PF", name: "PF 8",  algorithm: "L R' L' R F'" },
  { id: "PF-9",  family: "l3t", group: "PF", name: "PF 9",  algorithm: "L R' L' R F' U' R U R' F'" },
  { id: "PF-10", family: "l3t", group: "PF", name: "PF 10", algorithm: "L R' L' R F' L R' L' R F' R U' R' U F" },

  // TL — top layer (corners of the last three triples)
  { id: "TL-1",  family: "l3t", group: "TL", name: "TL 1",  algorithm: "R' L R L'" },
  { id: "TL-2",  family: "l3t", group: "TL", name: "TL 2",  algorithm: "R U' R' U" },
  { id: "TL-3",  family: "l3t", group: "TL", name: "TL 3",  algorithm: "R U' R' U R' L R L'" },
  { id: "TL-4",  family: "l3t", group: "TL", name: "TL 4",  algorithm: "L R' L' R R U' R' U" },
  { id: "TL-5",  family: "l3t", group: "TL", name: "TL 5",  algorithm: "U' R U R' R' L R L'" },

  // LT — last triangles (finishes the puzzle)
  { id: "LT-1",  family: "l3t", group: "LT", name: "LT 1",  algorithm: "r U R' U' R r' U R U' R'" },
  { id: "LT-2",  family: "l3t", group: "LT", name: "LT 2",  algorithm: "U' R U' R' r U R' U' R r' U'" },
  { id: "LT-3",  family: "l3t", group: "LT", name: "LT 3",  algorithm: "U r R' U R U' r' R U R' U" },
];

export const FTO_L3T_GROUPS: readonly FtoL3tGroup[] = ["PF", "TL", "LT"];

export const FTO_L3T_COUNTS = {
  l3t: FTO_L3T_CASES.length,
  all: FTO_L3T_CASES.length,
  PF: FTO_L3T_CASES.filter(row => row.group === "PF").length,
  TL: FTO_L3T_CASES.filter(row => row.group === "TL").length,
  LT: FTO_L3T_CASES.filter(row => row.group === "LT").length,
} as const;
