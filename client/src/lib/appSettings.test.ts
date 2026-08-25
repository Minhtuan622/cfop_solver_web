// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SOLVER_SETTINGS, readSolverSettings, writeSolverSettings } from "./appSettings";

describe("solver settings opening find-result mode", () => {
  beforeEach(() => localStorage.clear());

  it("reads old settings safely with find-result mode disabled", () => {
    localStorage.setItem("cfop-app-solver-settings-v1", JSON.stringify({ crossColor: "U", opening: "xxcross", openingDepth: 8, lastLayer: "auto", excludedSlots: [] }));
    expect(readSolverSettings()).toMatchObject({ opening: "xxcross", openingFindResult: false, directNodeBudget: 5000 });
  });

  it("persists the direct-result retry preference", () => {
    writeSolverSettings({ ...DEFAULT_SOLVER_SETTINGS, opening: "xxxxcross", openingFindResult: true });
    expect(readSolverSettings()).toMatchObject({ opening: "xxxxcross", openingFindResult: true });
  });

  it("persists and bounds the direct node threshold", () => {
    writeSolverSettings({ ...DEFAULT_SOLVER_SETTINGS, directNodeBudget: 12500 });
    expect(readSolverSettings().directNodeBudget).toBe(12500);
    localStorage.setItem("cfop-app-solver-settings-v1", JSON.stringify({ directNodeBudget: 999999 }));
    expect(readSolverSettings().directNodeBudget).toBe(50000);
    localStorage.setItem("cfop-app-solver-settings-v1", JSON.stringify({ directNodeBudget: 1 }));
    expect(readSolverSettings().directNodeBudget).toBe(500);
  });
});
