/**
 * 2×2 CLL (Corners of the Last Layer) cases — full set, 40 algorithms.
 * Source: https://cubingapp.com/algorithms/2x2-CLL (40 cases in 7 subsets:
 * Antisune 6 · H 4 · L 6 · Pi 6 · Sune 6 · T 6 · U 6).
 *
 * The 2 extra cases commonly called "full CLL" (the two PBL-adjacent cases
 * when the last layer is already oriented) are intentionally excluded — they
 * are the same positions as 3×3 PLL T/Y perms and belong to the 3×3 lane.
 *
 * Case states are NOT embedded: `twoByTwoCaseState()` derives the pre-image
 * from the algorithm (inverse applied to solved), so every case is guaranteed
 * solvable by its own algorithm.
 */
export type TwoByTwoCaseRow = {
  id: string;
  family: "cll" | "pbl";
  group: string;
  name: string;
  algorithm: string;
};

export const CLL_CASES: readonly TwoByTwoCaseRow[] = [  // Antisune
  { id: "CLL-AS-1", family: "cll", group: "AS", name: "CLL Antisune 1", algorithm: "U R U2 R' U' R U' R'" },
  { id: "CLL-AS-2", family: "cll", group: "AS", name: "CLL Antisune 2", algorithm: "R U2 R' F R' F' R U' R U' R'" },
  { id: "CLL-AS-3", family: "cll", group: "AS", name: "CLL Antisune 3", algorithm: "U2 F' L F L' U2 L' U2 L" },
  { id: "CLL-AS-4", family: "cll", group: "AS", name: "CLL Antisune 4", algorithm: "U2 R' F R F' R U R'" },
  { id: "CLL-AS-5", family: "cll", group: "AS", name: "CLL Antisune 5", algorithm: "U2 R U2 R' U2 R' F R F'" },
  { id: "CLL-AS-6", family: "cll", group: "AS", name: "CLL Antisune 6", algorithm: "U2 L' U' L U L F' L' F L' U' L U' L' U2 L" },
  // H
  { id: "CLL-H-1", family: "cll", group: "H", name: "CLL H 1", algorithm: "F R2 U' R2 U' R2 U R2 F'" },
  { id: "CLL-H-2", family: "cll", group: "H", name: "CLL H 2", algorithm: "R U R' U R U R' F R' F' R" },
  { id: "CLL-H-3", family: "cll", group: "H", name: "CLL H 3", algorithm: "U F R U R' U' R U R' U' R U R' U' F'" },
  { id: "CLL-H-4", family: "cll", group: "H", name: "CLL H 4", algorithm: "U R2 U2 R' U2 R2" },
  // L
  { id: "CLL-L-1", family: "cll", group: "L", name: "CLL L 1", algorithm: "U R U2 R' F' R U2 R' U R' F2 R" },
  { id: "CLL-L-2", family: "cll", group: "L", name: "CLL L 2", algorithm: "U2 R U2 R2 F2 R U R' F2 R F'" },
  { id: "CLL-L-3", family: "cll", group: "L", name: "CLL L 3", algorithm: "U2 R' U R' U2 R U' R' U R U' R2" },
  { id: "CLL-L-4", family: "cll", group: "L", name: "CLL L 4", algorithm: "U R U2 R2 F R F' R U2 R'" },
  { id: "CLL-L-5", family: "cll", group: "L", name: "CLL L 5", algorithm: "U F R' F' R U R U' R'" },
  { id: "CLL-L-6", family: "cll", group: "L", name: "CLL L 6", algorithm: "U2 F' R U R' U' R' F R" },
  // Pi
  { id: "CLL-Pi-1", family: "cll", group: "Pi", name: "CLL Pi 1", algorithm: "U F R' F' R U2 R U' R' U R U2 R'" },
  { id: "CLL-Pi-2", family: "cll", group: "Pi", name: "CLL Pi 2", algorithm: "R U2 R' U' R U R' U2 R' F R F'" },
  { id: "CLL-Pi-3", family: "cll", group: "Pi", name: "CLL Pi 3", algorithm: "U F R2 U' R2 U R2 U R2 F'" },
  { id: "CLL-Pi-4", family: "cll", group: "Pi", name: "CLL Pi 4", algorithm: "U2 R' F R F' R U' R' U' R U' R'" },
  { id: "CLL-Pi-5", family: "cll", group: "Pi", name: "CLL Pi 5", algorithm: "U' R' U' R' F R F' R U' R' U2 R" },
  { id: "CLL-Pi-6", family: "cll", group: "Pi", name: "CLL Pi 6", algorithm: "R U' R2 U R2 U R2 U' R" },
  // Sune
  { id: "CLL-Sune-1", family: "cll", group: "Sune", name: "CLL Sune 1", algorithm: "L' U2 L U2 L F' L' F" },
  { id: "CLL-Sune-2", family: "cll", group: "Sune", name: "CLL Sune 2", algorithm: "R U R' U' R' F R F' R U R' U R U2 R'" },
  { id: "CLL-Sune-3", family: "cll", group: "Sune", name: "CLL Sune 3", algorithm: "R U' R' F R' F' R" },
  { id: "CLL-Sune-4", family: "cll", group: "Sune", name: "CLL Sune 4", algorithm: "F R' F' R U2 R U2 R'" },
  { id: "CLL-Sune-5", family: "cll", group: "Sune", name: "CLL Sune 5", algorithm: "U' R' F R2 F' U' R' U' R2 U R'" },
  { id: "CLL-Sune-6", family: "cll", group: "Sune", name: "CLL Sune 6", algorithm: "R U R' U R U2 R'" },
  // T
  { id: "CLL-T-1", family: "cll", group: "T", name: "CLL T 1", algorithm: "U' R U R' U' R' F R F'" },
  { id: "CLL-T-2", family: "cll", group: "T", name: "CLL T 2", algorithm: "U L' U' L U L F' L' F" },
  { id: "CLL-T-3", family: "cll", group: "T", name: "CLL T 3", algorithm: "F U' R U2 R' U' F2 R U R'" },
  { id: "CLL-T-4", family: "cll", group: "T", name: "CLL T 4", algorithm: "R' U R U2 R2 F' R U' R' F2 R2" },
  { id: "CLL-T-5", family: "cll", group: "T", name: "CLL T 5", algorithm: "U2 F R U R' U' R U' R' U' R U R' F'" },
  { id: "CLL-T-6", family: "cll", group: "T", name: "CLL T 6", algorithm: "R' U R U2 R2 F R F' R" },
  // U
  { id: "CLL-U-1", family: "cll", group: "U", name: "CLL U 1", algorithm: "U' F R U R' U' F'" },
  { id: "CLL-U-2", family: "cll", group: "U", name: "CLL U 2", algorithm: "U' R2 F2 R U R' F R2 U2 R' U' R" },
  { id: "CLL-U-3", family: "cll", group: "U", name: "CLL U 3", algorithm: "U2 F R U R' U2 F' R U' R' F" },
  { id: "CLL-U-4", family: "cll", group: "U", name: "CLL U 4", algorithm: "U' F R' F' R U' R U' R' U2 R U' R'" },
  { id: "CLL-U-5", family: "cll", group: "U", name: "CLL U 5", algorithm: "R U' R2 F R F' R U R' U' R U R'" },
  { id: "CLL-U-6", family: "cll", group: "U", name: "CLL U 6", algorithm: "R' U R' F R F' R U2 R' U R" },
];

/**
 * 2×2 PBL (Permutation of the Both/Last Layer) — 6 algorithms in 2 subsets:
 * Adj (adjacent-corner swap) · Diag (diagonal-corner swap).
 * Source: https://cubingapp.com/algorithms/2x2-PBL
 *
 * PBL is the second step of the Ortega 2-look method (solve a face → OLL → PBL).
 * Case states are derived via `twoByTwoCaseState(alg)`; the derived position
 * has all corners oriented and shows the permutation the alg resolves.
 */
export const PBL_CASES: readonly TwoByTwoCaseRow[] = [
  // Adj — hoán đổi 2 góc kề
  { id: "PBL-ADJ-1", family: "pbl", group: "Adj", name: "PBL Adj 1", algorithm: "R U R' F' R U R' U' R' F R2 U' R' U'" },
  { id: "PBL-ADJ-2", family: "pbl", group: "Adj", name: "PBL Adj 2", algorithm: "R2 U' R2 U2 F2 U' R2" },
  { id: "PBL-ADJ-3", family: "pbl", group: "Adj", name: "PBL Adj 3", algorithm: "U2 R' U R' F2 R F' R" },
  // Diag — hoán đổi 2 góc đối
  { id: "PBL-DIAG-1", family: "pbl", group: "Diag", name: "PBL Diag 1", algorithm: "R U' R' U' F2 U' R U R' U F2" },
  { id: "PBL-DIAG-2", family: "pbl", group: "Diag", name: "PBL Diag 2", algorithm: "R2 F2 R2" },
  { id: "PBL-DIAG-3", family: "pbl", group: "Diag", name: "PBL Diag 3", algorithm: "R2 U R2 U' R2 U R2 U' R2" },
];
