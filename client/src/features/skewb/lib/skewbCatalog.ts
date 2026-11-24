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

const withState = (row: SkewbCaseRow): SkewbCatalogCase => ({
  ...row,
  state: `skewb:${row.id}`,
});

const SARAH_INTERMEDIATE_CATALOG: readonly SkewbCatalogCase[] =
  SARAH_INTERMEDIATE_CASES_SOURCE.map(withState);
const SARAH_ADVANCED_CATALOG: readonly SkewbCatalogCase[] =
  SARAH_ADVANCED_CASES_SOURCE.map(withState);

export const SKEWB_CATALOGS: Record<
  SkewbFamily,
  readonly SkewbCatalogCase[]
> = {
  "sarah-intermediate": SARAH_INTERMEDIATE_CATALOG,
  "sarah-advanced": SARAH_ADVANCED_CATALOG,
};
export const SKEWB_CATALOG: readonly SkewbCatalogCase[] = [
  ...SARAH_INTERMEDIATE_CATALOG,
  ...SARAH_ADVANCED_CATALOG,
];

export function skewbCatalogOf(
  family: SkewbFamily,
): readonly SkewbCatalogCase[] {
  return SKEWB_CATALOGS[family];
}

export { SKEWB_COUNTS, SKEWB_GROUPS_BY_SET };
