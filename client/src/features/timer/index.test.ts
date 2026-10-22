import { describe, expect, it } from "vitest";
import { MetricButton } from "./index";

describe("timer feature public boundary", () => {
  it("exports presentation components through the feature barrel", () => {
    expect(typeof MetricButton).toBe("function");
  });
});
