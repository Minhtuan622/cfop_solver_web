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

export { FOUR_BY_FOUR_PARITY_COUNTS };
