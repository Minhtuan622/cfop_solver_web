import type { SquareOneCaseRow } from "../squareOneData";

export const EO_CASES_SOURCE: readonly SquareOneCaseRow[] = [
  { id: "EO-1-1", family: "eo", group: "EO Algs", name: "1 / 1", algorithm: "(1,0) / (3,0) / (3,0) / (-1,-1) / (-2,1) / (-3,0) / (-1,0)" },
  { id: "EO-Opp-Opp", family: "eo", group: "EO Algs", name: "Opp / Opp", algorithm: "(1,0) / (-1,-1) / (0,1)" },
  { id: "EO-4-4", family: "eo", group: "EO Algs", name: "4 / 4", algorithm: "(1,0) / (-1,-1) / (-2,4) / (-1,-1) / (0,1)" },
  { id: "EO-Adj-Adj", family: "eo", group: "EO Algs", name: "Adj / Adj", algorithm: "(1,0) / (3,0) / (-1,-1) / (-3,0) / (0,1)" },
  { id: "EO-3-3", family: "eo", group: "EO Algs", name: "3 / 3", algorithm: "(1,0) / (3,0) / (3,0) / (-1,-1) / (-3,0) / (-3,0) / (0,1)" },
  { id: "EO-Adj-Opp", family: "eo", group: "EO Algs", name: "Adj / Opp", algorithm: "(1,0) / (0,-3) / (0,3) / (2,-1) / (-3,0) / (0,1)" },
  { id: "EO-Opp-Adj", family: "eo", group: "EO Algs", name: "Opp / Adj", algorithm: "(0,-1) / (3,0) / (-3,0) / (1,-2) / (0,3) / (-1,0)" },
];
