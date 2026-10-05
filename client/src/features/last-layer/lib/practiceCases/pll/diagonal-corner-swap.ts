import type { PracticeCase } from "../types";

export const PLL_DIAGONAL_CORNER_SWAP_CASES: PracticeCase[] = [
  {
    "id": "E",
    "group": "Diagonal Corner Swap",
    "algorithm": "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    "setup": "x' D R U R' D' R U' R' D R U' R' D' R U R' x",
    "kind": "PLL"
  },
  {
    "id": "Y",
    "group": "Diagonal Corner Swap",
    "algorithm": "F R' F R2 U' R' U' R U R' F' R U R' U' F'",
    "setup": "F U R U' R' F R U' R' U R U R2 F' R F'",
    "kind": "PLL"
  },
  {
    "id": "V",
    "group": "Diagonal Corner Swap",
    "algorithm": "R' U R' U' y R' F' R2 U' R' U R' F R F y'",
    "setup": "y F' R' F' R U' R U R2 F R y' U R U' R",
    "kind": "PLL"
  },
  {
    "id": "Na",
    "group": "Diagonal Corner Swap",
    "algorithm": "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
    "setup": "R U R' U2 R U R2 F' R U R U' R' F R U' R' U' R U' R'",
    "kind": "PLL"
  },
  {
    "id": "Nb",
    "group": "Diagonal Corner Swap",
    "algorithm": "R' U R U' R' F' U' F R U R' F R' F' R U' R",
    "setup": "R' U R' F R F' R U' R' F' U F R U R' U' R",
    "kind": "PLL"
  }
];
