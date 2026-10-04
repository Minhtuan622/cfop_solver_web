import type { PracticeCase } from "../types";

export const PLL_EDGES_ONLY_CASES: PracticeCase[] = [
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
  }
];
