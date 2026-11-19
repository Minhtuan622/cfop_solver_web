/**
 * FTO L3T catalog for the /study FTO L3T lane.
 *
 * Mirrors the other study catalogs: rows carry a sentinel `state`
 * (`"l3t:<id>"`) that the icon preview ignores — the case preview is the
 * 3D twisty-player rendering of the inverted algorithm applied to the
 * solved puzzle. The catalog is grouped by phase (PF / TL / LT).
 */
import {
  FTO_L3T_CASES,
  FTO_L3T_COUNTS,
  FTO_L3T_GROUPS,
  type FtoL3tCaseRow,
  type FtoL3tFamily,
  type FtoL3tGroup,
} from "./l3tData";

export type { FtoL3tFamily, FtoL3tGroup } from "./l3tData";

export type FtoL3tCatalogCase = FtoL3tCaseRow & { state: string };

export type ListFtoL3tCasesFilter = {
  /** "all" (default) or "l3t". */
  family?: "all" | FtoL3tFamily;
  /** Substring match (case-insensitive) against id, name, group and algorithm. */
  query?: string;
  /** Maximum rows; clamped to [1, 1000]. */
  limit?: number;
};

export const L3T_CATALOG: readonly FtoL3tCatalogCase[] = FTO_L3T_CASES.map(
  row => ({
    ...row,
    state: `l3t:${row.id}`,
  }),
);

export const L3T_CATALOGS: Record<
  FtoL3tFamily,
  readonly FtoL3tCatalogCase[]
> = {
  l3t: L3T_CATALOG,
};

export function l3tCatalogOf(
  family: FtoL3tFamily,
): readonly FtoL3tCatalogCase[] {
  return L3T_CATALOGS[family];
}

export function listFtoL3tCases(
  filters: ListFtoL3tCasesFilter = {},
): FtoL3tCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: FtoL3tCatalogCase[] = [];
  const source = family === "all" ? L3T_CATALOG : L3T_CATALOGS[family];
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

export { FTO_L3T_COUNTS, FTO_L3T_GROUPS };
