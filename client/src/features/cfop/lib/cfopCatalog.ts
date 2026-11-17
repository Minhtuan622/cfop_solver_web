/**
 * Query and derive the CFOP case catalog for the /study lane.
 *
 * The pre-image (case) states are computed from the algorithms at call time
 * via `applyFastMoves(SOLVED_FAST_STATE, invertAlgorithm(alg))` and memoized,
 * so the embedded data only carries (id, family, group, name, algorithm) and
 * every shown case is guaranteed to be solved by its own algorithm.
 */
import { applyFastMoves, invertAlgorithm, SOLVED_FAST_STATE } from "@/lib/fastCube";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";
import {
  CFOP_CASES,
  F2L_4WAY_CASES,
  OLL_CASES,
  PLL_CASES,
  type CfopFamily,
} from "./cfopCatalogData";

export type { CfopFamily } from "./cfopCatalogData";
export { CFOP_CASES } from "./cfopCatalogData";

export type CfopCatalogCase = LastLayerCatalogCase & { name: string };

export type ListCfopCasesFilter = {
  family?: "all" | CfopFamily;
  /** Substring match (case-insensitive) against id, group, name and algorithm. */
  query?: string;
  /** Maximum rows to return; clamped to [1, 1000]. */
  limit?: number;
};

const stateCache = new Map<string, string>();

/** The 54-sticker pre-image the shown case starts from (memoized per case). */
export function cfopCaseState(row: { algorithm: string }): string {
  const cached = stateCache.get(row.algorithm);
  if (cached) return cached;
  const state = applyFastMoves(
    SOLVED_FAST_STATE,
    invertAlgorithm(row.algorithm),
  );
  stateCache.set(row.algorithm, state);
  return state;
}

function toCatalogCase(row: (typeof CFOP_CASES)[number]): CfopCatalogCase {
  return {
    id: row.id,
    family: row.family,
    group: row.group,
    algorithm: row.algorithm,
    state: cfopCaseState(row),
    name: row.name,
  };
}

/** All CFOP cases as rich catalog rows (f2l → oll → pll). */
export const CFOP_CATALOG: readonly CfopCatalogCase[] = CFOP_CASES.map(toCatalogCase);

export function listCfopCases(
  filters: ListCfopCasesFilter = {},
): CfopCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: CfopCatalogCase[] = [];
  for (const row of CFOP_CATALOG) {
    if (family !== "all" && row.family !== family) continue;
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

export function cfopCaseCount(family: CfopFamily): number {
  return family === "f2l"
    ? F2L_4WAY_CASES.length
    : family === "oll"
      ? OLL_CASES.length
      : PLL_CASES.length;
}

export const CFOP_COUNTS = {
  f2l: F2L_4WAY_CASES.length,
  oll: OLL_CASES.length,
  pll: PLL_CASES.length,
  all: CFOP_CASES.length,
} as const;
