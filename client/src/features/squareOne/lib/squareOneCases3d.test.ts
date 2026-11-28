import { describe, expect, it } from "vitest";
import { isSquareOneSetupLegal } from "@/lib/squareOneModel";
import { SQUARE_ONE_CATALOG } from "./squareOneData";
import { invertSquareOneAlgorithm } from "./squareOneAlg";

describe("Square-1 cases on the 3D model", () => {
  it("can draw almost every case from its inverse algorithm", () => {
    const drawable = SQUARE_ONE_CATALOG.filter(item =>
      isSquareOneSetupLegal(invertSquareOneAlgorithm(item.algorithm))
    );
    // The few that start from a shifted layer fall back to the flat diagram.
    expect(SQUARE_ONE_CATALOG.length - drawable.length).toBeLessThanOrEqual(8);
    expect(drawable.length).toBeGreaterThan(570);
  });
});
