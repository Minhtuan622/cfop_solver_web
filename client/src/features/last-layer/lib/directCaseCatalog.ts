/**
 * Pure-TypeScript listing of the verified direct 1LLL/ZBLL cases, shown in the
 * Last Layer Study catalog.
 *
 * Replaces the old lite Pyodide worker's `catalog` command: the same query
 * (family / group / query / limit) over the same rows, without loading a
 * Python runtime. The rows are the ones embedded in the solver for the
 * one-look direct cases (see `directCaseCatalogData.ts`).
 */
import { ONE_LLL_DIRECT_CASES, ZBLL_DIRECT_CASES } from "./directCaseCatalogData";

export type LastLayerCatalogCase = {
  id: string;
  family:
    | "zbll"
    | "1lll"
    | "f2l"
    | "oll"
    | "pll"
    | "cll"
    | "pbl"
    | "edge"
    | "corner"
    | "special"
    | "eg1"
    | "eg2"
    | "coll"
    | "ollcp"
    | "ll"
    | "l4e"
    | "sarah-intermediate"
    | "sarah-advanced"
    | "cp"
    | "cs"
    | "csp"
    | "eo"
    | "ep"
    | "obl"
    | "pll-parity"
    | "l2e"
    | "l3t"
    | "l3t2";
  group: string;
  algorithm: string;
  state: string;
};

export type ListLastLayerCasesFilter = {
  /** "all" (default), "zbll" or "1lll". */
  family?: "all" | "zbll" | "1lll";
  /** Case group prefix, e.g. "AS" for ZBLLAS-001 or "01" for 1LLL-01-001. */
  group?: string;
  /** Substring match against id, group and algorithm (case-insensitive). */
  query?: string;
  /** Maximum rows to return; clamped to [1, 2000]. */
  limit?: number;
};

function pushCases(
  table: readonly { id: string; algorithm: string; state: string }[],
  tableFamily: "zbll" | "1lll",
  normalizedGroup: string,
  needle: string,
  limit: number,
  rows: LastLayerCatalogCase[]
) {
  for (const row of table) {
    const group =
      tableFamily === "zbll"
        ? row.id.slice(4).split("-", 2)[0]! // "ZBLLAS-001" -> "AS"
        : row.id.split("-")[1]!; // "1LLL-01-001" -> "01"
    if (
      normalizedGroup !== "" &&
      normalizedGroup !== "ALL" &&
      group !== normalizedGroup
    )
      continue;
    const searchable = `${row.id} ${group} ${row.algorithm}`.toUpperCase();
    if (needle && !searchable.includes(needle)) continue;
    rows.push({
      id: row.id,
      family: tableFamily,
      group,
      algorithm: row.algorithm,
      state: row.state,
    });
    if (rows.length >= limit) return true;
  }
  return false;
}

/** List direct cases in the same order as the legacy Python catalog (ZBLL first, then 1LLL). */
export function listLastLayerDirectCases(
  filters: ListLastLayerCasesFilter = {}
): LastLayerCatalogCase[] {
  const normalizedFamily = (filters.family ?? "all").toLowerCase().trim();
  const normalizedGroup = (filters.group ?? "all").toUpperCase().trim();
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 2000));
  const rows: LastLayerCatalogCase[] = [];
  if (normalizedFamily === "all" || normalizedFamily === "zbll") {
    if (pushCases(ZBLL_DIRECT_CASES, "zbll", normalizedGroup, needle, limit, rows))
      return rows;
  }
  if (normalizedFamily === "all" || normalizedFamily === "1lll")
    pushCases(ONE_LLL_DIRECT_CASES, "1lll", normalizedGroup, needle, limit, rows);
  return rows;
}
