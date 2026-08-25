// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readBldLearningPath, writeBldLearningPath } from "./bldLearningPath";

describe("BLD learning path progress", () => {
  beforeEach(() => localStorage.clear());

  it("starts at the orientation stage with no progress", () => {
    expect(readBldLearningPath()).toEqual({ orientationDone: false, formulaDone: false, memoDone: false, lastStage: 0 });
  });

  it("persists stage completion and bounds a restored stage index", () => {
    writeBldLearningPath({ orientationDone: true, formulaDone: true, memoDone: true, lastStage: 4 });
    expect(readBldLearningPath()).toEqual({ orientationDone: true, formulaDone: true, memoDone: true, lastStage: 4 });

    localStorage.setItem("cfop-bld-learning-path-v1", JSON.stringify({ lastStage: 99 }));
    expect(readBldLearningPath().lastStage).toBe(4);
  });
});
