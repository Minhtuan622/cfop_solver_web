/**
 * 4×4 PLL parity catalog for the /study 4×4 Parity lane.
 *
 * Keeps a deterministic sentinel `state` (`"parity:<id>"`) that the icon
 * preview ignores — there is no 2D facelet model; the case preview is the
 * 3D twisty-player rendering of the inverted (converted) algorithm applied
 * to the solved puzzle. The algorithms are verified offline (round-trip
 * through cubing.js KPuzzle).
 */
import {
  FOUR_BY_FOUR_PARITY_CATALOG,
  FOUR_BY_FOUR_PARITY_COUNTS,
  type FourByFourParityCaseRow,
  type FourByFourParityFamily,
} from "./fourByFourParityData";

export type { FourByFourParityFamily } from "./fourByFourParityData";

export type FourByFourParityCatalogCase = FourByFourParityCaseRow & { state: string };

export type ListFourByFourParityCasesFilter = {
  /** "all" (default) or "pll-parity". */
  family?: "all" | FourByFourParityFamily;
  /** Substring match (case-insensitive) against id, name, group and algorithm. */
  query?: string;
  /** Maximum rows; clamped to [1, 1000]. */
  limit?: number;
};

export const PARITY_CATALOG: readonly FourByFourParityCatalogCase[] =
  FOUR_BY_FOUR_PARITY_CATALOG.map(row => ({
    ...row,
    state: `parity:${row.id}`,
  }));

export const PARITY_CATALOGS: Record<
  FourByFourParityFamily,
  readonly FourByFourParityCatalogCase[]
> = {
  "pll-parity": PARITY_CATALOG,
};

export function parityCatalogOf(
  family: FourByFourParityFamily,
): readonly FourByFourParityCatalogCase[] {
  return PARITY_CATALOGS[family];
}

export function listFourByFourParityCases(
  filters: ListFourByFourParityCasesFilter = {},
): FourByFourParityCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: FourByFourParityCatalogCase[] = [];
  const source = family === "all" ? PARITY_CATALOG : PARITY_CATALOGS[family];
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

export { FOUR_BY_FOUR_PARITY_COUNTS };
