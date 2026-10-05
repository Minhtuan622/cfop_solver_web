import { describe, expect, it } from "vitest";
import { studyLaneForQuery } from "./LastLayerStudyLab";

describe("Study lanes", () => {
  it("keeps Last Layer and 3-Style BLD available while retired FTO links safely open Last Layer", () => {
    expect(studyLaneForQuery(null)).toBe("lastLayer");
    expect(studyLaneForQuery("bld")).toBe("bld");
    expect(studyLaneForQuery("fto")).toBe("lastLayer");
  });
});
