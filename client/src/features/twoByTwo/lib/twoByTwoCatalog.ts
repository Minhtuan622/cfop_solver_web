/**
 * 2×2 CLL catalog for the /study 2×2 lane.
 *
 * Case states are derived at call time via
 * `applyTwoByTwoMoves(TWO_BY_TWO_SOLVED, invertAlgorithm(algorithm))` and
 * memoized, so every shown case is guaranteed to be solved by its own alg.
 */
import { applyTwoByTwoMoves, TWO_BY_TWO_SOLVED } from "./twoByTwoCube";
import { invertAlgorithm } from "@/lib/fastCube";
import { CLL_CASES, PBL_CASES, type TwoByTwoCaseRow } from "./twoByTwoCatalogData";

export type TwoByTwoFamily = "cll" | "pbl";
export type TwoByTwoCatalogCase = TwoByTwoCaseRow & { state: string };

export type ListTwoByTwoCasesFilter = {
  /** "all" (default), "cll" or "pbl". */
  family?: "all" | TwoByTwoFamily;
  /** Substring match (case-insensitive) against id, name, group and algorithm. */
  query?: string;
  /** Maximum rows; clamped to [1, 1000]. */
  limit?: number;
};

const stateCache = new Map<string, string>();

/** The 24-facelet pre-image the shown case starts from (memoized per case). */
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

export const TWO_BY_TWO_SETS = ["cll", "pbl"] as const;
export const TWO_BY_TWO_CATALOGS: Record<TwoByTwoFamily, readonly TwoByTwoCatalogCase[]> = {
  cll: CLL_CATALOG,
  pbl: PBL_CATALOG,
};
/** The union of both sets, in CLL-then-PBL order. */
export const TWO_BY_TWO_CATALOG: readonly TwoByTwoCatalogCase[] = [
  ...CLL_CATALOG,
  ...PBL_CATALOG,
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
      ? [...CLL_CATALOG, ...PBL_CATALOG]
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
  all: CLL_CATALOG.length + PBL_CATALOG.length,
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
/** Groups browse-able per set; "all" browses the union. */
export const TWO_BY_TWO_GROUPS_BY_SET: Record<TwoByTwoFamily | "all", readonly string[]> = {
  cll: CLL_GROUPS,
  pbl: PBL_GROUPS,
  all: [...CLL_GROUPS, ...PBL_GROUPS],
};
