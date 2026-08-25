// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings } from "./appSettings";

describe("solver settings opening find-result mode", () => {
  beforeEach(() => localStorage.clear());

  it("reads old settings safely with find-result mode disabled", () => {
    localStorage.setItem("cfop-app-solver-settings-v1", JSON.stringify({ crossColor: "U", opening: "xxcross", openingDepth: 8, lastLayer: "auto", excludedSlots: [] }));
    expect(readSolverSettings()).toMatchObject({ opening: "xxcross", openingFindResult: false });
  });

  it("persists the direct-result retry preference", () => {
    writeSolverSettings({ ...DEFAULT_SOLVER_SETTINGS, opening: "xxxxcross", openingFindResult: true });
    expect(readSolverSettings()).toMatchObject({ opening: "xxxxcross", openingFindResult: true });
  });
});
