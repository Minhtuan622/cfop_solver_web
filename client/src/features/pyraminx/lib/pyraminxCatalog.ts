/**
 * Pyraminx catalog for the /study Pyraminx lane.
 *
 * There is no 2D facelet model for the Pyraminx in this app, and the case
 * preview is 3D-only: `Puzzle3DCanvas` applies the inverted algorithm to a
 * solved puzzle, so every shown case is guaranteed to be solved by its own
 * algorithm. `CatalogExplorer` still needs a `state` string per case, so it
 * carries a deterministic sentinel (`"pyraminx:<id>"`) that the icon preview
 * ignores; it holds no puzzle information. The algorithms themselves are
 * verified offline (round-trip through cubing.js KPuzzle).
 */
import {
  PYRAMINX_COUNTS,
  PYRAMINX_GROUPS_BY_SET,
  type PyraminxCaseRow,
  type PyraminxFamily,
  LL_CASES_SOURCE,
  L4E_CASES_SOURCE,
} from "./pyraminxData";

export type { PyraminxFamily } from "./pyraminxData";

export type PyraminxCatalogCase = PyraminxCaseRow & { state: string };

export type ListPyraminxCasesFilter = {
  /** "all" (default), "ll" or "l4e". */
  family?: "all" | PyraminxFamily;
  /** Substring match (case-insensitive) against id, name, group and algorithm. */
  query?: string;
  /** Maximum rows; clamped to [1, 1000]. */
  limit?: number;
};

const withState = (row: PyraminxCaseRow): PyraminxCatalogCase => ({
  ...row,
  state: `pyraminx:${row.id}`,
});

const LL_CATALOG: readonly PyraminxCatalogCase[] = LL_CASES_SOURCE.map(withState);
const L4E_CATALOG: readonly PyraminxCatalogCase[] = L4E_CASES_SOURCE.map(withState);

export const PYRAMINX_SETS = ["ll", "l4e"] as const;
export const PYRAMINX_CATALOGS: Record<
  PyraminxFamily,
  readonly PyraminxCatalogCase[]
> = {
  ll: LL_CATALOG,
  l4e: L4E_CATALOG,
};
/** The union of every set: LL, then L4E. */
export const PYRAMINX_CATALOG: readonly PyraminxCatalogCase[] = [
  ...LL_CATALOG,
  ...L4E_CATALOG,
];

export function pyraminxCatalogOf(
  family: PyraminxFamily,
): readonly PyraminxCatalogCase[] {
  return PYRAMINX_CATALOGS[family];
}

export function listPyraminxCases(
  filters: ListPyraminxCasesFilter = {},
): PyraminxCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: PyraminxCatalogCase[] = [];
  const source = family === "all" ? PYRAMINX_CATALOG : PYRAMINX_CATALOGS[family];
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

export { PYRAMINX_COUNTS, PYRAMINX_GROUPS_BY_SET };
