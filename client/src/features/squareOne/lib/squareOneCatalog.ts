/**
 * Square-1 catalog for the /study Square-1 lane.
 *
 * The catalog keeps a deterministic sentinel `state` (`"sq1:<id>"`) that the
 * icon preview ignores — there is no 2D facelet model; the case preview is
 * the library's 2D twisty-player rendering of the inverted algorithm applied
 * to the solved puzzle. The algorithms themselves are verified offline
 * (round-trip through cubing.js KPuzzle).
 */
import {
  SQUARE_ONE_CATALOG,
  SQ1_FAMILIES,
  SQ1_COUNTS,
  SQUARE_ONE_GROUPS_BY_SET,
  type SquareOneCaseRow,
  type SquareOneFamily,
} from "./squareOneData";

export type { SquareOneFamily } from "./squareOneData";

export type SquareOneCatalogCase = SquareOneCaseRow & { state: string };

const withState = (row: SquareOneCaseRow): SquareOneCatalogCase => ({
  ...row,
  state: `sq1:${row.id}`,
});

const CATALOG_BY_FAMILY: Record<SquareOneFamily, readonly SquareOneCatalogCase[]> = {
  cp: SQUARE_ONE_CATALOG.filter(row => row.family === "cp").map(withState),
  cs: SQUARE_ONE_CATALOG.filter(row => row.family === "cs").map(withState),
  csp: SQUARE_ONE_CATALOG.filter(row => row.family === "csp").map(withState),
  eo: SQUARE_ONE_CATALOG.filter(row => row.family === "eo").map(withState),
  ep: SQUARE_ONE_CATALOG.filter(row => row.family === "ep").map(withState),
  obl: SQUARE_ONE_CATALOG.filter(row => row.family === "obl").map(withState),
};

export const SQ1_CATALOG: readonly SquareOneCatalogCase[] = [
  ...CATALOG_BY_FAMILY.cp,
  ...CATALOG_BY_FAMILY.cs,
  ...CATALOG_BY_FAMILY.csp,
  ...CATALOG_BY_FAMILY.eo,
  ...CATALOG_BY_FAMILY.ep,
  ...CATALOG_BY_FAMILY.obl,
];

export function squareOneCatalogOf(
  family: SquareOneFamily,
): readonly SquareOneCatalogCase[] {
  return CATALOG_BY_FAMILY[family];
}

export { SQ1_FAMILIES, SQ1_COUNTS, SQUARE_ONE_GROUPS_BY_SET };
