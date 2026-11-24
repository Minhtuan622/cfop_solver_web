import { stateFromScramble } from "@/lib/fastCube";
import { solveInBrowser, type SolverResult } from "@/lib/solverRuntime";
import type { SplitPhase } from "@/lib/solveHistory";
import { mergeTurns } from "./solveAnalysis";

export type SolverComparison = {
  phases: Record<SplitPhase, number>;
  total: number;
};

const groupOf = (name: string): SplitPhase =>
  name === "cross" ? "Cross" : name.startsWith("f2l") ? "F2L" : name === "oll" ? "OLL" : "PLL";

export function comparisonFromResult(result: SolverResult): SolverComparison {
  const groups: Record<SplitPhase, string[]> = { Cross: [], F2L: [], OLL: [], PLL: [] };
  for (const phase of result.phases) groups[groupOf(phase.name)].push(...phase.moves);
  const count = (moves: string[]) => mergeTurns(moves, moves.map((_, index) => index)).length;
  const phases = {
    Cross: count(groups.Cross),
    F2L: count(groups.F2L),
    OLL: count(groups.OLL),
    PLL: count(groups.PLL),
  };
  return { phases, total: count(Object.values(groups).flat()) };
}

export async function compareWithSolver(scramble: string): Promise<SolverComparison> {
  const result = await solveInBrowser(
    "state",
    stateFromScramble(scramble),
    "D",
    "cross",
    {},
    "oll_pll"
  );
  return comparisonFromResult(result);
}
