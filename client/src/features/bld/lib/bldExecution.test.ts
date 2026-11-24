import { describe, expect, it } from "vitest";
import {
  flipPairsOf,
  parityKeyOf,
  parseCatalog,
  sourceToSpeffz,
  twistKeyOf,
  type BldRuntimeCatalogs,
} from "./bldExecution";

describe("bldExecution", () => {
  it("đổi chữ Chichu của BLDDB sang Speffz theo loại mảnh", () => {
    expect(sourceToSpeffz("edge")("AJ")).toBe("CK");
    expect(sourceToSpeffz("edge")("?")).toBe("?");
  });

  it("lấy thuật toán đầu tiên của mỗi case và bỏ case rỗng", () => {
    expect(parseCatalog({ AB: ["R U R'", "L"], CD: [] })).toEqual({ AB: "R U R'" });
    expect(parseCatalog({ x: ["U"] }, key => key.toUpperCase())).toEqual({ X: "U" });
  });

  it("ghép cạnh lật thành cặp theo thứ tự BLDDB", () => {
    expect(flipPairsOf(["UR", "UF"])).toEqual([{ key: "BH", positions: "UF ↔ UR" }]);
    expect(flipPairsOf(["DB", "UF", "BL"])).toEqual([{ key: "BN", positions: "UF ↔ DB" }]);
    expect(flipPairsOf([])).toEqual([]);
  });

  it("ghép key twist theo thứ tự góc của BLDDB", () => {
    expect(twistKeyOf([{ position: "UFR", direction: "cw" }, { position: "UFL", direction: "ccw" }])).toBe("BL");
    expect(twistKeyOf([])).toBe("");
  });

  it("chỉ trả key parity khi có exact match, không tự suy đoán", () => {
    const catalogs = {
      edgeCode: { UF: "1", UR: "2" },
      cornerCode: { UFR: "a", UBR: "b" },
      parityEdge: { "12": "E" },
      parityCorner: { ab: "C" },
    } as unknown as BldRuntimeCatalogs;
    expect(parityKeyOf(catalogs, ["UF", "UR"], ["UFR", "UBR"])).toBe("EC");
    expect(parityKeyOf(catalogs, ["UF", "UF"], ["UFR", "UBR"])).toBe("");
    expect(parityKeyOf(catalogs, ["UR", "UF"], ["UFR", "UBR"])).toBe("");
    expect(parityKeyOf(null, ["UF", "UR"], ["UFR", "UBR"])).toBe("");
  });
});
