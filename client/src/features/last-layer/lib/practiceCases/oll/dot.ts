import type { PracticeCase } from "../types";

export const OLL_DOT_CASES: PracticeCase[] = [
  {
    "id": "1",
    "group": "Dot",
    "algorithm": "R U2 R' R' F R F' U2 R' F R F'",
    "setup": "F R' F' R U2 F R' F' R R U2 R'",
    "kind": "OLL"
  },
  {
    "id": "2",
    "group": "Dot",
    "algorithm": "r U r' U2 r U2 R' U2 R U' r'",
    "setup": "r U R' U2 R U2 r' U2 r U' r'",
    "kind": "OLL"
  },
  {
    "id": "3",
    "group": "Dot",
    "algorithm": "r' R2 U R' U r U2 r' U M'",
    "setup": "M U' r U2 r' U' R U' R2 r",
    "kind": "OLL"
  },
  {
    "id": "4",
    "group": "Dot",
    "algorithm": "M U' r U2 r' U' R U' R' M'",
    "setup": "M R U R' U r U2 r' U M'",
    "kind": "OLL"
  },
  {
    "id": "17",
    "group": "Dot",
    "algorithm": "F R' F' R2 r' U R U' R' U' M'",
    "setup": "M U R U R' U' r R2 F R F'",
    "kind": "OLL"
  },
  {
    "id": "18",
    "group": "Dot",
    "algorithm": "r U R' U R U2 r' r' U' R U' R' U2 r",
    "setup": "r' U2 R U R' U r r U2 R' U' R U' r'",
    "kind": "OLL"
  },
  {
    "id": "19",
    "group": "Dot",
    "algorithm": "r' R U R U R' U' M' R' F R F'",
    "setup": "F R' F' R M U R U' R' U' R' r",
    "kind": "OLL"
  },
  {
    "id": "20",
    "group": "Dot",
    "algorithm": "r U R' U' M2 U R U' R' U' M'",
    "setup": "M U R U R' U' M2 U R U' r'",
    "kind": "OLL"
  }
];
