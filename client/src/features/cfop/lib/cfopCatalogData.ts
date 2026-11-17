/**
 * CFOP 3×3 algorithm catalog for the /study CFOP lane.
 *
 * Contents: 41 F2L cases (FR slot), 57 OLL cases, 21 PLL cases — the standard
 * speedsolving set, written in the conventional Singmaster notation used by
 * common sheets (J Perm / speedcubing wiki style). Where several accepted
 * variants exist, one common variant is included; a few algs that use D or
 * wide moves are kept as-is (fastCube supports them).
 *
 * Case states are NOT embedded: `cfopCaseState` computes the pre-image with
 * `applyFastMoves(SOLVED_FAST_STATE, invertAlgorithm(algorithm))`, so every
 * shown case is guaranteed to be solved by its own algorithm (this is pinned
 * by a unit test that applies the alg to the derived state and expects the
 * solved cube back, plus cubeValidation for every derived state).
 */

export type CfopFamily = "f2l" | "oll" | "pll";

export type CfopCaseRow = {
  id: string;
  family: CfopFamily;
  /** FR = the F2L pair slot this catalog demonstrates; "oll"/"pll" for the rest. */
  group: string;
  name: string;
  algorithm: string;
};

export const F2L_CASES: readonly CfopCaseRow[] = [
  { id: "F2L-01", family: "f2l", group: "FR", name: "Pair ready (U R U' R')", algorithm: "U R U' R'" },
  { id: "F2L-02", family: "f2l", group: "FR", name: "Pair ready (R U' R' U)", algorithm: "R U' R' U" },
  { id: "F2L-03", family: "f2l", group: "FR", name: "Corner twist in U", algorithm: "R U2 R' U R U' R'" },
  { id: "F2L-04", family: "f2l", group: "FR", name: "Flat case (corner down)", algorithm: "R' F R F' U' R U' R'" },
  { id: "F2L-05", family: "f2l", group: "FR", name: "Edge in slot, corner on U", algorithm: "F' U F U' F' U' F" },
  { id: "F2L-06", family: "f2l", group: "FR", name: "Edge in slot, corner on U (2)", algorithm: "R U R' U2 R U R'" },
  { id: "F2L-07", family: "f2l", group: "FR", name: "Corner twisted down (U2)", algorithm: "R' U' R U' R' U2 R" },
  { id: "F2L-08", family: "f2l", group: "FR", name: "Edge flip in slot", algorithm: "U R' U' R U R' U'" },
  { id: "F2L-09", family: "f2l", group: "FR", name: "Insert from F", algorithm: "F U' R U R' U' F'" },
  { id: "F2L-10", family: "f2l", group: "FR", name: "Insert from F (mirror)", algorithm: "F' U R U' R' U F" },
  { id: "F2L-11", family: "f2l", group: "FR", name: "F2L 11", algorithm: "U F R U R' U' F'" },
  { id: "F2L-12", family: "f2l", group: "FR", name: "Partner crack", algorithm: "F' U2 F U2 R U' R'" },
  { id: "F2L-13", family: "f2l", group: "FR", name: "Front insert (F U R)", algorithm: "F U R U' R' F'" },
  { id: "F2L-14", family: "f2l", group: "FR", name: "Edge on U", algorithm: "U' R U R' U2 F R F'" },
  { id: "F2L-15", family: "f2l", group: "FR", name: "Edge on U (mirror r)", algorithm: "r' U2 R U2 R' U r" },
  { id: "F2L-16", family: "f2l", group: "FR", name: "Corner on U", algorithm: "r U2 R' U2 R U' r'" },
  { id: "F2L-17", family: "f2l", group: "FR", name: "Pair on F (up)", algorithm: "F R U' R' U' R U R' F'" },
  { id: "F2L-18", family: "f2l", group: "FR", name: "Pair on F (mirror)", algorithm: "F' U' R U R' U' R U R' F" },
  { id: "F2L-19", family: "f2l", group: "FR", name: "Corner in wrong slot", algorithm: "R U R' F R' F' U R'" },
  { id: "F2L-20", family: "f2l", group: "FR", name: "Sune-like corner", algorithm: "U' R' U2 R U' R' U' R U' R'" },
  { id: "F2L-21", family: "f2l", group: "FR", name: "Edge oriented, corner twisted (F)", algorithm: "F R U R' U' F'" },
  { id: "F2L-22", family: "f2l", group: "FR", name: "Edge oriented, corner twisted (F')", algorithm: "F' R U' R' U F" },
  { id: "F2L-23", family: "f2l", group: "FR", name: "Pair attached to cross (F)", algorithm: "U' F U' R U R' U2 F'" },
  { id: "F2L-24", family: "f2l", group: "FR", name: "Pair attached to cross (F R U2)", algorithm: "F R U2 R' U' F'" },
  { id: "F2L-25", family: "f2l", group: "FR", name: "Edge in U (F')", algorithm: "F' U R U2 R' U' F" },
  { id: "F2L-26", family: "f2l", group: "FR", name: "Corner twisted down 2", algorithm: "R U2 R' U2 R U R' U'" },
  { id: "F2L-27", family: "f2l", group: "FR", name: "Double trigger", algorithm: "R2 U2 R' U R U2 R'" },
  { id: "F2L-28", family: "f2l", group: "FR", name: "F2L 28", algorithm: "F R2 U2 R' U2 R U2 R2 F'" },
  { id: "F2L-29", family: "f2l", group: "FR", name: "Wide r + M", algorithm: "r' U2 R U' M' U' R2" },
  { id: "F2L-30", family: "f2l", group: "FR", name: "Keyhole insert", algorithm: "r U R' U2 M U2 R' U' R U' R'" },
  { id: "F2L-31", family: "f2l", group: "FR", name: "Wide trigger", algorithm: "r' U' r U R' U2 R" },
  { id: "F2L-32", family: "f2l", group: "FR", name: "FR slot cross pair", algorithm: "F U' R U2 R' U' F'" },
  { id: "F2L-33", family: "f2l", group: "FR", name: "FR slot cross pair (mirror)", algorithm: "F' U' R U2 R' U F" },
  { id: "F2L-34", family: "f2l", group: "FR", name: "Edge under bar (F R U)", algorithm: "F R U' R' U F'" },
  { id: "F2L-35", family: "f2l", group: "FR", name: "Back-and-forth trigger", algorithm: "U R U' R' F R U R' U' F'" },
  { id: "F2L-36", family: "f2l", group: "FR", name: "Wide r trigger (U2)", algorithm: "R U2 F R' F' R U2 R'" },
  { id: "F2L-37", family: "f2l", group: "FR", name: "Edge under (F' U R)", algorithm: "F' U R U' R' F" },
  { id: "F2L-38", family: "f2l", group: "FR", name: "Wide r back-slot", algorithm: "U' F' r U r' U2 R U' R'" },
  { id: "F2L-39", family: "f2l", group: "FR", name: "Back trigger", algorithm: "F R' F' R U2 R U' R'" },
  { id: "F2L-40", family: "f2l", group: "FR", name: "Double sexy move", algorithm: "R U R' U' R U2 R'" },
  { id: "F2L-41", family: "f2l", group: "FR", name: "Slot 41 (wide trigger)", algorithm: "R2 U' R' U' R U R U2 R'" },
];

/**
 * Slot variants of the 41 FR-slot cases, generated by whole-cube conjugation:
 * FL = y' A y, BL = y2 A y2, BR = y A y' (the way speedcubers rotate the cube
 * to get the working slot back to the front). Whole-cube rotations cancel in
 * inverse pairs, so the derived states stay center-fixed legal cubes.
 */
export const F2L_SLOT_VARIANTS = [
  // FR keeps the original ids so existing SRS records (`f2l:F2L-01`) stay valid.
  { slot: "FR", idSuffix: "", nameSuffix: "", wrap: (alg: string) => alg },
  { slot: "FL", idSuffix: "-FL", nameSuffix: " · FL", wrap: (alg: string) => `y' ${alg} y` },
  { slot: "BL", idSuffix: "-BL", nameSuffix: " · BL", wrap: (alg: string) => `y2 ${alg} y2` },
  { slot: "BR", idSuffix: "-BR", nameSuffix: " · BR", wrap: (alg: string) => `y ${alg} y'` },
] as const;

export const F2L_4WAY_CASES: readonly CfopCaseRow[] = F2L_CASES.flatMap(row =>
  F2L_SLOT_VARIANTS.map(({ slot, idSuffix, nameSuffix, wrap }) => ({
    id: `${row.id}${idSuffix}`,
    family: "f2l" as const,
    group: slot,
    name: `${row.name}${nameSuffix}`,
    algorithm: wrap(row.algorithm),
  })),
);

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

/** The full CFOP catalog in practice order: F2L (4 directions) → OLL → PLL. */
export const CFOP_CASES: readonly CfopCaseRow[] = [
  ...F2L_4WAY_CASES,
  ...OLL_CASES,
  ...PLL_CASES,
];
