/**
 * Giải từ trạng thái tô màu: dựng mô hình sticker từ hình học của cubing.js,
 * đổi màu thành `KPattern`, chạy bộ giải rồi kiểm lại lời giải trên chính
 * trạng thái đó (bắt các trạng thái không hợp lệ mà bộ giải vẫn trả lời).
 */
import {
  OTHER_PUZZLES,
  PuzzleSolveError,
  normalizeScramble,
  pickSolver,
  type OtherPuzzleId,
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

/** Quá hạn này thì coi như trạng thái không giải được (bộ giải có thể quay vô hạn). */
export const STATE_SOLVE_TIMEOUT_MS = 30_000;

const models = new Map<KPuzzleId, Promise<StateModel>>();

type PuzzleGeometryLike = {
  getKPuzzleDefinition(includeMoves: boolean): {
    orbits: Array<{ orbitName: string; numPieces: number; numOrientations: number }>;
  };
  generatesvg(width: number, height: number, trim: number, threeD: boolean): string;
};

/** Mô hình sticker của một khối; tải một lần rồi nhớ lại. */
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
      // Quy ước đánh số của chính `KPuzzle` mà bộ giải dùng.
      const orbits = (await entry.kpuzzle()).definition.orbits.map(orbit => ({
        name: orbit.orbitName,
        numPieces: orbit.numPieces,
        numOrientations: orbit.numOrientations,
      }));
      // 2×2×2 và 3×3×3 có KPuzzle viết tay: dùng SVG vẽ tay đúng quy ước của nó.
      // Pyraminx, Skewb có KPuzzle sinh từ hình học (`pg`); Megaminx chỉ có SVG
      // sinh sẵn cùng dạng.
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

/** Trạng thái đã giải của một khối (để đặt lại). */
export async function solvedStatePainting(id: KPuzzleId): Promise<Painting> {
  return solvedPainting(await loadStateModel(id));
}

export type StateSolution = {
  /** Chuỗi lượt đưa khối đã giải về đúng trạng thái này (nghịch đảo lời giải). */
  setup: string;
  solution: string;
};

/** Bộ giải ở dạng nhận pattern, thay được trong kiểm thử. */
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

  const run = solver ?? ((value: unknown) => pickSolver(search, puzzle)(value as never).then(alg => alg.toString()));
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

  // Lời giải phải thật sự đưa trạng thái này về đã giải (không tính hướng tâm,
  // vì bộ giải 3×3 bỏ qua tâm).
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
  return { solution, setup: invertAlgorithm(solution, { fifthTurns: puzzle === "minx" }) };
}
