import type { PracticeCase } from "../types";

export const OLL_KNIGHT_MOVE_SHAPE_CASES: PracticeCase[] = [
  {
    "id": "13",
    "group": "Knight Move Shape",
    "algorithm": "F U R U' R2 F' R U R U' R'",
    "setup": "R U R' U' R' F R2 U R' U' F'",
    "kind": "OLL"
  },
  {
    "id": "14",
    "group": "Knight Move Shape",
    "algorithm": "R' F R U R' F' R F U' F'",
    "setup": "F U F' R' F R U' R' F' R",
    "kind": "OLL"
  },
  {
    "id": "15",
    "group": "Knight Move Shape",
    "algorithm": "l' U' l L' U' L U l' U l",
    "setup": "l' U' l U' L' U L l' U l",
    "kind": "OLL"
  },
  {
    "id": "16",
    "group": "Knight Move Shape",
    "algorithm": "r U r' R U R' U' r U' r'",
    "setup": "r U r' U R U' R' r U' r'",
    "kind": "OLL"
  }
];
