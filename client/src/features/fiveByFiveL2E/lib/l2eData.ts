export type FiveByFiveL2EFamily = "l2e";

export type FiveByFiveL2ECaseRow = {
  id: string;
  family: FiveByFiveL2EFamily;
  group: string;
  name: string;
  algorithm: string;
};

export const FIVE_BY_FIVE_L2E_CASES: readonly FiveByFiveL2ECaseRow[] = [
  { id: "L2E-1",  family: "l2e", group: "L2E", name: "L2E 1",  algorithm: "Rw' U' R' U R' F R F' Rw" },
  { id: "L2E-2",  family: "l2e", group: "L2E", name: "L2E 2",  algorithm: "Lw U' R' U R' F R F' Lw'" },
  { id: "L2E-3",  family: "l2e", group: "L2E", name: "L2E 3",  algorithm: "x' M' U' R' U R' F R F' M x" },
  { id: "L2E-4",  family: "l2e", group: "L2E", name: "L2E 4",  algorithm: "Rw2 F2 U2 Rw2 U2 F2 Rw2" },
  { id: "L2E-5",  family: "l2e", group: "L2E", name: "L2E 5",  algorithm: "Rw2 B2 Rw' U2 Rw' U2 x' U2 Rw' U2 Rw U2 Rw' U2 Rw2 U2 x" },
  { id: "L2E-6",  family: "l2e", group: "L2E", name: "L2E 6",  algorithm: "Rw' U2 3Rw U2 3Rw' F2 Rw2 U2 Rw U2 Rw' U2 F2 Rw2 F2" },
  { id: "L2E-7",  family: "l2e", group: "L2E", name: "L2E 7",  algorithm: "Lw' U2 Lw' U2 F2 Lw' F2 Rw U2 Rw' U2 Lw2" },
  { id: "L2E-8",  family: "l2e", group: "L2E", name: "L2E 8",  algorithm: "Lw2 F2 U2 Lw' U2 Lw2 F2 Lw' U2 Lw2 U2 F2 Lw' F2" },
  { id: "L2E-9",  family: "l2e", group: "L2E", name: "L2E 9",  algorithm: "Rw2 F2 U2 Rw U2 Rw2 F2 Rw U2 Rw2 U2 F2 Rw" },
  { id: "L2E-10", family: "l2e", group: "L2E", name: "L2E 10", algorithm: "Rw' U2 Rw2 U2 Rw U2 Rw' U2 Rw U2 Rw2 U2 Rw'" },
  { id: "L2E-11", family: "l2e", group: "L2E", name: "L2E 11", algorithm: "Rw U2 Rw2 U2 Rw' U2 Rw U2 Rw' U2 Rw2 U2 Rw" },
  { id: "L2E-12", family: "l2e", group: "L2E", name: "L2E 12", algorithm: "Rw' U2 Rw' U2 B2 Rw' B2 Rw' F2 Lw2 F2 Rw U2 Rw2" },
  { id: "L2E-13", family: "l2e", group: "L2E", name: "L2E 13", algorithm: "F2 Rw D2 Rw' F2 U2 F2 Lw B2 Lw'" },
  { id: "NO-L5",  family: "l2e", group: "L2E", name: "No. L5", algorithm: "Rw2 B2 Rw F2 Rw' B2 Rw F2 Rw" },
  { id: "NO-L6",  family: "l2e", group: "L2E", name: "No. L6", algorithm: "Lw2 B2 Lw' F2 Lw B2 Lw' F2 Lw'" },
];

export const FIVE_BY_FIVE_L2E_COUNTS = {
  l2e: FIVE_BY_FIVE_L2E_CASES.length,
  all: FIVE_BY_FIVE_L2E_CASES.length,
} as const;
