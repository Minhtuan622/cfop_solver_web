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
