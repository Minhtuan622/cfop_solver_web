import type { PracticeCase } from "./types";

export const PLL_CASES: PracticeCase[] = [
{
    "id": "H",
    "group": "Edges Only",
    "algorithm": "M2 U M2 U2 M2 U M2",
    "setup": "M2 U' M2 U2 M2 U' M2",
    "kind": "PLL"
  },
  {
    "id": "Z",
    "group": "Edges Only",
    "algorithm": "M' U M2 U M2 U M' U2 M2",
    "setup": "M2 U2 M U' M2 U' M2 U' M",
    "kind": "PLL"
  },
  {
    "id": "Ua",
    "group": "Edges Only",
    "algorithm": "M2 U M U2 M' U M2",
    "setup": "M2 U' M U2 M' U' M2",
    "kind": "PLL"
  },
  {
    "id": "Ub",
    "group": "Edges Only",
    "algorithm": "M2 U' M U2 M' U' M2",
    "setup": "M2 U M U2 M' U M2",
    "kind": "PLL"
  },
  {
    "id": "Aa",
    "group": "Adjacent Corner Swap",
    "algorithm": "x R' U R' D2 R U' R' D2 R2 x'",
    "setup": "x R2 D2 R U R' D2 R U' R x'",
    "kind": "PLL"
  },
  {
    "id": "Ab",
    "group": "Adjacent Corner Swap",
    "algorithm": "x R2 D2 R U R' D2 R U' R x'",
    "setup": "x R' U R' D2 R U' R' D2 R2 x'",
    "kind": "PLL"
  },
  {
    "id": "E",
    "group": "Diagonal Corner Swap",
    "algorithm": "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
    "setup": "x' D R U R' D' R U' R' D R U' R' D' R U R' x",
    "kind": "PLL"
  },
  {
    "id": "F",
    "group": "Adjacent Corner Swap",
    "algorithm": "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
    "setup": "R' U' R U' R' U R U R2 F' R U R U' R' F U R",
    "kind": "PLL"
  },
  {
    "id": "Ja",
    "group": "Adjacent Corner Swap",
    "algorithm": "x R2 F R F' R U2 r' U r U2 x'",
    "setup": "x U2 r' U' r U2 R' F R' F' R2 x'",
    "kind": "PLL"
  },
  {
    "id": "Jb",
    "group": "Adjacent Corner Swap",
    "algorithm": "R U R' F' R U R' U' R' F R2 U' R'",
    "setup": "R U R2 F' R U R U' R' F R U' R'",
    "kind": "PLL"
  },
  {
    "id": "Ra",
    "group": "Adjacent Corner Swap",
    "algorithm": "R U R' F' R U2 R' U2 R' F R U R U2 R'",
    "setup": "R U2 R' U' R' F' R U2 R U2 R' F R U' R'",
    "kind": "PLL"
  },
  {
    "id": "Rb",
    "group": "Adjacent Corner Swap",
    "algorithm": "R2 F R U R U' R' F' R U2 R' U2 R",
    "setup": "R' U2 R U2 R' F R U R' U' R' F' R2",
    "kind": "PLL"
  },
  {
    "id": "T",
    "group": "Adjacent Corner Swap",
    "algorithm": "R U R' U' R' F R2 U' R' U' R U R' F'",
    "setup": "F R U' R' U R U R2 F' R U R U' R'",
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
  },
  {
    "id": "Ga",
    "group": "Adjacent Corner Swap",
    "algorithm": "R2 U R' U R' U' R U' R2 U' D R' U R D'",
    "setup": "D R' U' R D' U R2 U R' U R U' R U' R2",
    "kind": "PLL"
  },
  {
    "id": "Gb",
    "group": "Adjacent Corner Swap",
    "algorithm": "R' U' R U D' R2 U R' U R U' R U' R2 D",
    "setup": "D' R2 U R' U R' U' R U' R2 D U' R' U R",
    "kind": "PLL"
  },
  {
    "id": "Gc",
    "group": "Adjacent Corner Swap",
    "algorithm": "R2 U' R U' R U R' U R2 U D' R U' R' D",
    "setup": "D' R U R' D U' R2 U' R U' R' U R' U R2",
    "kind": "PLL"
  },
  {
    "id": "Gd",
    "group": "Adjacent Corner Swap",
    "algorithm": "R U R' U' D R2 U' R U' R' U R' U R2 D'",
    "setup": "D R2 U' R U' R U R' U R2 D' U R U' R'",
    "kind": "PLL"
  }
];
