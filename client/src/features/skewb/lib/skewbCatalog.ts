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

export { SKEWB_COUNTS, SKEWB_GROUPS_BY_SET };
