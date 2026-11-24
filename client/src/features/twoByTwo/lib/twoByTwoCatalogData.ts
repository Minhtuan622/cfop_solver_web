export type TwoByTwoCaseRow = {
  id: string;
  family: "cll" | "pbl" | "eg1" | "eg2";
  group: string;
  name: string;
  algorithm: string;
};

export const CLL_CASES: readonly TwoByTwoCaseRow[] = [
  { id: "CLL-AS-1", family: "cll", group: "AS", name: "CLL Antisune 1", algorithm: "U R U2 R' U' R U' R'" },
  { id: "CLL-AS-2", family: "cll", group: "AS", name: "CLL Antisune 2", algorithm: "R U2 R' F R' F' R U' R U' R'" },
  { id: "CLL-AS-3", family: "cll", group: "AS", name: "CLL Antisune 3", algorithm: "U2 F' L F L' U2 L' U2 L" },
  { id: "CLL-AS-4", family: "cll", group: "AS", name: "CLL Antisune 4", algorithm: "U2 R' F R F' R U R'" },
  { id: "CLL-AS-5", family: "cll", group: "AS", name: "CLL Antisune 5", algorithm: "U2 R U2 R' U2 R' F R F'" },
  { id: "CLL-AS-6", family: "cll", group: "AS", name: "CLL Antisune 6", algorithm: "U2 L' U' L U L F' L' F L' U' L U' L' U2 L" },
  { id: "CLL-H-1", family: "cll", group: "H", name: "CLL H 1", algorithm: "F R2 U' R2 U' R2 U R2 F'" },
  { id: "CLL-H-2", family: "cll", group: "H", name: "CLL H 2", algorithm: "R U R' U R U R' F R' F' R" },
  { id: "CLL-H-3", family: "cll", group: "H", name: "CLL H 3", algorithm: "U F R U R' U' R U R' U' R U R' U' F'" },
  { id: "CLL-H-4", family: "cll", group: "H", name: "CLL H 4", algorithm: "U R2 U2 R' U2 R2" },
  { id: "CLL-L-1", family: "cll", group: "L", name: "CLL L 1", algorithm: "U R U2 R' F' R U2 R' U R' F2 R" },
  { id: "CLL-L-2", family: "cll", group: "L", name: "CLL L 2", algorithm: "U2 R U2 R2 F2 R U R' F2 R F'" },
  { id: "CLL-L-3", family: "cll", group: "L", name: "CLL L 3", algorithm: "U2 R' U R' U2 R U' R' U R U' R2" },
  { id: "CLL-L-4", family: "cll", group: "L", name: "CLL L 4", algorithm: "U R U2 R2 F R F' R U2 R'" },
  { id: "CLL-L-5", family: "cll", group: "L", name: "CLL L 5", algorithm: "U F R' F' R U R U' R'" },
  { id: "CLL-L-6", family: "cll", group: "L", name: "CLL L 6", algorithm: "U2 F' R U R' U' R' F R" },
  { id: "CLL-Pi-1", family: "cll", group: "Pi", name: "CLL Pi 1", algorithm: "U F R' F' R U2 R U' R' U R U2 R'" },
  { id: "CLL-Pi-2", family: "cll", group: "Pi", name: "CLL Pi 2", algorithm: "R U2 R' U' R U R' U2 R' F R F'" },
  { id: "CLL-Pi-3", family: "cll", group: "Pi", name: "CLL Pi 3", algorithm: "U F R2 U' R2 U R2 U R2 F'" },
  { id: "CLL-Pi-4", family: "cll", group: "Pi", name: "CLL Pi 4", algorithm: "U2 R' F R F' R U' R' U' R U' R'" },
  { id: "CLL-Pi-5", family: "cll", group: "Pi", name: "CLL Pi 5", algorithm: "U' R' U' R' F R F' R U' R' U2 R" },
  { id: "CLL-Pi-6", family: "cll", group: "Pi", name: "CLL Pi 6", algorithm: "R U' R2 U R2 U R2 U' R" },
  { id: "CLL-Sune-1", family: "cll", group: "Sune", name: "CLL Sune 1", algorithm: "L' U2 L U2 L F' L' F" },
  { id: "CLL-Sune-2", family: "cll", group: "Sune", name: "CLL Sune 2", algorithm: "R U R' U' R' F R F' R U R' U R U2 R'" },
  { id: "CLL-Sune-3", family: "cll", group: "Sune", name: "CLL Sune 3", algorithm: "R U' R' F R' F' R" },
  { id: "CLL-Sune-4", family: "cll", group: "Sune", name: "CLL Sune 4", algorithm: "F R' F' R U2 R U2 R'" },
  { id: "CLL-Sune-5", family: "cll", group: "Sune", name: "CLL Sune 5", algorithm: "U' R' F R2 F' U' R' U' R2 U R'" },
  { id: "CLL-Sune-6", family: "cll", group: "Sune", name: "CLL Sune 6", algorithm: "R U R' U R U2 R'" },
  { id: "CLL-T-1", family: "cll", group: "T", name: "CLL T 1", algorithm: "U' R U R' U' R' F R F'" },
  { id: "CLL-T-2", family: "cll", group: "T", name: "CLL T 2", algorithm: "U L' U' L U L F' L' F" },
  { id: "CLL-T-3", family: "cll", group: "T", name: "CLL T 3", algorithm: "F U' R U2 R' U' F2 R U R'" },
  { id: "CLL-T-4", family: "cll", group: "T", name: "CLL T 4", algorithm: "R' U R U2 R2 F' R U' R' F2 R2" },
  { id: "CLL-T-5", family: "cll", group: "T", name: "CLL T 5", algorithm: "U2 F R U R' U' R U' R' U' R U R' F'" },
  { id: "CLL-T-6", family: "cll", group: "T", name: "CLL T 6", algorithm: "R' U R U2 R2 F R F' R" },
  { id: "CLL-U-1", family: "cll", group: "U", name: "CLL U 1", algorithm: "U' F R U R' U' F'" },
  { id: "CLL-U-2", family: "cll", group: "U", name: "CLL U 2", algorithm: "U' R2 F2 R U R' F R2 U2 R' U' R" },
  { id: "CLL-U-3", family: "cll", group: "U", name: "CLL U 3", algorithm: "U2 F R U R' U2 F' R U' R' F" },
  { id: "CLL-U-4", family: "cll", group: "U", name: "CLL U 4", algorithm: "U' F R' F' R U' R U' R' U2 R U' R'" },
  { id: "CLL-U-5", family: "cll", group: "U", name: "CLL U 5", algorithm: "R U' R2 F R F' R U R' U' R U R'" },
  { id: "CLL-U-6", family: "cll", group: "U", name: "CLL U 6", algorithm: "R' U R' F R F' R U2 R' U R" },
];

export const PBL_CASES: readonly TwoByTwoCaseRow[] = [
  { id: "PBL-ADJ-1", family: "pbl", group: "Adj", name: "PBL Adj 1", algorithm: "R U R' F' R U R' U' R' F R2 U' R' U'" },
  { id: "PBL-ADJ-2", family: "pbl", group: "Adj", name: "PBL Adj 2", algorithm: "R2 U' R2 U2 F2 U' R2" },
  { id: "PBL-ADJ-3", family: "pbl", group: "Adj", name: "PBL Adj 3", algorithm: "U2 R' U R' F2 R F' R" },
  { id: "PBL-DIAG-1", family: "pbl", group: "Diag", name: "PBL Diag 1", algorithm: "R U' R' U' F2 U' R U R' U F2" },
  { id: "PBL-DIAG-2", family: "pbl", group: "Diag", name: "PBL Diag 2", algorithm: "R2 F2 R2" },
  { id: "PBL-DIAG-3", family: "pbl", group: "Diag", name: "PBL Diag 3", algorithm: "R2 U R2 U' R2 U R2 U' R2" },
];
