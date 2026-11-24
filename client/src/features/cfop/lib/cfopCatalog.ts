import { applyFastMoves, invertAlgorithm, SOLVED_FAST_STATE } from "@/lib/fastCube";
import type { LastLayerCatalogCase } from "@/lib/solverRuntime";
import {
  CFOP_CASES,
  F2L_4WAY_CASES,
  OLL_CASES,
  PLL_CASES,
  COLL_CASES,
  OLLCP_CASES,
  type CfopFamily,
} from "./cfopCatalogData";

export type { CfopFamily } from "./cfopCatalogData";
export { CFOP_CASES } from "./cfopCatalogData";

export type CfopCatalogCase = LastLayerCatalogCase & { name: string };

export type ListCfopCasesFilter = {
  family?: "all" | CfopFamily;
  query?: string;
  limit?: number;
};

const stateCache = new Map<string, string>();

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

export const CFOP_COUNTS = {
  f2l: F2L_4WAY_CASES.length,
  oll: OLL_CASES.length,
  pll: PLL_CASES.length,
  coll: COLL_CASES.length,
  ollcp: OLLCP_CASES.length,
  all: CFOP_CASES.length,
} as const;
