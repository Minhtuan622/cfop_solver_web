import type { PracticeCase } from "../types";

export const OLL_AWKWARD_SHAPE_CASES: PracticeCase[] = [
  {
    "id": "29",
    "group": "Awkward Shape",
    "algorithm": "R U R' U' R U' R' F' U' F R U R'",
    "setup": "R U' R' F' U F R U R' U R U' R'",
    "kind": "OLL"
  },
  {
    "id": "30",
    "group": "Awkward Shape",
    "algorithm": "F R' F R2 U' R' U' R U R' F2",
    "setup": "F2 R U' R' U R U R2 F' R F'",
    "kind": "OLL"
  },
  {
    "id": "41",
    "group": "Awkward Shape",
    "algorithm": "R U R' U R U2 R' F R U R' U' F'",
    "setup": "F U R U' R' F' R U2 R' U' R U' R'",
    "kind": "OLL"
  },
  {
    "id": "42",
    "group": "Awkward Shape",
    "algorithm": "R' U' R U' R' U2 R F R U R' U' F'",
    "setup": "F U R U' R' F' R' U2 R U R' U R",
    "kind": "OLL"
  }
];
