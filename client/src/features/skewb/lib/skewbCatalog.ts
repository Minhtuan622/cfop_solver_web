/**
 * Skewb catalog for the /study Skewb lane.
 *
 * There is no 2D facelet model for the Skewb in this app, and the case
 * preview is 3D-only: `Puzzle3DCanvas` applies the inverted algorithm to a
 * solved puzzle, so every shown case is guaranteed to be solved by its own
 * algorithm. `CatalogExplorer` still needs a `state` string per case, so it
 * carries a deterministic sentinel (`"skewb:<id>"`) that the icon preview
 * ignores; it holds no puzzle information. The algorithms themselves are
 * verified offline (round-trip through cubing.js KPuzzle).
 */
import {
  SKEWB_COUNTS,
  SKEWB_GROUPS_BY_SET,
  type SkewbCaseRow,
  type SkewbFamily,
  SARAH_INTERMEDIATE_CASES_SOURCE,
  SARAH_ADVANCED_CASES_SOURCE,
} from "./skewbData";

export type { SkewbFamily } from "./skewbData";

export type SkewbCatalogCase = SkewbCaseRow & { state: string };

export type ListSkewbCasesFilter = {
  /** "all" (default), "sarah-intermediate" or "sarah-advanced". */
  family?: "all" | SkewbFamily;
  /** Substring match (case-insensitive) against id, name, group and algorithm. */
  query?: string;
  /** Maximum rows; clamped to [1, 1000]. */
  limit?: number;
};

const withState = (row: SkewbCaseRow): SkewbCatalogCase => ({
  ...row,
  state: `skewb:${row.id}`,
});

const SARAH_INTERMEDIATE_CATALOG: readonly SkewbCatalogCase[] =
  SARAH_INTERMEDIATE_CASES_SOURCE.map(withState);
const SARAH_ADVANCED_CATALOG: readonly SkewbCatalogCase[] =
  SARAH_ADVANCED_CASES_SOURCE.map(withState);

export const SKEWB_SETS = ["sarah-intermediate", "sarah-advanced"] as const;
export const SKEWB_CATALOGS: Record<
  SkewbFamily,
  readonly SkewbCatalogCase[]
> = {
  "sarah-intermediate": SARAH_INTERMEDIATE_CATALOG,
  "sarah-advanced": SARAH_ADVANCED_CATALOG,
};
/** The union of every set: Sarah Intermediate, then Sarah Advanced. */
export const SKEWB_CATALOG: readonly SkewbCatalogCase[] = [
  ...SARAH_INTERMEDIATE_CATALOG,
  ...SARAH_ADVANCED_CATALOG,
];

export function skewbCatalogOf(
  family: SkewbFamily,
): readonly SkewbCatalogCase[] {
  return SKEWB_CATALOGS[family];
}

export function listSkewbCases(
  filters: ListSkewbCasesFilter = {},
): SkewbCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: SkewbCatalogCase[] = [];
  const source = family === "all" ? SKEWB_CATALOG : SKEWB_CATALOGS[family];
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

export { SKEWB_COUNTS, SKEWB_GROUPS_BY_SET };
