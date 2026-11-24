import {
  FTO_2_LOOK_L3T_CASES,
  FTO_2_LOOK_L3T_COUNTS,
  FTO_2_LOOK_L3T_GROUPS,
  type Fto2LookL3tCaseRow,
  type Fto2LookL3tFamily,
} from "./l2tData";

export type { Fto2LookL3tFamily, Fto2LookL3tGroup } from "./l2tData";

export type Fto2LookL3tCatalogCase = Fto2LookL3tCaseRow & { state: string };

export type ListFto2LookL3tCasesFilter = {
  family?: "all" | Fto2LookL3tFamily;
  query?: string;
  limit?: number;
};

export const L2T_CATALOG: readonly Fto2LookL3tCatalogCase[] = FTO_2_LOOK_L3T_CASES.map(
  row => ({
    ...row,
    state: `l3t2:${row.id}`,
  }),
);

export const L2T_CATALOGS: Record<
  Fto2LookL3tFamily,
  readonly Fto2LookL3tCatalogCase[]
> = {
  l3t2: L2T_CATALOG,
};

export function l2tCatalogOf(
  family: Fto2LookL3tFamily,
): readonly Fto2LookL3tCatalogCase[] {
  return L2T_CATALOGS[family];
}

export function listFto2LookL3tCases(
  filters: ListFto2LookL3tCasesFilter = {},
): Fto2LookL3tCatalogCase[] {
  const family = filters.family ?? "all";
  const needle = (filters.query ?? "").toUpperCase().trim();
  const limit = Math.max(1, Math.min(filters.limit ?? 120, 1000));
  const rows: Fto2LookL3tCatalogCase[] = [];
  const source = family === "all" ? L2T_CATALOG : L2T_CATALOGS[family];
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

export { FTO_2_LOOK_L3T_COUNTS, FTO_2_LOOK_L3T_GROUPS };
