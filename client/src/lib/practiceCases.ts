/** Generated from verified full_database.py. setup is the inverse sequence used to make the case. */
export type PracticeCase = { id: string; group: string; algorithm: string; setup: string; kind: "OLL" | "PLL" };
export const OLL_CASES: PracticeCase[] = [
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
    "id": "5",
    "group": "Square Shape",
    "algorithm": "l' U2 L U L' U l",
    "setup": "l' U' L U' L' U2 l",
    "kind": "OLL"
  },
  {
    "id": "6",
    "group": "Square Shape",
    "algorithm": "r U2 R' U' R U' r'",
    "setup": "r U R' U R U2 r'",
    "kind": "OLL"
  },
  {
    "id": "7",
    "group": "Small Lightning Bolt",
    "algorithm": "r U R' U R U2 r'",
    "setup": "r U2 R' U' R U' r'",
    "kind": "OLL"
  },
  {
    "id": "8",
    "group": "Small Lightning Bolt",
    "algorithm": "l' U' L U' L' U2 l",
    "setup": "l' U2 L U L' U l",
    "kind": "OLL"
  },
  {
    "id": "9",
    "group": "Fish Shape",
    "algorithm": "R U R' U' R' F R2 U R' U' F'",
    "setup": "F U R U' R2 F' R U R U' R'",
    "kind": "OLL"
  },
  {
    "id": "10",
    "group": "Fish Shape",
    "algorithm": "R U R' U R' F R F' R U2 R'",
    "setup": "R U2 R' F R' F' R U' R U' R'",
    "kind": "OLL"
  },
  {
    "id": "11",
    "group": "Small Lightning Bolt",
    "algorithm": "r U R' U R' F R F' R U2 r'",
    "setup": "r U2 R' F R' F' R U' R U' r'",
    "kind": "OLL"
  },
  {
    "id": "12",
    "group": "Small Lightning Bolt",
    "algorithm": "M' R' U' R U' R' U2 R U' R r'",
    "setup": "r R' U R' U2 R U R' U R M",
    "kind": "OLL"
  },
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
  },
  {
    "id": "21",
    "group": "Cross",
    "algorithm": "R U2 R' U' R U R' U' R U' R'",
    "setup": "R U R' U R U' R' U R U2 R'",
    "kind": "OLL"
  },
  {
    "id": "22",
    "group": "Cross",
    "algorithm": "R U2 R2 U' R2 U' R2 U2 R",
    "setup": "R' U2 R2 U R2 U R2 U2 R'",
    "kind": "OLL"
  },
  {
    "id": "23",
    "group": "Cross",
    "algorithm": "R2 D' R U2 R' D R U2 R",
    "setup": "R' U2 R' D' R U2 R' D R2",
    "kind": "OLL"
  },
  {
    "id": "24",
    "group": "Cross",
    "algorithm": "r U R' U' r' F R F'",
    "setup": "F R' F' r U R U' r'",
    "kind": "OLL"
  },
  {
    "id": "25",
    "group": "Cross",
    "algorithm": "F' r U R' U' r' F R",
    "setup": "R' F' r U R U' r' F",
    "kind": "OLL"
  },
  {
    "id": "26",
    "group": "Cross",
    "algorithm": "R U2 R' U' R U' R'",
    "setup": "R U R' U R U2 R'",
    "kind": "OLL"
  },
  {
    "id": "27",
    "group": "Cross",
    "algorithm": "R U R' U R U2 R'",
    "setup": "R U2 R' U' R U' R'",
    "kind": "OLL"
  },
  {
    "id": "28",
    "group": "Corners Oriented",
    "algorithm": "r U R' U' r' R U R U' R'",
    "setup": "R U R' U' R' r U R U' r'",
    "kind": "OLL"
  },
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
    "id": "31",
    "group": "P Shape",
    "algorithm": "R' U' F U R U' R' F' R",
    "setup": "R' F R U R' U' F' U R",
    "kind": "OLL"
  },
  {
    "id": "32",
    "group": "P Shape",
    "algorithm": "L U F' U' L' U L F L'",
    "setup": "L F' L' U' L U F U' L'",
    "kind": "OLL"
  },
  {
    "id": "33",
    "group": "T Shape",
    "algorithm": "R U R' U' R' F R F'",
    "setup": "F R' F' R U R U' R'",
    "kind": "OLL"
  },
  {
    "id": "34",
    "group": "C Shape",
    "algorithm": "R U R' U' B' R' F R F' B",
    "setup": "B' F R' F' R B U R U' R'",
    "kind": "OLL"
  },
  {
    "id": "35",
    "group": "Fish Shape",
    "algorithm": "R U2 R' R' F R F' R U2 R'",
    "setup": "R U2 R' F R' F' R R U2 R'",
    "kind": "OLL"
  },
  {
    "id": "36",
    "group": "W Shape",
    "algorithm": "L' U' L U' L' U L U L F' L' F",
    "setup": "F' L F L' U' L' U' L U L' U L",
    "kind": "OLL"
  },
  {
    "id": "37",
    "group": "Fish Shape",
    "algorithm": "F R' F' R U R U' R'",
    "setup": "R U R' U' R' F R F'",
    "kind": "OLL"
  },
  {
    "id": "38",
    "group": "W Shape",
    "algorithm": "R U R' U R U' R' U' R' F R F'",
    "setup": "F R' F' R U R U R' U' R U' R'",
    "kind": "OLL"
  },
  {
    "id": "39",
    "group": "Big Lightning Bolt",
    "algorithm": "L F' L' U' L U F U' L'",
    "setup": "L U F' U' L' U L F L'",
    "kind": "OLL"
  },
  {
    "id": "40",
    "group": "Big Lightning Bolt",
    "algorithm": "R' F R U R' U' F' U R",
    "setup": "R' U' F U R U' R' F' R",
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
  },
  {
    "id": "43",
    "group": "P Shape",
    "algorithm": "F' U' L' U L F",
    "setup": "F' L' U' L U F",
    "kind": "OLL"
  },
  {
    "id": "44",
    "group": "P Shape",
    "algorithm": "F U R U' R' F'",
    "setup": "F R U R' U' F'",
    "kind": "OLL"
  },
  {
    "id": "45",
    "group": "T Shape",
    "algorithm": "F R U R' U' F'",
    "setup": "F U R U' R' F'",
    "kind": "OLL"
  },
  {
    "id": "46",
    "group": "C Shape",
    "algorithm": "R' U' R' F R F' U R",
    "setup": "R' U' F R' F' R U R",
    "kind": "OLL"
  },
  {
    "id": "47",
    "group": "Small L Shape",
    "algorithm": "F' L' U' L U L' U' L U F",
    "setup": "F' U' L' U L U' L' U L F",
    "kind": "OLL"
  },
  {
    "id": "48",
    "group": "Small L Shape",
    "algorithm": "F R U R' U' R U R' U' F'",
    "setup": "F U R U' R' U R U' R' F'",
    "kind": "OLL"
  },
  {
    "id": "49",
    "group": "Small L Shape",
    "algorithm": "r U' r2 U r2 U r2 U' r",
    "setup": "r' U r2 U' r2 U' r2 U r'",
    "kind": "OLL"
  },
  {
    "id": "50",
    "group": "Small L Shape",
    "algorithm": "r' U r2 U' r2 U' r2 U r'",
    "setup": "r U' r2 U r2 U r2 U' r",
    "kind": "OLL"
  },
  {
    "id": "51",
    "group": "I Shape",
    "algorithm": "F U R U' R' U R U' R' F'",
    "setup": "F R U R' U' R U R' U' F'",
    "kind": "OLL"
  },
  {
    "id": "52",
    "group": "I Shape",
    "algorithm": "R U R' U R U' B U' B' R'",
    "setup": "R B U B' U R' U' R U' R'",
    "kind": "OLL"
  },
  {
    "id": "53",
    "group": "Small L Shape",
    "algorithm": "l' U2 L U L' U' L U L' U l",
    "setup": "l' U' L U' L' U L U' L' U2 l",
    "kind": "OLL"
  },
  {
    "id": "54",
    "group": "Small L Shape",
    "algorithm": "r U2 R' U' R U R' U' R U' r'",
    "setup": "r U R' U R U' R' U R U2 r'",
    "kind": "OLL"
  },
  {
    "id": "55",
    "group": "I Shape",
    "algorithm": "R' F R U R U' R2 F' R2 U' R' U R U R'",
    "setup": "R U' R' U' R U R2 F R2 U R' U' R' F' R",
    "kind": "OLL"
  },
  {
    "id": "56",
    "group": "I Shape",
    "algorithm": "r U r' U R U' R' U R U' M' U' r'",
    "setup": "r U M U R' U' R U R' U' r U' r'",
    "kind": "OLL"
  },
  {
    "id": "57",
    "group": "Corners Oriented",
    "algorithm": "R U R' U' M' U R U' r'",
    "setup": "r U R' U' M U R U' R'",
    "kind": "OLL"
  }
];
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
