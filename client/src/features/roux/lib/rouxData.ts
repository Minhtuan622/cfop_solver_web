/**
 * Danh mục công thức Roux cho lane Roux của /study.
 *
 * CMLL: 42 case (Kian Mansour / Waffle), lấy từ https://scheopner.com/cube/cmll.php
 * (một công thức chính mỗi case, 2026-11). LSE: các bước theo hướng dẫn LSE của
 * https://www.scheopner.com/cube/lse.php (EO, đặt UL/UR, L4E).
 *
 * Mọi công thức được kiểm chứng bằng mô phỏng trên khối thật (cubing.js
 * KPuzzle) trong `rouxData.test.ts`; trạng thái từng case dựng bằng cách áp
 * ĐẢO của công thức lên khối đã giải, nên công thức luôn giải đúng case của nó.
 */
export type RouxFamily = "cmll" | "lse";

export type RouxCaseRow = {
  id: string;
  family: RouxFamily;
  group: string;
  name: string;
  algorithm: string;
};

const cmll = (group: string, name: string, algorithm: string): RouxCaseRow => ({
  id: `CMLL-${group}-${name}`.replace(/[\s/\\]+/g, "-"),
  family: "cmll",
  group,
  name: `CMLL ${group} · ${name}`,
  algorithm,
});

/** 42 case CMLL, theo nhóm O, H, Pi, U, T, S (Sune), As (Antisune), L. */
export const CMLL_CASES_SOURCE: readonly RouxCaseRow[] = [
  cmll("O", "Adjacent swap", "R U R' F' R U R' U' R' F R2 U' R'"),
  cmll("O", "Diagonal swap", "F R U' R' U' R U R' F' (R U R' U') (R' F R F')"),
  cmll("H", "Columns", "(R U2 R') U' (R U R' U') (R U' R')"),
  cmll("H", "Single Column", "U F (R U' R' U) (R U2 R') U' (R U R' U') F'"),
  cmll("H", "Single Row", "r U' r2 D' (r U' r') D r2 U r'"),
  cmll("H", "Rows", "F (R U R' U') (R U R' U') (R U R' U') F'"),
  cmll("Pi", "Back Row", "U F (R U R' U') (R U R' U') F'"),
  cmll("Pi", "Rows", "r U' r2 D' (r U r') D r2 U r'"),
  cmll("Pi", "Up Slash", "U2 (F R' F' R) U2 (R U' R') U (R U2 R')"),
  cmll("Pi", "X Checkerboard", "R' F R U F U' (R U R' U') F'"),
  cmll("Pi", "Down Slash", "U R U2 R' U' R U R' U2 R' F R F'"),
  cmll("Pi", "Front Row", "R' U' R' F R F' R U' R' U2 R"),
  cmll("U", "Columns", "R2 F U' F U F2 R2 U' R' F R"),
  cmll("U", "Front Row", "U2 (r U' r') U r' D' (r U' r') D r"),
  cmll("U", "Right Column", "R2 D' (R U2 R') D R U2 R"),
  cmll("U", "Back Row", "U' F R2 D R' U R D' R2 U' F'"),
  cmll("U", "Left Column", "U2 R2 D (R' U2 R) D' R' U2 R'"),
  cmll("U", "Rows", "U' F (R U R' U') F'"),
  cmll("T", "Back Row", "F R' F R2 U' R' U' (R U R') F2"),
  cmll("T", "Rows", "(r' D' r) U (r' D r) U' (r U r')"),
  cmll("T", "Up Slash", "U' (R U R' U') (R' F R F')"),
  cmll("T", "X Checkerboard", "(r' U r) U2 R2 F R F' R"),
  cmll("T", "Down Slash", "U (L' U' L U) (L F' L' F)"),
  cmll("T", "Front Row", "U2 r2 D' (r U r') D r2 U' (r' U' r)"),
  cmll("S", "Left Column", "(R U R') U (R U2 R')"),
  cmll("S", "Down Slash", "(R U R' U') (R' F R F') (R U R') U (R U2 R')"),
  cmll("S", "X Checkerboard", "R U' L' U R' U' L"),
  cmll("S", "Up Slash", "(L' U2 L U2) (L F' L' F)"),
  cmll("S", "Columns", "(F R' F' R) (U2 R U2 R')"),
  cmll("S", "Right Column", "U2 (R U R') U (R' F R F') (R U2 R')"),
  cmll("As", "Right Column", "U2 (R' U' R) U' (R' U2 R)"),
  cmll("As", "Up Slash", "R2 D (R' U R) D' R' U R' U' (R U' R')"),
  cmll("As", "Columns", "(F' L F L') (U2 L' U2 L)"),
  cmll("As", "Down Slash", "(R U2 R' U2) (R' F R F')"),
  cmll("As", "X Checkerboard", "L' U R U' L U R'"),
  cmll("As", "Left Column", "U (R' U' R) U' R' U (R' F R F') U R"),
  cmll("L", "Adj Row", "U2 (R U2 R') U' (R U R' U') (R U R' U') (R U' R')"),
  cmll("L", "Opp Row", "F (R U' R') U' (R U R') F'"),
  cmll("L", "Opp Slash", "U' R' U2 R' D' (R U2 R') D R2"),
  cmll("L", "Adj Slash", "R U2 R D (R' U2 R) D' R2"),
  cmll("L", "Opp Column", "(F R' F' R) (U R U' R')"),
  cmll("L", "Adj Column", "R U2 R2 F R F' R U2 R'"),
];

const lse = (group: string, name: string, algorithm: string): RouxCaseRow => ({
  id: `LSE-${group}-${name}`.replace(/[\s/\\()+]+/g, "-").replace(/-+$/g, ""),
  family: "lse",
  group,
  name: `LSE ${group} · ${name}`,
  algorithm,
});

/**
 * LSE (Last Six Edges): chỉ dùng M và U. Chia theo bước: EO (định hướng cạnh),
 * UL/UR (đưa hai cạnh UL, UR về chỗ), L4E (bốn cạnh cuối).
 */
export const LSE_CASES_SOURCE: readonly RouxCaseRow[] = [
  lse("EO", "D-Line", "M' U M' U' M U M"),
  lse("EO", "1+1 B", "M' U' M' U2 M U M'"),
  lse("EO", "V", "M' U M' U2 M' U M'"),
  lse("EO", "V + D-Line", "M2 U' M' U M'"),
  lse("EO", "U-Line", "M' U M' U' M' U M'"),
  lse("EO", "U+D Line", "M' U2 M' U2 M U M"),
  lse("EO", "F Arrow", "M' U M'"),
  lse("EO", "Cross", "M' U2 M' U2 M' U M'"),
  lse("EO", "6 Flip", "M' U M' U M U M U2 M' U M'"),
  lse("ULUR", "Đưa một cạnh xuống D", "M2"),
  lse("ULUR", "UL/UR chéo (DF và UB)", "M' U2 M'"),
  lse("ULUR", "UL/UR chéo (DB và UF)", "M' U2 M"),
  lse("L4E", "3-cycle thuận", "U2 M' U2 M"),
  lse("L4E", "3-cycle nghịch", "M' U2 M U2"),
  lse("L4E", "H", "M2 U2 M2 U2"),
  lse("L4E", "Dots", "M' E2 M E2"),
];

export type RouxCaseGroupSets = Record<RouxFamily, readonly string[]>;

export const ROUX_GROUPS_BY_SET: RouxCaseGroupSets = {
  cmll: ["O", "H", "Pi", "U", "T", "S", "As", "L"],
  lse: ["EO", "ULUR", "L4E"],
};

export const ROUX_COUNTS = {
  cmll: CMLL_CASES_SOURCE.length,
  lse: LSE_CASES_SOURCE.length,
  all: CMLL_CASES_SOURCE.length + LSE_CASES_SOURCE.length,
} as const;
