/**
 * 2×2 CLL catalog for the /study 2×2 lane.
 *
 * Case states are derived at call time via
 * `applyTwoByTwoMoves(TWO_BY_TWO_SOLVED, invertAlgorithm(algorithm))` and
 * memoized, so every shown case is guaranteed to be solved by its own alg.
 */
import { applyTwoByTwoMoves, TWO_BY_TWO_SOLVED } from "./twoByTwoCube";
import { invertAlgorithm } from "@/lib/fastCube";
import { CLL_CASES, type TwoByTwoCaseRow } from "./twoByTwoCatalogData";

export type TwoByTwoCatalogCase = TwoByTwoCaseRow & { state: string };

export type ListTwoByTwoCasesFilter = {
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

export const TWO_BY_TWO_CATALOG: readonly TwoByTwoCatalogCase[] = CLL_CASES.map(
  row => ({ ...row, state: twoByTwoCaseStateOf(row) }),
);

export function listTwoByTwoCases(
  filters: ListTwoByTwoCasesFilter = {},
): TwoByTwoCatalogCase[] {
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: TwoByTwoCatalogCase[] = [];
  for (const row of TWO_BY_TWO_CATALOG) {
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
  cll: CLL_CASES.length,
  all: TWO_BY_TWO_CATALOG.length,
} as const;

export const TWO_BY_TWO_GROUPS = [
  "AS",
  "H",
  "L",
  "Pi",
  "Sune",
  "T",
  "U",
] as const;
