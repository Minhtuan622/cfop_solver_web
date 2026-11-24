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

const withState = (row: PyraminxCaseRow): PyraminxCatalogCase => ({
  ...row,
  state: `pyraminx:${row.id}`,
});

const LL_CATALOG: readonly PyraminxCatalogCase[] = LL_CASES_SOURCE.map(withState);
const L4E_CATALOG: readonly PyraminxCatalogCase[] = L4E_CASES_SOURCE.map(withState);

export const PYRAMINX_CATALOGS: Record<
  PyraminxFamily,
  readonly PyraminxCatalogCase[]
> = {
  ll: LL_CATALOG,
  l4e: L4E_CATALOG,
};
export const PYRAMINX_CATALOG: readonly PyraminxCatalogCase[] = [
  ...LL_CATALOG,
  ...L4E_CATALOG,
];

export function pyraminxCatalogOf(
  family: PyraminxFamily,
): readonly PyraminxCatalogCase[] {
  return PYRAMINX_CATALOGS[family];
}

export { PYRAMINX_COUNTS, PYRAMINX_GROUPS_BY_SET };
