/**
 * FTO 3-Look L3T catalog for the FTO L3T study lane.
 *
 * The FTO (Face-Turning Octahedron) is solved with the Bencisco method; this
 * is its beginner-friendly finish. All algorithms are taken verbatim from
 * HCubist's 3-Look L3T sheet (hcubist.com/learn/algorithms/fto-3-look-l3t,
 * accessed 2026-11-19), which splits the finish into:
 *   PF  — pair formation (form the three pairs), 9 cases
 *   TL  — solve the top layer, 5 cases
 *   LT  — solve the last triangles, 3 cases
 * 17 cases, shown in practice order PF → TL → LT (no PF 7 — as published).
 *
 * The displayed algorithm is the sheet's exact notation, unchanged:
 *   {A,B}  — puzzle rotation: the face named first comes to the top, the
 *            face named second to the front (moves are read in the hold
 *            in effect at that point)
 *   S / S' — sledge R' L R L' / inverse L R' L' R
 *   H / H' — hedge R U' R' U / inverse U' R U R'
 * Never strip the `{…}` turns: the moves after them are defined in the
 * rotated frame, so dropping them would misteach the case (e.g. LT 1).
 * The trainer opens in the sheet's hold (yellow on U, edge/corner in
 * front, as the sheet specifies).
 *
 * For machine checks the macros/braces are expanded by `l3tAlg.ts`
 * (`expandSheetAlgorithm`): braces dropped, S/H expanded, R2' normalised
 * to R2. The macro-free sequences still apply cleanly through cubing.js's
 * FTO puzzle — verified 2026-11-19.
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
  { id: "PF-1",  family: "l3t", group: "PF", name: "PF 1",  algorithm: "{L,U} S F" },
  { id: "PF-2",  family: "l3t", group: "PF", name: "PF 2",  algorithm: "{L,U} S' F' R U' R' U F" },
  { id: "PF-3",  family: "l3t", group: "PF", name: "PF 3",  algorithm: "{L,U} S' F' S' F" },
  { id: "PF-4",  family: "l3t", group: "PF", name: "PF 4",  algorithm: "{L,U} S' F' S' F'" },
  { id: "PF-5",  family: "l3t", group: "PF", name: "PF 5",  algorithm: "{L,U} S F'" },
  { id: "PF-6",  family: "l3t", group: "PF", name: "PF 6",  algorithm: "{L,U} S' F" },
  { id: "PF-8",  family: "l3t", group: "PF", name: "PF 8",  algorithm: "{L,U} S' F'" },
  { id: "PF-9",  family: "l3t", group: "PF", name: "PF 9",  algorithm: "{L,U} S' F' U' R U R' F'" },
  { id: "PF-10", family: "l3t", group: "PF", name: "PF 10", algorithm: "{L,U} S' F' S' F' R U' R' U F" },

  // TL — top layer (corners of the last three triples)
  { id: "TL-1",  family: "l3t", group: "TL", name: "TL 1",  algorithm: "{L,U} S" },
  { id: "TL-2",  family: "l3t", group: "TL", name: "TL 2",  algorithm: "{L,U} R U' R' U" },
  { id: "TL-3",  family: "l3t", group: "TL", name: "TL 3",  algorithm: "{L,U} R U' R' U S" },
  { id: "TL-4",  family: "l3t", group: "TL", name: "TL 4",  algorithm: "{L,U} S' R U' R' U" },
  { id: "TL-5",  family: "l3t", group: "TL", name: "TL 5",  algorithm: "{L,U} U' R U R' S" },

  // LT — last triangles (finishes the puzzle)
  { id: "LT-1",  family: "l3t", group: "LT", name: "LT 1",  algorithm: "{L,U} {U,BR} r U R' U' R r' U R U' R' {U,BL}" },
  { id: "LT-2",  family: "l3t", group: "LT", name: "LT 2",  algorithm: "{L,U} U' R U' R' r U R' U' R r' U'" },
  { id: "LT-3",  family: "l3t", group: "LT", name: "LT 3",  algorithm: "{L,U} U r R' U R U' r' R U R' U" },
];

export const FTO_L3T_GROUPS: readonly FtoL3tGroup[] = ["PF", "TL", "LT"];

export const FTO_L3T_COUNTS = {
  l3t: FTO_L3T_CASES.length,
  all: FTO_L3T_CASES.length,
  PF: FTO_L3T_CASES.filter(row => row.group === "PF").length,
  TL: FTO_L3T_CASES.filter(row => row.group === "TL").length,
  LT: FTO_L3T_CASES.filter(row => row.group === "LT").length,
} as const;
