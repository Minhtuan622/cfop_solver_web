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
 * front, as the sheet specifies). There is deliberately NO machine-side
 * expansion of these algorithms anywhere in the lane: discarding the
 * rotations would produce a sequence that is not equivalent to the
 * published one, and must never be executed as a move sequence.
 */
export type FtoL3tFamily = "l3t";
export type FtoL3tGroup = "PF" | "TL" | "LT";

export type FtoL3tCaseRow = {
  id: string;
  family: FtoL3tFamily;
  group: FtoL3tGroup;
  name: string;
  algorithm: string;
  /** The case's facelet string (HCubist's `st`, face order U F R L B BL BR D). */
  caseState?: string;
};

/** The 17 3-Look L3T cases (practice order: PF, TL, LT). */
export const FTO_L3T_CASES: readonly FtoL3tCaseRow[] = [
  // PF — pair formation (form the pairs, ends ready for TL)
  { id: "PF-1",  family: "l3t", group: "PF", name: "PF 1",  algorithm: "{L,U} S F", caseState: "001005150110111101233222332332344344444243242555550550666666666777777777" },
  { id: "PF-2",  family: "l3t", group: "PF", name: "PF 2",  algorithm: "{L,U} S' F' R U' R' U F", caseState: "506000650110111111322222222334332333444443444555551550066666066777777777" },
  { id: "PF-3",  family: "l3t", group: "PF", name: "PF 3",  algorithm: "{L,U} S' F' S' F", caseState: "000000150116111161424222222332332333344443444555551550566666066777777777" },
  { id: "PF-4",  family: "l3t", group: "PF", name: "PF 4",  algorithm: "{L,U} S' F' S' F'", caseState: "600005100111111151432222332333344344244243242555550556066666066777777777" },
  { id: "PF-5",  family: "l3t", group: "PF", name: "PF 5",  algorithm: "{L,U} S F'", caseState: "000000100115111101343222442334324322244342343555556556166666566777777777" },
  { id: "PF-6",  family: "l3t", group: "PF", name: "PF 6",  algorithm: "{L,U} S' F", caseState: "005006006110111101334222332333342344244244242555550551166666566777777777" },
  { id: "PF-8",  family: "l3t", group: "PF", name: "PF 8",  algorithm: "{L,U} S' F'", caseState: "500001005116111161344222442332323322444342343555550551066666066777777777" },
  { id: "PF-9",  family: "l3t", group: "PF", name: "PF 9",  algorithm: "{L,U} S' F' U' R U R' F'", caseState: "006001615110111101432222332334343344344242242555550550566666066777777777" },
  { id: "PF-10", family: "l3t", group: "PF", name: "PF 10", algorithm: "{L,U} S' F' S' F' R U' R' U F", caseState: "001005006110111101243222442332324322444343343555550551666666566777777777" },

  // TL — top layer (corners of the last three triples)
  { id: "TL-1",  family: "l3t", group: "TL", name: "TL 1",  algorithm: "{L,U} S", caseState: "100006506115111111223222222334332333344444444555550550066666066777777777" },
  { id: "TL-2",  family: "l3t", group: "TL", name: "TL 2",  algorithm: "{L,U} R U' R' U", caseState: "500001105116111161324222222332333333444442444555550550066666066777777777" },
  { id: "TL-3",  family: "l3t", group: "TL", name: "TL 3",  algorithm: "{L,U} R U' R' U S", caseState: "001005051110111101223222222332334333444443444555550550666666666777777777" },
  { id: "TL-4",  family: "l3t", group: "TL", name: "TL 4",  algorithm: "{L,U} S' R U' R' U", caseState: "000000000115111111323222222334334333244442444555556556166666566777777777" },
  { id: "TL-5",  family: "l3t", group: "TL", name: "TL 5",  algorithm: "{L,U} U' R U R' S", caseState: "000000000116111161424222222332332333344443444555551555566666166777777777" },

  // LT — last triangles (finishes the puzzle)
  { id: "LT-1",  family: "l3t", group: "LT", name: "LT 1",  algorithm: "{L,U} {U,BR} r U R' U' R r' U R U' R' {U,BL}", caseState: "000000000111111151222222222333333333444444444555555551666666666777777777" },
  { id: "LT-2",  family: "l3t", group: "LT", name: "LT 2",  algorithm: "{L,U} U' R U' R' r U R' U' R r' U'", caseState: "000000000111111151222222222333333333444444444555555556666666166777777777" },
  { id: "LT-3",  family: "l3t", group: "LT", name: "LT 3",  algorithm: "{L,U} U r R' U R U' r' R U R' U", caseState: "000000000111111161222222222333333333444444444555555551666666566777777777" },
];

export const FTO_L3T_GROUPS: readonly FtoL3tGroup[] = ["PF", "TL", "LT"];

export const FTO_L3T_COUNTS = {
  l3t: FTO_L3T_CASES.length,
  all: FTO_L3T_CASES.length,
  PF: FTO_L3T_CASES.filter(row => row.group === "PF").length,
  TL: FTO_L3T_CASES.filter(row => row.group === "TL").length,
  LT: FTO_L3T_CASES.filter(row => row.group === "LT").length,
} as const;
