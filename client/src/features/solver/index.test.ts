import { describe, expect, it } from "vitest";
import { CfopReport } from "./index";

describe("solver feature public boundary", () => {
  it("exports the solution report through the feature barrel", () => {
    expect(typeof CfopReport).toBe("function");
  });
});
