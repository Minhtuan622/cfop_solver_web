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
