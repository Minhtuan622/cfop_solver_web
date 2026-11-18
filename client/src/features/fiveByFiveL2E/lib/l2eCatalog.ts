/**
 * 5×5 L2E catalog for the /study 5×5 L2E lane.
 *
 * Mirrors the 4×4 parity catalog: rows carry a sentinel `state`
 * (`"l2e:<id>"`) that the catalog preview resolves to the generated
 * `diagrams/fiveByFiveL2E/<id>.svg` last-layer cross. The practice card still
 * renders the 3D twisty-player state of the inverted algorithm.
 */
import {
  FIVE_BY_FIVE_L2E_CASES,
  FIVE_BY_FIVE_L2E_COUNTS,
  type FiveByFiveL2ECaseRow,
  type FiveByFiveL2EFamily,
} from "./l2eData";

export type { FiveByFiveL2EFamily } from "./l2eData";

export type FiveByFiveL2ECatalogCase = FiveByFiveL2ECaseRow & { state: string };

export type ListFiveByFiveL2ECasesFilter = {
  /** "all" (default) or "l2e". */
  family?: "all" | FiveByFiveL2EFamily;
  /** Substring match (case-insensitive) against id, name, group and algorithm. */
  query?: string;
  /** Maximum rows; clamped to [1, 1000]. */
  limit?: number;
};

export const L2E_CATALOG: readonly FiveByFiveL2ECatalogCase[] =
  FIVE_BY_FIVE_L2E_CASES.map(row => ({
    ...row,
    state: `l2e:${row.id}`,
  }));

export const L2E_CATALOGS: Record<
  FiveByFiveL2EFamily,
  readonly FiveByFiveL2ECatalogCase[]
> = {
  l2e: L2E_CATALOG,
};

export function l2eCatalogOf(
  family: FiveByFiveL2EFamily,
): readonly FiveByFiveL2ECatalogCase[] {
  return L2E_CATALOGS[family];
}

export function listFiveByFiveL2ECases(
  filters: ListFiveByFiveL2ECasesFilter = {},
): FiveByFiveL2ECatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: FiveByFiveL2ECatalogCase[] = [];
  const source = family === "all" ? L2E_CATALOG : L2E_CATALOGS[family];
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

export { FIVE_BY_FIVE_L2E_COUNTS };
