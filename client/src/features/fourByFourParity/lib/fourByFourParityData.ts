/**
 * 4×4 PLL parity catalog for the 4×4 Parity study lane.
 *
 * Source: https://cubingapp.com/algorithms/4x4-PLL-Parity (extracted
 * 2026-11-17, one canonical algorithm per case — the first variant
 * published on the page). 22 algorithms, one family:
 * "pll-parity" (a single group — PLL).
 *
 * The published algorithms use M-slice notation ("M2", "M'"), which cubing.js
 * does not accept on even cubes; the display keeps the published form and the
 * playback path converts M → "l r'" (see fourByFourParityAlg.ts).
 */
export type FourByFourParityFamily = "pll-parity";

export type FourByFourParityCaseRow = {
  id: string;
  family: FourByFourParityFamily;
  group: string;
  name: string;
  algorithm: string;
};

/** The 22 4×4 PLL parity algorithms. */
export const PLL_PARITY_CASES_SOURCE: readonly FourByFourParityCaseRow[] = [
  { id: "OPP-Parity", family: "pll-parity", group: "PLL", name: "OPP Parity", algorithm: "2R2 U2 2R2 Uw2 2R2 Uw2" },
  { id: "Adj-Parity", family: "pll-parity", group: "PLL", name: "Adj Parity", algorithm: "R' U R U' 2R2 U2' 2R2 Uw2' 2R2 Uw2' U' R' U' R" },
  { id: "CwO", family: "pll-parity", group: "PLL", name: "CwO", algorithm: "M2 U M2 U M' U2 M2 U2 M' U 2L2 U2 2L2 Uw2 2L2 Uw2" },
  { id: "CcwO", family: "pll-parity", group: "PLL", name: "CcwO", algorithm: "Uw2 2L2 Uw2 2L2 U2 3Rw' Rw2 R' U2 M2 U2 M' U M2 U M2" },
  { id: "W", family: "pll-parity", group: "PLL", name: "W", algorithm: "R' U R' U' R' U' R' U R U Rw2 U2 2R2 Uw2 2R2 Uw2" },
  { id: "Pj", family: "pll-parity", group: "PLL", name: "Pj", algorithm: "R U R' U' R' F R2 U' R' U' R U R' F' U' 2L2 U2 2L2 Uw2 2L2 Uw2" },
  { id: "Ba", family: "pll-parity", group: "PLL", name: "Ba", algorithm: "x' Rw2 U2 Rw2 Uw2 2R2 Uw2 F 3Rw U' R U2 L' U R'" },
  { id: "Bb", family: "pll-parity", group: "PLL", name: "Bb", algorithm: "U x Rw2 U2 Rw2 Uw2 2R2 Uw2 B 3Rw' U R' U2 L U' R" },
  { id: "Ca", family: "pll-parity", group: "PLL", name: "Ca", algorithm: "U2 Uw2 2R2 Uw2 2R2 U2 Rw2 F R U R U' R' F' R U2 R' U2 R" },
  { id: "Cb", family: "pll-parity", group: "PLL", name: "Cb", algorithm: "U R' U2 R U2 R' F R U R' U' R' F' Rw2 U2 2R2 Uw2 2R2 Uw2" },
  { id: "Da", family: "pll-parity", group: "PLL", name: "Da", algorithm: "R' U L' U2 R U' 3Rw B Rw2 U2 Rw2 Uw2 2R2 Uw2 x'" },
  { id: "Db", family: "pll-parity", group: "PLL", name: "Db", algorithm: "R U R' F' R U R' U' R' F R2 U' R' u2 2R2 u2 2R2 U2 2R2" },
  { id: "Ka", family: "pll-parity", group: "PLL", name: "Ka", algorithm: "U 3Lw' U R' D2 R U' R' D2 x' Rw2 U2 2R2 Uw2 2R2 Uw2" },
  { id: "Kb", family: "pll-parity", group: "PLL", name: "Kb", algorithm: "U' 3Rw U' L D2 L' U L D2 x' Lw2 U2 2L2 Uw2 2L2 Uw2" },
  { id: "M", family: "pll-parity", group: "PLL", name: "M", algorithm: "U2 Rw2 F2 U2 2R2 U R' U' R U R' D R D' R F2 U Rw2" },
  { id: "Pa", family: "pll-parity", group: "PLL", name: "Pa", algorithm: "R U R' F' R U R' U' R' F R2 U' R' U' 2R2 U2 2R2 u2 2R2 u2" },
  { id: "Pb", family: "pll-parity", group: "PLL", name: "Pb", algorithm: "2R2 U2 2R2 u2 2R2 u2 R U R' F' R U R' U' R' F R2 U' R'" },
  { id: "Diag-C", family: "pll-parity", group: "PLL", name: "Diag C", algorithm: "F R U' R' U' R U R' F' U' 2R2 U2 2R2 u2 2R2 u2 U' R U R' U' R' F R F'" },
  { id: "Q", family: "pll-parity", group: "PLL", name: "Q", algorithm: "z Rw2 Uw2' R2' Uw2' F R U R' U' R U R' U' R U R' U' F' U2' R2 Uw2' Rw2' z'" },
  { id: "Sa", family: "pll-parity", group: "PLL", name: "Sa", algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F' U' 2R2 U2 2R2 u2 2R2 u2" },
  { id: "Sb", family: "pll-parity", group: "PLL", name: "Sb", algorithm: "F R U' R' U' R U R' F' R U R' U' R' F R F' 2R2 U2 2R2 u2 2R2 u2" },
  { id: "X", family: "pll-parity", group: "PLL", name: "X", algorithm: "Rw2 F2 U2 Rw2 F' U' R' U R U' R' U R U' R' U R F R2 U2 F2 Rw2" },
];

export const FOUR_BY_FOUR_PARITY_CATALOG: readonly FourByFourParityCaseRow[] = PLL_PARITY_CASES_SOURCE;
export const PARITY_FAMILIES = ["pll-parity"] as const;
export const FOUR_BY_FOUR_PARITY_COUNTS = {
  "pll-parity": PLL_PARITY_CASES_SOURCE.length,
  all: PLL_PARITY_CASES_SOURCE.length,
}
