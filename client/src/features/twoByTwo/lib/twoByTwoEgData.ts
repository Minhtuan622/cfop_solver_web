/**
 * 2×2 EG (Barbara's EG method) — EG-1 and EG-2, 40 algorithms each.
 * Source: https://cubingapp.com/algorithms/2x2-EG1 and
 * https://cubingapp.com/algorithms/2x2-EG2 (extracted from the embedded
 * algSet bundle on 2026-11-17; 7 subsets each: AS 6 · H 4 · L 6 · Pi 6 ·
 * Sune 6 · T 6 · U 6). One canonical algorithm per case — the first variant
 * published on the source page.
 *
 * Case states are NOT embedded: `twoByTwoCaseStateOf()` derives the
 * pre-image from the algorithm (inverse applied to solved), so every case
 * is guaranteed to be solved by its own algorithm.
 */
import type { TwoByTwoCaseRow } from "./twoByTwoCatalogData";

export const EG1_CASES: readonly TwoByTwoCaseRow[] = [
  { id: "EG1-AS-1", family: "eg1", group: "AS", name: "EG1 Antisune 1", algorithm: "U R' F R2 U R' F' U' R U' R'" },
  { id: "EG1-AS-2", family: "eg1", group: "AS", name: "EG1 Antisune 2", algorithm: "U R U' R' F' U' F2 R U' R'" },
  { id: "EG1-AS-3", family: "eg1", group: "AS", name: "EG1 Antisune 3", algorithm: "F' R U R' U' R U R2 F' R" },
  { id: "EG1-AS-4", family: "eg1", group: "AS", name: "EG1 Antisune 4", algorithm: "R U' R' F' U' R U R' U' F" },
  { id: "EG1-AS-5", family: "eg1", group: "AS", name: "EG1 Antisune 5", algorithm: "U' R U R' F' U' R U R' U' R U R'" },
  { id: "EG1-AS-6", family: "eg1", group: "AS", name: "EG1 Antisune 6", algorithm: "U2 R U' R2 F R U' R' F R F'" },
  { id: "EG1-H-1", family: "eg1", group: "H", name: "EG1 H 1", algorithm: "U' R' F R2 U' R' F R U R' F'" },
  { id: "EG1-H-2", family: "eg1", group: "H", name: "EG1 H 2", algorithm: "U' F' U R U' R2 F2 R U' F" },
  { id: "EG1-H-3", family: "eg1", group: "H", name: "EG1 H 3", algorithm: "U R' F R F' U2 F R U2 R' F" },
  { id: "EG1-H-4", family: "eg1", group: "H", name: "EG1 H 4", algorithm: "U' R U R' F' R U R' U' R U R' U'" },
  { id: "EG1-L-1", family: "eg1", group: "L", name: "EG1 L 1", algorithm: "U R U' R' U R U' R2 F' R F" },
  { id: "EG1-L-2", family: "eg1", group: "L", name: "EG1 L 2", algorithm: "U2 R' F R U' R' F R2 U R' F' U2" },
  { id: "EG1-L-3", family: "eg1", group: "L", name: "EG1 L 3", algorithm: "U R' U R2 U' R2 U' F R2 U' R'" },
  { id: "EG1-L-4", family: "eg1", group: "L", name: "EG1 L 4", algorithm: "U R' F R2 U R' F' R U2 R'" },
  { id: "EG1-L-5", family: "eg1", group: "L", name: "EG1 L 5", algorithm: "U2 R U R' F' R U R' U' F R' F' R" },
  { id: "EG1-L-6", family: "eg1", group: "L", name: "EG1 L 6", algorithm: "F R U' R' U R' F' R U R' F' R" },
  { id: "EG1-Pi-1", family: "eg1", group: "Pi", name: "EG1 Pi 1", algorithm: "U F U' R' F R U' F2 R U R'" },
  { id: "EG1-Pi-2", family: "eg1", group: "Pi", name: "EG1 Pi 2", algorithm: "U' R U' R2 F R2 U' R'" },
  { id: "EG1-Pi-3", family: "eg1", group: "Pi", name: "EG1 Pi 3", algorithm: "U' F R' F U' F2 R U R" },
  { id: "EG1-Pi-4", family: "eg1", group: "Pi", name: "EG1 Pi 4", algorithm: "U' R U' R' U R U' R' F R U' R'" },
  { id: "EG1-Pi-5", family: "eg1", group: "Pi", name: "EG1 Pi 5", algorithm: "R U' R2 F R U R U' R' U' R' F R F'" },
  { id: "EG1-Pi-6", family: "eg1", group: "Pi", name: "EG1 Pi 6", algorithm: "U' R' F' R U' R' F R2 U R' F' R U R'" },
  { id: "EG1-Sune-1", family: "eg1", group: "Sune", name: "EG1 Sune 1", algorithm: "U2 R U R' U F R U' R2 F' R" },
  { id: "EG1-Sune-2", family: "eg1", group: "Sune", name: "EG1 Sune 2", algorithm: "R U R' F2 U F R U R'" },
  { id: "EG1-Sune-3", family: "eg1", group: "Sune", name: "EG1 Sune 3", algorithm: "U2 F R' F' R U R' F' R2 U R'" },
  { id: "EG1-Sune-4", family: "eg1", group: "Sune", name: "EG1 Sune 4", algorithm: "U F' R' F R2 U R' U' F R' F' R U" },
  { id: "EG1-Sune-5", family: "eg1", group: "Sune", name: "EG1 Sune 5", algorithm: "U R U' R' U R U' R' U F R U' R'" },
  { id: "EG1-Sune-6", family: "eg1", group: "Sune", name: "EG1 Sune 6", algorithm: "R' F R2 U' R' U R U' R' F" },
  { id: "EG1-T-1", family: "eg1", group: "T", name: "EG1 T 1", algorithm: "F R U' R2 F' R U R' F' R" },
  { id: "EG1-T-2", family: "eg1", group: "T", name: "EG1 T 2", algorithm: "F' R' F R2 U R' U' R U R'" },
  { id: "EG1-T-3", family: "eg1", group: "T", name: "EG1 T 3", algorithm: "U R U' R2 F R U R U2 R'" },
  { id: "EG1-T-4", family: "eg1", group: "T", name: "EG1 T 4", algorithm: "U2 R' U F R2 U' R2 U' F U' R" },
  { id: "EG1-T-5", family: "eg1", group: "T", name: "EG1 T 5", algorithm: "U' R' F' R2 U R' F' R U R'" },
  { id: "EG1-T-6", family: "eg1", group: "T", name: "EG1 T 6", algorithm: "U2 R U' R' U2 F R U2 R' F" },
  { id: "EG1-U-1", family: "eg1", group: "U", name: "EG1 U 1", algorithm: "U' R U R' U R U R2 F R2 U' R'" },
  { id: "EG1-U-2", family: "eg1", group: "U", name: "EG1 U 2", algorithm: "U2 y R' U R' U' R U' R' U' F2 R2" },
  { id: "EG1-U-3", family: "eg1", group: "U", name: "EG1 U 3", algorithm: "F' U2 R U2 R' U2 F" },
  { id: "EG1-U-4", family: "eg1", group: "U", name: "EG1 U 4", algorithm: "U R' F R F' R' F R2 U' R'" },
  { id: "EG1-U-5", family: "eg1", group: "U", name: "EG1 U 5", algorithm: "U2 R U' R' U R U' R' U' F R U' R'" },
  { id: "EG1-U-6", family: "eg1", group: "U", name: "EG1 U 6", algorithm: "U2 R' F R U' R' F R U' R U R' F' U2" },
];

export const EG2_CASES: readonly TwoByTwoCaseRow[] = [
  { id: "EG2-AS-1", family: "eg2", group: "AS", name: "EG2 Antisune 1", algorithm: "F R2 U R' U2 R U R2 U F'" },
  { id: "EG2-AS-2", family: "eg2", group: "AS", name: "EG2 Antisune 2", algorithm: "U2 R' F' R U' R' F2 R' F2 R2" },
  { id: "EG2-AS-3", family: "eg2", group: "AS", name: "EG2 Antisune 3", algorithm: "U2 R' F R F' R U R B2 R2" },
  { id: "EG2-AS-4", family: "eg2", group: "AS", name: "EG2 Antisune 4", algorithm: "U2 F' L F L' U2 L' U2 L' B2 L2" },
  { id: "EG2-AS-5", family: "eg2", group: "AS", name: "EG2 Antisune 5", algorithm: "R' U' R U' R' U' R' F2 R F' R" },
  { id: "EG2-AS-6", family: "eg2", group: "AS", name: "EG2 Antisune 6", algorithm: "U2 R2 F2 R F R F' R U R'" },
  { id: "EG2-H-1", family: "eg2", group: "H", name: "EG2 H 1", algorithm: "R2 F U2 F2 R2 F' R2" },
  { id: "EG2-H-2", family: "eg2", group: "H", name: "EG2 H 2", algorithm: "U R2 B2 U2 R' U2 R2" },
  { id: "EG2-H-3", family: "eg2", group: "H", name: "EG2 H 3", algorithm: "R' U' R U2 R2 F' R U' F R" },
  { id: "EG2-H-4", family: "eg2", group: "H", name: "EG2 H 4", algorithm: "U' R U2 B2 R' U R U' B R'" },
  { id: "EG2-L-1", family: "eg2", group: "L", name: "EG2 L 1", algorithm: "U L2 B2 L U' L' U L F' L F" },
  { id: "EG2-L-2", family: "eg2", group: "L", name: "EG2 L 2", algorithm: "U2 F2 R2 F R U R' U' R' F R" },
  { id: "EG2-L-3", family: "eg2", group: "L", name: "EG2 L 3", algorithm: "U2 R2 U' R U2 R' U2 R U' F2 R2" },
  { id: "EG2-L-4", family: "eg2", group: "L", name: "EG2 L 4", algorithm: "U' R' U L' U2 R' F R U' R' U' F' x2" },
  { id: "EG2-L-5", family: "eg2", group: "L", name: "EG2 L 5", algorithm: "U F R' F' R U R U' R B2 R2" },
  { id: "EG2-L-6", family: "eg2", group: "L", name: "EG2 L 6", algorithm: "U2 F' R U R' U' R' F R' F2 R2" },
  { id: "EG2-Pi-1", family: "eg2", group: "Pi", name: "EG2 Pi 1", algorithm: "F U' R U2 R U' R' U R' F'" },
  { id: "EG2-Pi-2", family: "eg2", group: "Pi", name: "EG2 Pi 2", algorithm: "R U2 R2 U R' F2 R2 F'" },
  { id: "EG2-Pi-3", family: "eg2", group: "Pi", name: "EG2 Pi 3", algorithm: "U F R2 U' R2 U R2 U R2 F R2 F2 U2" },
  { id: "EG2-Pi-4", family: "eg2", group: "Pi", name: "EG2 Pi 4", algorithm: "U2 R' F R F' R U' R' U' R U' R F2 R2" },
  { id: "EG2-Pi-5", family: "eg2", group: "Pi", name: "EG2 Pi 5", algorithm: "U' R' F' R' F2 R2 U R' U2 R U" },
  { id: "EG2-Pi-6", family: "eg2", group: "Pi", name: "EG2 Pi 6", algorithm: "U R' U2 R U' R2 F2 R F R U'" },
  { id: "EG2-Sune-1", family: "eg2", group: "Sune", name: "EG2 S 1", algorithm: "U' F U' R2 U' R' U2 R U' R2 F' U'" },
  { id: "EG2-Sune-2", family: "eg2", group: "Sune", name: "EG2 S 2", algorithm: "U' R2 F2 R U2 R U R' U R" },
  { id: "EG2-Sune-3", family: "eg2", group: "Sune", name: "EG2 S 3", algorithm: "R U' R' F R' F' R' F2 R2" },
  { id: "EG2-Sune-4", family: "eg2", group: "Sune", name: "EG2 S 4", algorithm: "F R' F' R U2 R U2 R B2 R2" },
  { id: "EG2-Sune-5", family: "eg2", group: "Sune", name: "EG2 S 5", algorithm: "R' U R' F R2 U' F R' F'" },
  { id: "EG2-Sune-6", family: "eg2", group: "Sune", name: "EG2 S 6", algorithm: "R2 B2 R' U' R' F R' F' R" },
  { id: "EG2-T-1", family: "eg2", group: "T", name: "EG2 T 1", algorithm: "U R' F' R U R U' R' F' R2 B2 U" },
  { id: "EG2-T-2", family: "eg2", group: "T", name: "EG2 T 2", algorithm: "U F R' U2 R' U' R U2 F'" },
  { id: "EG2-T-3", family: "eg2", group: "T", name: "EG2 T 3", algorithm: "R' U R U2 R2 F' R U' R" },
  { id: "EG2-T-4", family: "eg2", group: "T", name: "EG2 T 4", algorithm: "R2 F2 R U' F R' F' R U R" },
  { id: "EG2-T-5", family: "eg2", group: "T", name: "EG2 T 5", algorithm: "U' R' U2 R U' R' F R' F R F' R" },
  { id: "EG2-T-6", family: "eg2", group: "T", name: "EG2 T 6", algorithm: "U R' U2 R' F2 R F2 R" },
  { id: "EG2-U-1", family: "eg2", group: "U", name: "EG2 U 1", algorithm: "R2 U2 R U R' U F' R U' R" },
  { id: "EG2-U-2", family: "eg2", group: "U", name: "EG2 U 2", algorithm: "U' F R U R' U' F R2 B2" },
  { id: "EG2-U-3", family: "eg2", group: "U", name: "EG2 U 3", algorithm: "R' F' U' R U2 R' U F R" },
  { id: "EG2-U-4", family: "eg2", group: "U", name: "EG2 U 4", algorithm: "R' F' U' F U2 L' U2 R U' L" },
  { id: "EG2-U-5", family: "eg2", group: "U", name: "EG2 U 5", algorithm: "U2 R2 B2 R' U R' U' R' F R F'" },
  { id: "EG2-U-6", family: "eg2", group: "U", name: "EG2 U 6", algorithm: "U2 R2 F2 R F' R U L F' L' F" },
];
