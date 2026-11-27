import {
  OTHER_PUZZLES,
  PuzzleSolveError,
  normalizeScramble,
  pickSolver,
  type OtherPuzzleId,
  type SolutionPhase,
} from "./puzzleSolve";
import {
  colorCountsMatch,
  parseHandSvg,
  parseStateSvg,
  paintingToPatternData,
  patternToPainting,
  solvedPainting,
  type KPuzzleId,
  type Painting,
  type PatternData,
  type StateModel,
} from "./puzzleState";

export const STATE_SOLVE_TIMEOUT_MS = 30_000;

const models = new Map<KPuzzleId, Promise<StateModel>>();

type PuzzleGeometryLike = {
  getKPuzzleDefinition(includeMoves: boolean): {
    orbits: Array<{ orbitName: string; numPieces: number; numOrientations: number }>;
  };
  generatesvg(width: number, height: number, trim: number, threeD: boolean): string;
};

export function loadStateModel(id: KPuzzleId): Promise<StateModel> {
  let model = models.get(id);
  if (!model) {
    model = (async () => {
      const { puzzles } = await import("cubing/puzzles");
      const entry = puzzles[id] as unknown as {
        kpuzzle: () => Promise<{
          definition: {
            orbits: Array<{ orbitName: string; numPieces: number; numOrientations: number }>;
          };
        }>;
        svg?: () => Promise<string>;
        pg?: () => Promise<PuzzleGeometryLike>;
      };
      const orbits = (await entry.kpuzzle()).definition.orbits.map(orbit => ({
        name: orbit.orbitName,
        numPieces: orbit.numPieces,
        numOrientations: orbit.numOrientations,
      }));
      if (id === "2x2x2" || id === "3x3x3")
        return parseHandSvg(await entry.svg!(), orbits);
      const svg = entry.pg
        ? (await entry.pg()).generatesvg(800, 500, 0, false)
        : await entry.svg!();
      return parseStateSvg(svg, orbits);
    })();
    models.set(id, model);
  }
  return model;
}

export async function solvedStatePainting(id: KPuzzleId): Promise<Painting> {
  return solvedPainting(await loadStateModel(id));
}

export type StateSolution = {
  phases?: SolutionPhase[];
  setup: string;
  solution: string;
};

export type PatternSolver = (pattern: unknown) => Promise<string>;

export async function solveFromPainting(
  puzzle: OtherPuzzleId,
  painting: Painting,
  solver?: PatternSolver
): Promise<StateSolution> {
  const kpuzzleId = OTHER_PUZZLES[puzzle].puzzle as KPuzzleId;
  const model = await loadStateModel(kpuzzleId);
  if (!colorCountsMatch(model, painting)) throw new PuzzleSolveError("invalid-state");
  const built = paintingToPatternData(model, painting);
  if (!built.ok) throw new PuzzleSolveError("invalid-state");

  const [{ puzzles }, { KPattern }, { Alg }, search] = await Promise.all([
    import("cubing/puzzles"),
    import("cubing/kpuzzle"),
    import("cubing/alg"),
    import("cubing/search"),
  ]);
  const kpuzzle = await puzzles[kpuzzleId].kpuzzle();
  const base = kpuzzle.defaultPattern().patternData as Record<string, object>;
  const data = Object.fromEntries(
    model.orbits.map(orbit => [
      orbit.name,
      { ...base[orbit.name], ...built.data[orbit.name] },
    ])
  );
  const pattern = new KPattern(kpuzzle, data as never);

  let phases: SolutionPhase[] | undefined;
  const run =
    solver ??
    (puzzle === "222" || puzzle === "pyram" || puzzle === "skewb"
      ? async (value: unknown) => {
          const { solveWithMethod } = await import("./methods");
          const { MethodUnavailableError } = await import("./methodSolver");
          const patternData = (value as { patternData: never }).patternData;
          try {
            const found = await solveWithMethod(puzzle, null, patternData);
            phases = found;
            return found.flatMap(phase => phase.moves).join(" ");
          } catch (error) {
            if (!(error instanceof MethodUnavailableError)) throw error;
            return (await pickSolver(search, puzzle)(value as never)).toString();
          }
        }
      : puzzle === "333roux"
      ? async (value: unknown) => {
          const { solveRouxPattern } = await import("@/features/roux/lib/rouxEngine");
          const roux = await solveRouxPattern(
            (value as { patternData: never }).patternData
          );
          phases = roux.phases;
          return roux.moves.join(" ");
        }
      : (value: unknown) => pickSolver(search, puzzle)(value as never).then(alg => alg.toString()));
  let text: string;
  try {
    text = await Promise.race([
      run(pattern),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new PuzzleSolveError("invalid-state")), STATE_SOLVE_TIMEOUT_MS)
      ),
    ]);
  } catch (error) {
    if (error instanceof PuzzleSolveError) throw error;
    throw new PuzzleSolveError("invalid-state", String(error));
  }
  const solution = normalizeScramble(text);

  const after = patternToPainting(
    model,
    pattern.applyAlg(new Alg(solution)).patternData as unknown as PatternData
  );
  const solved = solvedPainting(model);
  const mismatch = model.stickers.some(
    sticker => sticker.orbit !== "CENTERS" && after[sticker.id] !== solved[sticker.id]
  );
  if (mismatch) throw new PuzzleSolveError("invalid-state");

  const { invertAlgorithm } = await import("./puzzleSolve");
  return {
    solution,
    setup: invertAlgorithm(solution, { fifthTurns: puzzle === "minx" }),
    ...(phases ? { phases } : {}),
  };
}
