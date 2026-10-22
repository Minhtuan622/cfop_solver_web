import { describe, expect, it } from "vitest";
import {
  CfopReport,
  SolverDetails,
  SolverF2LOptions,
  SolverInputPanel,
  SolverRecentStates,
  SolverSolutionPanel,
  SolverToolbar,
  readRecentStates,
  rememberRecentState,
  writeRecentStates,
} from "./index";

describe("solver feature public boundary", () => {
  it("exports the panels the solver page is built from", () => {
    for (const component of [CfopReport, SolverDetails, SolverF2LOptions, SolverInputPanel, SolverRecentStates, SolverSolutionPanel, SolverToolbar]) {
      expect(typeof component).toBe("function");
    }
  });

  it("exports the storage behind the recent cube states", () => {
    expect(typeof readRecentStates).toBe("function");
    expect(typeof rememberRecentState).toBe("function");
    expect(typeof writeRecentStates).toBe("function");
  });
});
