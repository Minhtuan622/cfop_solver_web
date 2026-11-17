/**
 * 3×3 COLL — 40 corner-oriented + corner-permuted Last Layer cases.
 * Source: https://cubingapp.com/algorithms/COLL (extracted 2026-11-17, one
 * canonical algorithm per case — the first variant published on the page).
 * 7 subsets: AS 6 · H 4 · L 6 · Pi 6 · Sune 6 · T 6 · U 6.
 *
 * Case states are NOT embedded: `cfopCaseState()` derives the pre-image from
 * the algorithm (inverse applied to solved), so every case is guaranteed to
 * be solved by its own algorithm.
 */
import type { CfopCaseRow } from "./cfopCatalogData";

export const COLL_CASES: readonly CfopCaseRow[] = [
  { id: "COLL-AS-1", family: "coll", group: "AS", name: "COLL Antisune 1", algorithm: "R' U' R U' R' U2 R" },
  { id: "COLL-AS-2", family: "coll", group: "AS", name: "COLL Antisune 2", algorithm: "U R' U' R U' R' U R' D' R U R' D R2" },
  { id: "COLL-AS-3", family: "coll", group: "AS", name: "COLL Antisune 3", algorithm: "U2 R2 D R' U2 R D' R2 U' R U' R'" },
  { id: "COLL-AS-4", family: "coll", group: "AS", name: "COLL Antisune 4", algorithm: "U2 R' U' R U' R2 D' R U2 R' D R2" },
  { id: "COLL-AS-5", family: "coll", group: "AS", name: "COLL Antisune 5", algorithm: "U2 r' F R F' r U R'" },
  { id: "COLL-AS-6", family: "coll", group: "AS", name: "COLL Antisune 6", algorithm: "R U R' F' R U2 R' U' R U' R' F R U' R'" },
  { id: "COLL-Sune-1", family: "coll", group: "Sune", name: "COLL Sune 1", algorithm: "R U R' U R U2 R'" },
  { id: "COLL-Sune-2", family: "coll", group: "Sune", name: "COLL Sune 2", algorithm: "U2 R U R' U R2 D R' U2 R D' R2" },
  { id: "COLL-Sune-3", family: "coll", group: "Sune", name: "COLL Sune 3", algorithm: "L' R U R' U' L U2 R U2 R'" },
  { id: "COLL-Sune-4", family: "coll", group: "Sune", name: "COLL Sune 4", algorithm: "U' R U R' U R U' R D R' U' R D' R2" },
  { id: "COLL-Sune-5", family: "coll", group: "Sune", name: "COLL Sune 5", algorithm: "R U' L' U R' U' L" },
  { id: "COLL-Sune-6", family: "coll", group: "Sune", name: "COLL Sune 6", algorithm: "U2 R U R' F' R U R' U R U2 R' F R U' R'" },
  { id: "COLL-L-1", family: "coll", group: "L", name: "COLL L 1", algorithm: "U' R U R' U R U' R' U R U' R' U R U2 R'" },
  { id: "COLL-L-2", family: "coll", group: "L", name: "COLL L 2", algorithm: "R' U2 R' D' R U2 R' D R2" },
  { id: "COLL-L-3", family: "coll", group: "L", name: "COLL L 3", algorithm: "U R U2 R D R' U2 R D' R2" },
  { id: "COLL-L-4", family: "coll", group: "L", name: "COLL L 4", algorithm: "U F R' F' r U R U' r'" },
  { id: "COLL-L-5", family: "coll", group: "L", name: "COLL L 5", algorithm: "U2 F' r U R' U' r' F R" },
  { id: "COLL-L-6", family: "coll", group: "L", name: "COLL L 6", algorithm: "U r U2 R2 F R F' R U2 r'" },
  { id: "COLL-U-1", family: "coll", group: "U", name: "COLL U 1", algorithm: "R' U' R U' R' U2 R2 U R' U R U2 R'" },
  { id: "COLL-U-2", family: "coll", group: "U", name: "COLL U 2", algorithm: "R' F R U' R' U' R U R' F' R U R' U' R' F R F' R" },
  { id: "COLL-U-3", family: "coll", group: "U", name: "COLL U 3", algorithm: "U2 R2 D R' U2 R D' R' U2 R'" },
  { id: "COLL-U-4", family: "coll", group: "U", name: "COLL U 4", algorithm: "F R U' R' U R U R' U R U' R' F'" },
  { id: "COLL-U-5", family: "coll", group: "U", name: "COLL U 5", algorithm: "R2 D' R U2 R' D R U2 R" },
  { id: "COLL-U-6", family: "coll", group: "U", name: "COLL U 6", algorithm: "R2 D' R U R' D R U R U' R' U' R" },
  { id: "COLL-T-1", family: "coll", group: "T", name: "COLL T 1", algorithm: "R U2 R' U' R U' R2 U2 R U R' U R" },
  { id: "COLL-T-2", family: "coll", group: "T", name: "COLL T 2", algorithm: "R' U R U2 R' L' U R U' L" },
  { id: "COLL-T-3", family: "coll", group: "T", name: "COLL T 3", algorithm: "U R' F' r U R U' r' F" },
  { id: "COLL-T-4", family: "coll", group: "T", name: "COLL T 4", algorithm: "U2 F R U R' U' R U' R' U' R U R' F'" },
  { id: "COLL-T-5", family: "coll", group: "T", name: "COLL T 5", algorithm: "U' r U R' U' r' F R F'" },
  { id: "COLL-T-6", family: "coll", group: "T", name: "COLL T 6", algorithm: "R' U R2 D r' U2 r D' R2 U' R" },
  { id: "COLL-Pi-1", family: "coll", group: "Pi", name: "COLL Pi 1", algorithm: "R' U2 R2 U R2 U R2 U2 R'" },
  { id: "COLL-Pi-2", family: "coll", group: "Pi", name: "COLL Pi 2", algorithm: "U F U R U' R' U R U' R2 F' R U R U' R'" },
  { id: "COLL-Pi-3", family: "coll", group: "Pi", name: "COLL Pi 3", algorithm: "R' U' F' R U R' U' R' F R2 U2 R' U2 R" },
  { id: "COLL-Pi-4", family: "coll", group: "Pi", name: "COLL Pi 4", algorithm: "R U R' U' R' F R2 U R' U' R U R' U' F'" },
  { id: "COLL-Pi-5", family: "coll", group: "Pi", name: "COLL Pi 5", algorithm: "U' R U R' U F' R U2 R' U2 R' F R" },
  { id: "COLL-Pi-6", family: "coll", group: "Pi", name: "COLL Pi 6", algorithm: "U' r U R' U R' F R F' R U' R' U R U2 r'" },
  { id: "COLL-H-1", family: "coll", group: "H", name: "COLL H 1", algorithm: "R U R' U R U' R' U R U2 R'" },
  { id: "COLL-H-2", family: "coll", group: "H", name: "COLL H 2", algorithm: "F R U' R' U R U2 R' U' R U R' U' F'" },
  { id: "COLL-H-3", family: "coll", group: "H", name: "COLL H 3", algorithm: "R U R' U R U L' U R' U' L" },
  { id: "COLL-H-4", family: "coll", group: "H", name: "COLL H 4", algorithm: "U F R U R' U' R U R' U' R U R' U' F'" },
];
