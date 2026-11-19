/**
 * FTO 2-Look L3T catalog for the FTO 2-Look L3T study lane.
 *
 * This is the second finish in the Bencisco method for the FTO
 * (Face-Turning Octahedron): after solving up to the last three triples,
 * PF forms the three pairs and TCP (Triangle Combination and Permutation)
 * finishes the puzzle — PF once, TCP once: two looks.
 *
 * All algorithms are from HCubist's 2-Look L3T sheet
 * (hcubist.com/learn/algorithms/fto-2-look-l3t, accessed 2026-11-19),
 * 44 cases in practice order (PF first, then TCP A, TCP B, TCP C by family):
 *   PF     — pair formation, 9 cases (shared with 3-Look L3T)
 *   TCP A  — 12 cases, TCP B — 12 cases, TCP C — 11 cases
 * Numbered "(2)" entries are the inverse-hold algorithms published as
 * separate cases in the sheet's TCP table.
 *
 * Notation (the published macros are expanded the same way as the 3-Look
 * L3T lane so the moves are plain face turns):
 *   S  = R' L R L'   S'  = L R' L' R      (sledge / inverse sledge)
 * Whole-puzzle regrips from the sheet ("{L,U}", "{U,BL}"…) are NOT moves —
 * they mark the required hand regrip (hold yellow on U, edge in front as
 * the case requires) and are dropped. FTO turns are 120°; lowercase letters
 * (r) are the FTO wide turns, as on the sheet. "R2'" is printed as "R2"
 * (a double turn is a double turn).
 *
 * Every normalized algorithm parses and applies cleanly through cubing.js's
 * FTO puzzle and none is the identity on the solved puzzle — verified
 * 2026-11-19 (same verification level as the 3-Look L3T lane).
 */
export type Fto2LookL3tFamily = "l3t2";
export type Fto2LookL3tGroup = "PF" | "TCP A" | "TCP B" | "TCP C";

export type Fto2LookL3tCaseRow = {
  id: string;
  family: Fto2LookL3tFamily;
  group: Fto2LookL3tGroup;
  name: string;
  algorithm: string;
};

/** The 44 2-Look L3T cases (practice order: PF, TCP A, TCP B, TCP C). */
export const FTO_2_LOOK_L3T_CASES: readonly Fto2LookL3tCaseRow[] = [
  // PF — pair formation (forms the pairs, ends ready for TCP)
  { id: "PF-1",  family: "l3t2", group: "PF", name: "PF 1",  algorithm: "R' L R L' F" },
  { id: "PF-2",  family: "l3t2", group: "PF", name: "PF 2",  algorithm: "L R' L' R F' R U' R' U F" },
  { id: "PF-3",  family: "l3t2", group: "PF", name: "PF 3",  algorithm: "L R' L' R F' L R' L' R F" },
  { id: "PF-4",  family: "l3t2", group: "PF", name: "PF 4",  algorithm: "L R' L' R F' L R' L' R F'" },
  { id: "PF-5",  family: "l3t2", group: "PF", name: "PF 5",  algorithm: "R' L R L' F'" },
  { id: "PF-6",  family: "l3t2", group: "PF", name: "PF 6",  algorithm: "L R' L' R F" },
  { id: "PF-8",  family: "l3t2", group: "PF", name: "PF 8",  algorithm: "L R' L' R F'" },
  { id: "PF-9",  family: "l3t2", group: "PF", name: "PF 9",  algorithm: "L R' L' R F' U' R U R' F'" },
  { id: "PF-10", family: "l3t2", group: "PF", name: "PF 10", algorithm: "L R' L' R F' L R' L' R F' R U' R' U F" },

  // TCP A — triangle combination and permutation, family A
  { id: "TCP-A1",   family: "l3t2", group: "TCP A", name: "TCP A1",   algorithm: "R U' R' U" },
  { id: "TCP-A1-2", family: "l3t2", group: "TCP A", name: "TCP A1 (2)", algorithm: "U' R U R'" },
  { id: "TCP-A2",   family: "l3t2", group: "TCP A", name: "TCP A2",   algorithm: "R' U R' D' R U' R' D R U R U'" },
  { id: "TCP-A2-2", family: "l3t2", group: "TCP A", name: "TCP A2 (2)", algorithm: "U R' U' R' D' R U R' D R U' R" },
  { id: "TCP-A3",   family: "l3t2", group: "TCP A", name: "TCP A3",   algorithm: "R' D' R U' R' D' R' U R D' R" },
  { id: "TCP-A3-2", family: "l3t2", group: "TCP A", name: "TCP A3 (2)", algorithm: "R' D R' U' R D R U R' D R" },
  { id: "TCP-A4",   family: "l3t2", group: "TCP A", name: "TCP A4",   algorithm: "R' U R U' D' R U R' D U'" },
  { id: "TCP-A4-2", family: "l3t2", group: "TCP A", name: "TCP A4 (2)", algorithm: "U D' R U' R' D U R' U' R" },
  { id: "TCP-A5",   family: "l3t2", group: "TCP A", name: "TCP A5",   algorithm: "R' U R2 r' U' R' U r U'" },
  { id: "TCP-A5-2", family: "l3t2", group: "TCP A", name: "TCP A5 (2)", algorithm: "U r' U' R U r R2 U' R" },
  { id: "TCP-A6",   family: "l3t2", group: "TCP A", name: "TCP A6",   algorithm: "U' r' R U' R' U R' r U R" },
  { id: "TCP-A6-2", family: "l3t2", group: "TCP A", name: "TCP A6 (2)", algorithm: "R' U' r' R U' R U R' r U" },

  // TCP B — triangle combination and permutation, family B
  { id: "TCP-B1",   family: "l3t2", group: "TCP B", name: "TCP B1",   algorithm: "U' R U R'" },
  { id: "TCP-B1-2", family: "l3t2", group: "TCP B", name: "TCP B1 (2)", algorithm: "R U' R' U" },
  { id: "TCP-B2",   family: "l3t2", group: "TCP B", name: "TCP B2",   algorithm: "R U' R D R' U R D' R' U' R' U" },
  { id: "TCP-B2-2", family: "l3t2", group: "TCP B", name: "TCP B2 (2)", algorithm: "U' R U R D R' U' R D' R' U R'" },
  { id: "TCP-B3",   family: "l3t2", group: "TCP B", name: "TCP B3",   algorithm: "R' D R' U' R D R U R' D R F" },
  { id: "TCP-B3-2", family: "l3t2", group: "TCP B", name: "TCP B3 (2)", algorithm: "F' R' D' R U' R' D' R' U R D' R" },
  { id: "TCP-B4",   family: "l3t2", group: "TCP B", name: "TCP B4",   algorithm: "U R' U' R D R' U' R D' U" },
  { id: "TCP-B4-2", family: "l3t2", group: "TCP B", name: "TCP B4 (2)", algorithm: "U' D R' U R D' R' U R U'" },
  { id: "TCP-B5",   family: "l3t2", group: "TCP B", name: "TCP B5",   algorithm: "R U' R r U R U' r' U" },
  { id: "TCP-B5-2", family: "l3t2", group: "TCP B", name: "TCP B5 (2)", algorithm: "U' r U R' U' r2 R' U R'" },
  { id: "TCP-B6",   family: "l3t2", group: "TCP B", name: "TCP B6",   algorithm: "U r R' U R U' r' R U' R'" },
  { id: "TCP-B6-2", family: "l3t2", group: "TCP B", name: "TCP B6 (2)", algorithm: "R U R' r U R' U' R r' U'" },

  // TCP C — triangle combination and permutation, family C
  { id: "TCP-C1",   family: "l3t2", group: "TCP C", name: "TCP C1",   algorithm: "R' D R' U' R D' R U" },
  { id: "TCP-C1-2", family: "l3t2", group: "TCP C", name: "TCP C1 (2)", algorithm: "U' R' D R' U R D' R" },
  { id: "TCP-C2",   family: "l3t2", group: "TCP C", name: "TCP C2",   algorithm: "R D' R U R' D R' U'" },
  { id: "TCP-C2-2", family: "l3t2", group: "TCP C", name: "TCP C2 (2)", algorithm: "U R D' R U' R' D R'" },
  { id: "TCP-C3",   family: "l3t2", group: "TCP C", name: "TCP C3",   algorithm: "R' L R2 BR R' L' R BR' R' F'" },
  { id: "TCP-C3-2", family: "l3t2", group: "TCP C", name: "TCP C3 (2)", algorithm: "F R BR R' L R BR' R2 L' R" },
  { id: "TCP-C4",   family: "l3t2", group: "TCP C", name: "TCP C4",   algorithm: "R U' R D' R U R' D R F" },
  { id: "TCP-C4-2", family: "l3t2", group: "TCP C", name: "TCP C4 (2)", algorithm: "F' R' D' R U' R' D R2 U R'" },
  { id: "TCP-C5",   family: "l3t2", group: "TCP C", name: "TCP C5",   algorithm: "R' U R D' R U R' D R' U R" },
  { id: "TCP-C5-2", family: "l3t2", group: "TCP C", name: "TCP C5 (2)", algorithm: "R' U' R D' R U' R' D R' U' R" },
  { id: "TCP-C6",   family: "l3t2", group: "TCP C", name: "TCP C6",   algorithm: "U R' U' R U' R U R'" },
];

export const FTO_2_LOOK_L3T_GROUPS: readonly Fto2LookL3tGroup[] = ["PF", "TCP A", "TCP B", "TCP C"];

export const FTO_2_LOOK_L3T_COUNTS = {
  l3t2: FTO_2_LOOK_L3T_CASES.length,
  all: FTO_2_LOOK_L3T_CASES.length,
  PF: FTO_2_LOOK_L3T_CASES.filter(row => row.group === "PF").length,
  "TCP A": FTO_2_LOOK_L3T_CASES.filter(row => row.group === "TCP A").length,
  "TCP B": FTO_2_LOOK_L3T_CASES.filter(row => row.group === "TCP B").length,
  "TCP C": FTO_2_LOOK_L3T_CASES.filter(row => row.group === "TCP C").length,
} as const;
