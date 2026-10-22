import { describe, expect, it } from "vitest";
import { CfopReport, SolverStat } from "./index";

describe("solver feature public boundary", () => {
  it("exports the solution report and the stat tile through the feature barrel", () => {
    expect(typeof CfopReport).toBe("function");
    expect(typeof SolverStat).toBe("function");
  });
});
