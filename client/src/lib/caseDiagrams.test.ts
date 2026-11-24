import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { listCfopCases } from "@/features/cfop/lib/cfopCatalog";
import { listTwoByTwoCases } from "@/features/twoByTwo/lib/twoByTwoCatalog";
import { listLastLayerDirectCases } from "@/features/last-layer/lib/directCaseCatalog";
import { listFiveByFiveL2ECases } from "@/features/fiveByFiveL2E/lib/l2eCatalog";

const root = path.resolve(import.meta.dirname, "../../..");

const LANES: Array<{ lane: string; cases: Array<{ id: string }> }> = [
  { lane: "cfop", cases: listCfopCases({ limit: 10000 }) },
  { lane: "twoByTwo", cases: listTwoByTwoCases({ limit: 10000 }) },
  { lane: "lastLayer", cases: listLastLayerDirectCases({ limit: 10000 }) },
  { lane: "fiveByFiveL2E", cases: listFiveByFiveL2ECases({ limit: 10000 }) },
];

function diagramPath(lane: string, id: string) {
  return path.join(
    root,
    "client",
    "public",
    "diagrams",
    lane,
    `${encodeURIComponent(id)}.svg`,
  );
}

describe("generated case diagrams", () => {
  for (const { lane, cases } of LANES) {
    it(`${lane}: every catalog case has a generated diagram (${cases.length})`, () => {
      expect(cases.length).toBeGreaterThan(0);
      const missing = cases.filter(
        row =>
          !existsSync(diagramPath(lane, row.id)) ||
          statSync(diagramPath(lane, row.id)).size < 100,
      );
      expect(missing.map(row => row.id)).toEqual([]);
    });
  }

  it("generated files are valid flat SVG documents", () => {
    for (const { lane, cases } of LANES) {
      const content = readFileSync(diagramPath(lane, cases[0]!.id), "utf8");
      expect(content.startsWith("<svg ")).toBe(true);
      expect(content).toContain("</svg>");
      expect(content).not.toContain("undefined");
    }
  });
});
