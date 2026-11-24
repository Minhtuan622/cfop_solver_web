import type { TimerEventId } from "@/lib/timerEvents";
import type { PuzzleId } from "@/features/puzzle-3d/lib/puzzleIds";

export type OtherPuzzleId = "222" | "pyram" | "skewb" | "minx" | "clock" | "333fm" | "333roux";

export type OtherPuzzleInfo = {
  eventId: TimerEventId;
  scrambleEventId: TimerEventId;
  inPicker: boolean;
  puzzle: PuzzleId;
  labelKey: string;
};

export const OTHER_PUZZLES: Record<OtherPuzzleId, OtherPuzzleInfo> = {
  "222": { eventId: "222", scrambleEventId: "222", inPicker: true, puzzle: "2x2x2", labelKey: "otherPuzzles.puzzle.222" },
  pyram: { eventId: "pyram", scrambleEventId: "pyram", inPicker: true, puzzle: "pyraminx", labelKey: "otherPuzzles.puzzle.pyram" },
  skewb: { eventId: "skewb", scrambleEventId: "skewb", inPicker: true, puzzle: "skewb", labelKey: "otherPuzzles.puzzle.skewb" },
  minx: { eventId: "minx", scrambleEventId: "minx", inPicker: true, puzzle: "megaminx", labelKey: "otherPuzzles.puzzle.minx" },
  clock: { eventId: "clock", scrambleEventId: "clock", inPicker: true, puzzle: "clock", labelKey: "otherPuzzles.puzzle.clock" },
  "333roux": { eventId: "333", scrambleEventId: "333", inPicker: true, puzzle: "3x3x3", labelKey: "otherPuzzles.puzzle.333roux" },
  "333fm": { eventId: "333fm", scrambleEventId: "333", inPicker: false, puzzle: "3x3x3", labelKey: "otherPuzzles.puzzle.333fm" },
};

const PICKER_ORDER: OtherPuzzleId[] = ["333roux", "222", "pyram", "skewb", "minx", "clock", "333fm"];
export const OTHER_PUZZLE_IDS = PICKER_ORDER.filter(id => OTHER_PUZZLES[id].inPicker);

export const MAX_SCRAMBLE_LENGTH = 400;

export type PuzzleSolveErrorCode =
  | "empty"
  | "too-long"
  | "invalid-scramble"
  | "invalid-state"
  | "solver-failed";

export class PuzzleSolveError extends Error {
  constructor(
    readonly code: PuzzleSolveErrorCode,
    message?: string
  ) {
    super(message ?? code);
    this.name = "PuzzleSolveError";
  }
}

export type SolutionPhase = { name: string; moves: string[] };

export type PuzzleSolveResult = {
  scramble: string;
  solution: string;
  moves: number;
  phases?: SolutionPhase[];
};

export type SolveEngine = {
  solveWithPhases?(
    puzzle: OtherPuzzleId,
    scramble: string
  ): Promise<{ solution: string; phases: SolutionPhase[] }>;
  solve(puzzle: OtherPuzzleId, scramble: string): Promise<string>;
};

export function normalizeScramble(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function countMoves(algorithm: string) {
  const text = algorithm.trim();
  return text ? text.split(/\s+/).length : 0;
}

type SearchModule = typeof import("cubing/search");
type SolverFn = (pattern: Parameters<SearchModule["solvePyraminx"]>[0]) => ReturnType<SearchModule["solvePyraminx"]>;

export function pickSolver(search: SearchModule, puzzle: OtherPuzzleId): SolverFn {
  if (puzzle === "222") return search.experimentalSolve2x2x2;
  if (puzzle === "333fm")
    return search.experimentalSolve3x3x3IgnoringCenters;
  if (puzzle === "pyram") return search.solvePyraminx;
  if (puzzle === "minx") return search.solveMegaminx;
  return search.solveSkewb;
}

export function invertAlgorithm(algorithm: string, options: { fifthTurns?: boolean } = {}) {
  return normalizeScramble(algorithm)
    .split(" ")
    .filter(Boolean)
    .reverse()
    .map(move =>
      move.endsWith("++")
        ? `${move.slice(0, -2)}--`
        : move.endsWith("--")
          ? `${move.slice(0, -2)}++`
          : move.endsWith("'")
            ? move.slice(0, -1)
            : move.endsWith("2") && !options.fifthTurns
              ? move
              : `${move}'`
    )
    .join(" ");
}

export const cubingEngine: SolveEngine = {
  async solveWithPhases(puzzle, scramble) {
    if (puzzle !== "333roux") throw new PuzzleSolveError("solver-failed");
    const { solveRouxScramble } = await import("@/features/roux/lib/rouxEngine");
    try {
      const result = await solveRouxScramble(scramble);
      return { solution: result.moves.join(" "), phases: result.phases };
    } catch (error) {
      throw new PuzzleSolveError(
        /parse|syntax|unknown|invalid|move/i.test(String(error)) ? "invalid-scramble" : "solver-failed",
        String(error)
      );
    }
  },
  async solve(puzzle, scramble) {
    if (puzzle === "clock") {
      const { dialsFromScramble, solveClockDials } = await import("./clockEngine");
      let dials: number[];
      try {
        dials = await dialsFromScramble(scramble);
      } catch (error) {
        throw new PuzzleSolveError("invalid-scramble", String(error));
      }
      const solution = await solveClockDials(dials);
      if (solution === null) throw new PuzzleSolveError("solver-failed");
      return solution;
    }
    const [{ Alg }, { puzzles }, search] = await Promise.all([
      import("cubing/alg"),
      import("cubing/puzzles"),
      import("cubing/search"),
    ]);
    const kpuzzleId = OTHER_PUZZLES[puzzle].puzzle as "2x2x2" | "3x3x3" | "pyraminx" | "skewb" | "megaminx";
    const kpuzzle = await puzzles[kpuzzleId].kpuzzle();
    let pattern;
    try {
      pattern = kpuzzle.defaultPattern().applyAlg(new Alg(scramble));
    } catch (error) {
      throw new PuzzleSolveError("invalid-scramble", String(error));
    }
    return (await pickSolver(search, puzzle)(pattern)).toString();
  },
};

export async function solveOtherPuzzle(
  puzzle: OtherPuzzleId,
  rawScramble: string,
  engine: SolveEngine = cubingEngine
): Promise<PuzzleSolveResult> {
  const scramble = normalizeScramble(rawScramble);
  if (!scramble) throw new PuzzleSolveError("empty");
  if (scramble.length > MAX_SCRAMBLE_LENGTH) throw new PuzzleSolveError("too-long");
  let solution: string;
  let phases: SolutionPhase[] | undefined;
  try {
    if (puzzle === "333roux" && engine.solveWithPhases) {
      const detailed = await engine.solveWithPhases(puzzle, scramble);
      solution = normalizeScramble(detailed.solution);
      phases = detailed.phases;
    } else solution = normalizeScramble(await engine.solve(puzzle, scramble));
  } catch (error) {
    if (error instanceof PuzzleSolveError) throw error;
    console.warn(`[puzzle-solve] ${puzzle} failed`, error);
    throw new PuzzleSolveError(
      /parse|syntax|unknown|invalid|move/i.test(String(error))
        ? "invalid-scramble"
        : "solver-failed",
      String(error)
    );
  }
  return { scramble, solution, moves: countMoves(solution), ...(phases ? { phases } : {}) };
}
