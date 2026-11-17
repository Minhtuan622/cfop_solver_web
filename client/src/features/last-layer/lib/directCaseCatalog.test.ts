import { describe, expect, it } from "vitest";
import { listLastLayerDirectCases } from "./directCaseCatalog";
import { ONE_LLL_DIRECT_CASES, ZBLL_DIRECT_CASES } from "./directCaseCatalogData";

describe("directCaseCatalog", () => {
  it("lists every ZBLL case then every 1LLL case for family=all", () => {
    const all = listLastLayerDirectCases({ family: "all", limit: 2000 });
    expect(all).toHaveLength(
      ZBLL_DIRECT_CASES.length + ONE_LLL_DIRECT_CASES.length
    );
    expect(all.slice(0, ZBLL_DIRECT_CASES.length).every(row => row.family === "zbll")).toBe(true);
    expect(all.slice(ZBLL_DIRECT_CASES.length).every(row => row.family === "1lll")).toBe(true);
    expect(new Set(all.map(row => `${row.family}:${row.id}`)).size).toBe(all.length);
  });

  it("filters by family", () => {
    expect(listLastLayerDirectCases({ family: "zbll", limit: 2000 })).toHaveLength(ZBLL_DIRECT_CASES.length);
    expect(listLastLayerDirectCases({ family: "1lll", limit: 2000 })).toHaveLength(ONE_LLL_DIRECT_CASES.length);
  });

  it("derives the case group from the id", () => {
    expect(listLastLayerDirectCases({ family: "zbll", group: "AS", limit: 5 })
      .every(row => row.group === "AS" && row.id.startsWith("ZBLLAS-"))).toBe(true);
    expect(listLastLayerDirectCases({ family: "1lll", group: "01", limit: 10 })
      .every(row => row.group === "01" && row.id.startsWith("1LLL-01-"))).toBe(true);
  });

  it("matches the query case-insensitively against id, group and algorithm", () => {
    const rows = listLastLayerDirectCases({ query: "zbllas-001" });
    expect(rows.map(row => row.id)).toContain("ZBLLAS-001");
  });

  it("clamps the limit to [1, 2000]", () => {
    expect(listLastLayerDirectCases({ limit: 0 })).toHaveLength(1);
    expect(listLastLayerDirectCases({ limit: 10 })).toHaveLength(10);
    // the clamp allows 2000, but the catalog only holds 1682 rows
    expect(listLastLayerDirectCases({ limit: 5000 })).toHaveLength(
      ZBLL_DIRECT_CASES.length + ONE_LLL_DIRECT_CASES.length
    );
  });

  it("returns nothing for an unknown query", () => {
    expect(listLastLayerDirectCases({ query: "NO-SUCH-CASE-XYZ" })).toEqual([]);
  });
});
