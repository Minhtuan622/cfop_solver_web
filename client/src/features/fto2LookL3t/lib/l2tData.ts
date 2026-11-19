/**
 * FTO 2-Look L3T catalog for the FTO 2-Look L3T study lane.
 *
 * This is the second finish in the Bencisco method for the FTO
 * (Face-Turning Octahedron): after solving up to the last three triples,
 * PF forms the three pairs and TCP (Triangle Combination and Permutation)
 * finishes the puzzle — PF once, TCP once: two looks.
 *
 * All algorithms are taken verbatim from HCubist's 2-Look L3T sheet
 * (hcubist.com/learn/algorithms/fto-2-look-l3t, accessed 2026-11-19),
 * 44 cases in practice order (PF first, then TCP A, TCP B, TCP C):
 *   PF     — pair formation, 9 cases (shared with 3-Look L3T)
 *   TCP A  — 12 cases, TCP B — 12 cases, TCP C — 11 cases
 * Numbered "(2)" entries are the inverse-hold algorithms published as
 * separate cases in the sheet's TCP table.
 *
 * The displayed algorithm is the sheet's exact notation, unchanged:
 *   {A,B}  — puzzle rotation: the face named first comes to the top, the
 *            face named second to the front (moves are read in the hold
 *            in effect at that point)
 *   S / S' — sledge R' L R L' / inverse L R' L' R
 *   H / H' — hedge R U' R' U / inverse U' R U R'
 * Never strip the `{…}` turns: the moves after them are defined in the
 * rotated frame, so dropping them would misteach the case (e.g. TCP-C6).
 * The trainer opens in the sheet's hold (yellow on U, edge in front).
 * There is deliberately NO machine-side expansion of these algorithms
 * anywhere in the lane: discarding the rotations would produce a
 * sequence that is not equivalent to the published one, and must never
 * be executed as a move sequence.
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
  { id: "PF-1",  family: "l3t2", group: "PF", name: "PF 1",  algorithm: "{L,U} S F" },
  { id: "PF-2",  family: "l3t2", group: "PF", name: "PF 2",  algorithm: "{L,U} S' F' R U' R' U F" },
  { id: "PF-3",  family: "l3t2", group: "PF", name: "PF 3",  algorithm: "{L,U} S' F' S' F" },
  { id: "PF-4",  family: "l3t2", group: "PF", name: "PF 4",  algorithm: "{L,U} S' F' S' F'" },
  { id: "PF-5",  family: "l3t2", group: "PF", name: "PF 5",  algorithm: "{L,U} S F'" },
  { id: "PF-6",  family: "l3t2", group: "PF", name: "PF 6",  algorithm: "{L,U} S' F" },
  { id: "PF-8",  family: "l3t2", group: "PF", name: "PF 8",  algorithm: "{L,U} S' F'" },
  { id: "PF-9",  family: "l3t2", group: "PF", name: "PF 9",  algorithm: "{L,U} S' F' U' R U R' F'" },
  { id: "PF-10", family: "l3t2", group: "PF", name: "PF 10", algorithm: "{L,U} S' F' S' F' R U' R' U F" },

  // TCP A — triangle combination and permutation, family A
  { id: "TCP-A1",   family: "l3t2", group: "TCP A", name: "TCP A1",   algorithm: "{L,U} R U' R' U" },
  { id: "TCP-A1-2", family: "l3t2", group: "TCP A", name: "TCP A1 (2)", algorithm: "{L,U} U' R U R'" },
  { id: "TCP-A2",   family: "l3t2", group: "TCP A", name: "TCP A2",   algorithm: "{L,U} {U,BL} R' U R' D' R U' R' D R U R U' {U,BR}" },
  { id: "TCP-A2-2", family: "l3t2", group: "TCP A", name: "TCP A2 (2)", algorithm: "{L,U} {U,BL} U R' U' R' D' R U R' D R U' R {U,BR}" },
  { id: "TCP-A3",   family: "l3t2", group: "TCP A", name: "TCP A3",   algorithm: "{L,U} {L,F} R' D' R U' R' D' R' U R D' R {R,F}" },
  { id: "TCP-A3-2", family: "l3t2", group: "TCP A", name: "TCP A3 (2)", algorithm: "{L,U} {L,F} R' D R' U' R D R U R' D R {R,F}" },
  { id: "TCP-A4",   family: "l3t2", group: "TCP A", name: "TCP A4",   algorithm: "{L,U} {L,D} R' U R U' {B,BL} D' R U R' D U' {B,D}" },
  { id: "TCP-A4-2", family: "l3t2", group: "TCP A", name: "TCP A4 (2)", algorithm: "{L,U} {B,D} U D' R U' R' D {R,D} U R' U' R {B,BR}" },
  { id: "TCP-A5",   family: "l3t2", group: "TCP A", name: "TCP A5",   algorithm: "{L,U} {B,D} R' U R2 r' U' R' U r U' {B,D}" },
  { id: "TCP-A5-2", family: "l3t2", group: "TCP A", name: "TCP A5 (2)", algorithm: "{L,U} {B,D} U r' U' R U r R2' U' R {B,D}" },
  { id: "TCP-A6",   family: "l3t2", group: "TCP A", name: "TCP A6",   algorithm: "{L,U} {B,D} U' r' R U' R' U R' r U R {B,D}" },
  { id: "TCP-A6-2", family: "l3t2", group: "TCP A", name: "TCP A6 (2)", algorithm: "{L,U} {B,D} R' U' r' R U' R U R' r U {B,D}" },

  // TCP B — triangle combination and permutation, family B
  { id: "TCP-B1",   family: "l3t2", group: "TCP B", name: "TCP B1",   algorithm: "{L,U} {L,F} U' R U R' {R,F}" },
  { id: "TCP-B1-2", family: "l3t2", group: "TCP B", name: "TCP B1 (2)", algorithm: "{L,U} {L,F} R U' R' U {R,F}" },
  { id: "TCP-B2",   family: "l3t2", group: "TCP B", name: "TCP B2",   algorithm: "{L,U} R U' R D R' U R D' R' U' R' U" },
  { id: "TCP-B2-2", family: "l3t2", group: "TCP B", name: "TCP B2 (2)", algorithm: "{L,U} U' R U R D R' U' R D' R' U R'" },
  { id: "TCP-B3",   family: "l3t2", group: "TCP B", name: "TCP B3",   algorithm: "{L,U} R' D R' U' R D R U R' D R F" },
  { id: "TCP-B3-2", family: "l3t2", group: "TCP B", name: "TCP B3 (2)", algorithm: "{L,U} F' R' D' R U' R' D' R' U R D' R" },
  { id: "TCP-B4",   family: "l3t2", group: "TCP B", name: "TCP B4",   algorithm: "{L,U} {B,D} U R' U' R {B,BR} D R' U' R D' U {R,F}" },
  { id: "TCP-B4-2", family: "l3t2", group: "TCP B", name: "TCP B4 (2)", algorithm: "{L,U} {L,F} U' D R' U R D' {L,D} R' U R U' {B,D}" },
  { id: "TCP-B5",   family: "l3t2", group: "TCP B", name: "TCP B5",   algorithm: "{L,U} {L,F} R U' R r U R U' r' U {R,F}" },
  { id: "TCP-B5-2", family: "l3t2", group: "TCP B", name: "TCP B5 (2)", algorithm: "{L,U} {L,F} U' r U R' U' r2 R' U R' {R,F}" },
  { id: "TCP-B6",   family: "l3t2", group: "TCP B", name: "TCP B6",   algorithm: "{L,U} {L,F} U r R' U R U' r' R U' R' {R,F}" },
  { id: "TCP-B6-2", family: "l3t2", group: "TCP B", name: "TCP B6 (2)", algorithm: "{L,U} {L,F} R U R' r U R' U' R r' U' {R,F}" },

  // TCP C — triangle combination and permutation, family C
  { id: "TCP-C1",   family: "l3t2", group: "TCP C", name: "TCP C1",   algorithm: "{L,U} R' D R' U' R D' R U" },
  { id: "TCP-C1-2", family: "l3t2", group: "TCP C", name: "TCP C1 (2)", algorithm: "{L,U} U' R' D R' U R D' R" },
  { id: "TCP-C2",   family: "l3t2", group: "TCP C", name: "TCP C2",   algorithm: "{L,U} {U,BL} R D' R U R' D R' U' {U,BR}" },
  { id: "TCP-C2-2", family: "l3t2", group: "TCP C", name: "TCP C2 (2)", algorithm: "{L,U} {U,BL} U R D' R U' R' D R' {U,BR}" },
  { id: "TCP-C3",   family: "l3t2", group: "TCP C", name: "TCP C3",   algorithm: "{L,U} {R,F} R' L R2 BR R' L' R BR' R' F' {L,F}" },
  { id: "TCP-C3-2", family: "l3t2", group: "TCP C", name: "TCP C3 (2)", algorithm: "{L,U} {R,F} F R BR R' L R BR' R2' L' R {L,F}" },
  { id: "TCP-C4",   family: "l3t2", group: "TCP C", name: "TCP C4",   algorithm: "{L,U} R U' R D' R U R' D R F" },
  { id: "TCP-C4-2", family: "l3t2", group: "TCP C", name: "TCP C4 (2)", algorithm: "{L,U} F' R' D' R U' R' D R2 U R'" },
  { id: "TCP-C5",   family: "l3t2", group: "TCP C", name: "TCP C5",   algorithm: "{L,U} {U,BR} R' U R D' R U R' D R' U R {U,BL}" },
  { id: "TCP-C5-2", family: "l3t2", group: "TCP C", name: "TCP C5 (2)", algorithm: "{L,U} {U,BR} R' U' R D' R U' R' D R' U' R {U,BL}" },
  { id: "TCP-C6",   family: "l3t2", group: "TCP C", name: "TCP C6",   algorithm: "{L,U} {L,D} U R' U' R {B,BR} U' R U R'" },
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
