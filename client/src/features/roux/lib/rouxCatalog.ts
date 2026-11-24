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

export const ROUX_CATALOG: readonly RouxCatalogCase[] = [
  ...ROUX_CATALOGS.cmll,
  ...ROUX_CATALOGS.lse,
];

export function rouxCatalogOf(family: RouxFamily): readonly RouxCatalogCase[] {
  return ROUX_CATALOGS[family];
}

export { ROUX_COUNTS, ROUX_GROUPS_BY_SET };
