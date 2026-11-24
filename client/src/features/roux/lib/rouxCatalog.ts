/**
 * Roux catalog for the /study Roux lane.
 *
 * Like the Skewb lane, the case preview is 3D-only: `Puzzle3DCanvas` applies
 * the inverted algorithm to a solved cube, so every shown case is solved by its
 * own algorithm. `CatalogExplorer` still needs a `state` string per case; it
 * carries a deterministic sentinel (`"roux:<id>"`) the icon preview ignores.
 */
import {
  CMLL_CASES_SOURCE,
  LSE_CASES_SOURCE,
  ROUX_COUNTS,
  ROUX_GROUPS_BY_SET,
  type RouxCaseRow,
  type RouxFamily,
} from "./rouxData";

export type { RouxFamily } from "./rouxData";

export type RouxCatalogCase = RouxCaseRow & { state: string };

const withState = (row: RouxCaseRow): RouxCatalogCase => ({
  ...row,
  state: `roux:${row.id}`,
});

export const ROUX_CATALOGS: Record<RouxFamily, readonly RouxCatalogCase[]> = {
  cmll: CMLL_CASES_SOURCE.map(withState),
  lse: LSE_CASES_SOURCE.map(withState),
};

/** CMLL first, then LSE. */
export const ROUX_CATALOG: readonly RouxCatalogCase[] = [
  ...ROUX_CATALOGS.cmll,
  ...ROUX_CATALOGS.lse,
];

export function rouxCatalogOf(family: RouxFamily): readonly RouxCatalogCase[] {
  return ROUX_CATALOGS[family];
}

export { ROUX_COUNTS, ROUX_GROUPS_BY_SET };
