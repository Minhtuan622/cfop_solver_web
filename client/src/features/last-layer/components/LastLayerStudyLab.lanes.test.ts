import { describe, expect, it } from "vitest";
import { studyLaneForQuery } from "./LastLayerStudyLab";

describe("Study lanes", () => {
  it("keeps Last Layer and 3-Style BLD available and routes FTO links to the FTO L3T lane", () => {
    expect(studyLaneForQuery(null)).toBe("lastLayer");
    expect(studyLaneForQuery("bld")).toBe("bld");
    expect(studyLaneForQuery("cfop")).toBe("cfop");
    expect(studyLaneForQuery("twobytwo")).toBe("twoByTwo");
    expect(studyLaneForQuery("pyraminx")).toBe("pyraminx");
    expect(studyLaneForQuery("skewb")).toBe("skewb");
    expect(studyLaneForQuery("roux")).toBe("roux");
    expect(studyLaneForQuery("sq1")).toBe("sq1");
    expect(studyLaneForQuery("4x4")).toBe("parity");
    expect(studyLaneForQuery("parity")).toBe("parity");
    expect(studyLaneForQuery("5x5")).toBe("l2e");
    expect(studyLaneForQuery("l2e")).toBe("l2e");
    expect(studyLaneForQuery("fto")).toBe("l3t");
    expect(studyLaneForQuery("l3t")).toBe("l3t");
    expect(studyLaneForQuery("fto2")).toBe("l3t2");
    expect(studyLaneForQuery("2look")).toBe("l3t2");
    expect(studyLaneForQuery("l3t2")).toBe("l3t2");
  });
});
