// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { readLastLayerStudy, readMasteredCaseKeys, writeLastLayerStudy, writeMasteredCaseKeys } from "./lastLayerStudy";

describe("lastLayerStudy persistence", () => {
  beforeEach(() => localStorage.clear());

  it("preserves study progress and mastered case keys through the shared storage helper", () => {
    writeLastLayerStudy({ dailyGoal: 20, records: {} });
    writeMasteredCaseKeys(new Set(["zbll:AS-001", "1lll:H-1"]));

    expect(readLastLayerStudy()).toEqual({ dailyGoal: 20, records: {} });
    expect(readMasteredCaseKeys()).toEqual(new Set(["zbll:AS-001", "1lll:H-1"]));
  });
});
