import { applyTwoByTwoMoves, TWO_BY_TWO_SOLVED } from "./twoByTwoCube";
import { invertAlgorithm } from "@/lib/fastCube";
import { CLL_CASES, PBL_CASES, type TwoByTwoCaseRow } from "./twoByTwoCatalogData";
import { EG1_CASES, EG2_CASES } from "./twoByTwoEgData";

export type TwoByTwoFamily = "cll" | "pbl" | "eg1" | "eg2";
export type TwoByTwoCatalogCase = TwoByTwoCaseRow & { state: string };

export type ListTwoByTwoCasesFilter = {
  family?: "all" | TwoByTwoFamily;
  query?: string;
  limit?: number;
};

const stateCache = new Map<string, string>();

export function twoByTwoCaseStateOf(row: { algorithm: string }): string {
  const cached = stateCache.get(row.algorithm);
  if (cached) return cached;
  const state = applyTwoByTwoMoves(
    TWO_BY_TWO_SOLVED,
    invertAlgorithm(row.algorithm),
  );
  stateCache.set(row.algorithm, state);
  return state;
}

const CLL_CATALOG: readonly TwoByTwoCatalogCase[] = CLL_CASES.map(
  row => ({ ...row, state: twoByTwoCaseStateOf(row) }),
);
const PBL_CATALOG: readonly TwoByTwoCatalogCase[] = PBL_CASES.map(
  row => ({ ...row, state: twoByTwoCaseStateOf(row) }),
);

const EG1_CATALOG: readonly TwoByTwoCatalogCase[] = EG1_CASES.map(
  row => ({ ...row, state: twoByTwoCaseStateOf(row) }),
);
const EG2_CATALOG: readonly TwoByTwoCatalogCase[] = EG2_CASES.map(
  row => ({ ...row, state: twoByTwoCaseStateOf(row) }),
);
export const TWO_BY_TWO_SETS = ["cll", "pbl", "eg1", "eg2"] as const;
export const TWO_BY_TWO_CATALOGS: Record<TwoByTwoFamily, readonly TwoByTwoCatalogCase[]> = {
  cll: CLL_CATALOG,
  pbl: PBL_CATALOG,
  eg1: EG1_CATALOG,
  eg2: EG2_CATALOG,
};
export const TWO_BY_TWO_CATALOG: readonly TwoByTwoCatalogCase[] = [
  ...CLL_CATALOG,
  ...PBL_CATALOG,
  ...EG1_CATALOG,
  ...EG2_CATALOG,
];

export function twoByTwoCatalogOf(family: TwoByTwoFamily): readonly TwoByTwoCatalogCase[] {
  return TWO_BY_TWO_CATALOGS[family];
}

export function listTwoByTwoCases(
  filters: ListTwoByTwoCasesFilter = {},
): TwoByTwoCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: TwoByTwoCatalogCase[] = [];
  const source =
    family === "all"
      ? [...CLL_CATALOG, ...PBL_CATALOG, ...EG1_CATALOG, ...EG2_CATALOG]
      : TWO_BY_TWO_CATALOGS[family];
  for (const row of source) {
    if (needle) {
      const searchable =
        `${row.id} ${row.name} ${row.group} ${row.algorithm}`.toUpperCase();
      if (!searchable.includes(needle)) continue;
    }
    rows.push(row);
    if (rows.length >= limit) break;
  }
  return rows;
}

export const TWO_BY_TWO_COUNTS = {
  cll: CLL_CATALOG.length,
  pbl: PBL_CATALOG.length,
  eg1: EG1_CATALOG.length,
  eg2: EG2_CATALOG.length,
  all:
    CLL_CATALOG.length +
    PBL_CATALOG.length +
    EG1_CATALOG.length +
    EG2_CATALOG.length,
} as const;

export const CLL_GROUPS = [
  "AS",
  "H",
  "L",
  "Pi",
  "Sune",
  "T",
  "U",
] as const;
export const PBL_GROUPS = ["Adj", "Diag"] as const;
export const TWO_BY_TWO_GROUPS_BY_SET: Record<TwoByTwoFamily | "all", readonly string[]> = {
  cll: CLL_GROUPS,
  pbl: PBL_GROUPS,
  eg1: CLL_GROUPS,
  eg2: CLL_GROUPS,
  all: [...CLL_GROUPS, ...PBL_GROUPS],
};
