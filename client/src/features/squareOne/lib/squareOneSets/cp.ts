import type { SquareOneCaseRow } from "../squareOneData";

/** SQ1-CP — 8 cases. */
export const CP_CASES_SOURCE: readonly SquareOneCaseRow[] = [
  { id: "CP-Adj-Adj", family: "cp", group: "Top Adj", name: "Adj / Adj", algorithm: "/ (-3,0) / (3,3) / (0,-3) /" },
  { id: "CP-Adj-Opp", family: "cp", group: "Top Adj", name: "Adj / Opp", algorithm: "/ (0,-3) / (0,3) / (0,-3) / (0,3) /" },
  { id: "CP-Adj-Solved", family: "cp", group: "Top Adj", name: "Adj / Solved", algorithm: "/ (3,-3) / (-3,0) / (0,3) / (0,-3) / (0,3) /" },
  { id: "CP-Opp-Opp", family: "cp", group: "Top Opp", name: "Opp / Opp", algorithm: "/ (3,-3) / (-3,3) /" },
  { id: "CP-Opp-Adj", family: "cp", group: "Top Opp", name: "Opp / Adj", algorithm: "/ (-3,0) / (3,0) / (-3,0) / (3,0) /" },
  { id: "CP-Opp-Solved", family: "cp", group: "Top Opp", name: "Opp / Solved", algorithm: "/ (-3,-3) / (-3,0) / (-3,-3) / (-3,0) / (-3,-3) /" },
  { id: "CP-Solved-Adj", family: "cp", group: "Top Solved", name: "Solved / Adj", algorithm: "/ (3,-3) / (0,3) / (-3,0) / (3,0) / (-3,0) /" },
  { id: "CP-Solved-Opp", family: "cp", group: "Top Solved", name: "Solved / Opp", algorithm: "/ (3,3) / (0,3) / (3,3) / (0,3) / (3,3) /" },
];
