import { Move } from "cubing/alg";
import {
  MethodUnavailableError,
  allOf,
  solveByMethod,
  solvedAt,
  solvedFrom,
  stateKey,
  type MethodPhase,
  type MethodSpec,
  type MoveTable,
  type OrbitSizes,
  type PuzzleState,
} from "./methodSolver";
import type { OtherPuzzleId } from "./puzzleSolve";

export type MethodPuzzleId = Extract<OtherPuzzleId, "222" | "pyram" | "skewb">;

const TURNS = (faces: string[]) => faces.flatMap(face => [face, `${face}2`, `${face}'`]);
const QUARTERS = (faces: string[]) => faces.flatMap(face => [face, `${face}'`]);

// 2x2 CLL: the bottom layer first, then the last layer in one CLL-style case
// found with R, U and F turns (the back-bottom-left corner never moves).
const CLL_MOVES = TURNS(["R", "U", "F"]);
const CLL: MethodSpec = {
  stages: [
    { name: "First Layer", moves: CLL_MOVES, goal: solvedAt("CORNERS", [4, 5, 6, 7]) },
    { name: "CLL", moves: CLL_MOVES, goal: "solved" },
  ],
};

// Pyraminx top-first: the top vertex and its three edges, then the last three
// edges with the tips left alone, then the four tips.
const PYRAMINX_BIG = QUARTERS(["R", "L", "U", "B"]);
const PYRAMINX_TIPS = QUARTERS(["r", "l", "u", "b"]);
const PYRAMINX: MethodSpec = {
  stages: [
    {
      name: "Top Layer",
      moves: PYRAMINX_BIG,
      goal: allOf(solvedAt("EDGES", [0, 1, 5]), solvedAt("CORNERS", [0])),
    },
    { name: "Last Edges", moves: PYRAMINX_BIG, goal: "solved", key: { skipOrbits: ["CORNERS2"] } },
    // The goal is filled in by solve(): tips are solved when the whole state is.
    { name: "Tips", moves: PYRAMINX_TIPS, goal: () => false },
  ],
};

// Skewb, Sarah's beginner: one face (its four corners and its center), then
// the other four corners. Center orientation is not visible, so it is ignored.
const SKEWB_MOVES = QUARTERS(["R", "L", "U", "B"]);
const SKEWB: MethodSpec = {
  key: { skipOrientation: ["CENTERS"] },
  stages: [
    {
      name: "First Face",
      moves: SKEWB_MOVES,
      goal: allOf(solvedAt("CORNERS", [2, 4, 5, 7]), state => state.CENTERS.pieces[2] === 2),
    },
    { name: "Last Corners", moves: SKEWB_MOVES, goal: "solved" },
  ],
};

const SPECS: Record<MethodPuzzleId, MethodSpec> = { "222": CLL, pyram: PYRAMINX, skewb: SKEWB };
const KPUZZLE_IDS = { "222": "2x2x2", pyram: "pyraminx", skewb: "skewb" } as const;

export function usesMethodSolver(puzzle: string): puzzle is MethodPuzzleId {
  return puzzle in SPECS;
}

export function specFor(puzzle: MethodPuzzleId): MethodSpec {
  if (puzzle !== "pyram") return SPECS[puzzle];
  const [top, edges, tips] = PYRAMINX.stages;
  return {
    ...PYRAMINX,
    stages: [
      top,
      edges,
      { ...tips, goal: state => stateKey(state) === stateKey(solvedFrom(state)) },
    ],
  };
}

export type PatternData = Record<string, { pieces: number[]; orientation: number[] }>;

export function methodPhases(
  puzzle: MethodPuzzleId,
  start: PuzzleState,
  context: { moves: MoveTable; sizes: OrbitSizes }
): MethodPhase[] {
  if (puzzle === "222" && start.CORNERS.pieces[6] !== 6)
    throw new MethodUnavailableError("fixed-corner-moved");
  return solveByMethod(puzzle, specFor(puzzle), context, start);
}

export async function solveWithMethod(
  puzzle: MethodPuzzleId,
  scramble: string | null,
  patternData: PatternData | null
): Promise<MethodPhase[]> {
  const [{ puzzles }, { Alg }] = await Promise.all([import("cubing/puzzles"), import("cubing/alg")]);
  const kpuzzle = await puzzles[KPUZZLE_IDS[puzzle]].kpuzzle();
  const data = (
    patternData ?? kpuzzle.defaultPattern().applyAlg(new Alg(scramble ?? "")).patternData
  ) as PatternData;
  const start: PuzzleState = Object.fromEntries(
    Object.entries(data).map(([orbit, value]) => [
      orbit,
      { pieces: [...value.pieces], orientation: [...value.orientation] },
    ])
  );
  const sizes: OrbitSizes = Object.fromEntries(
    kpuzzle.definition.orbits.map(orbit => [orbit.orbitName, orbit.numOrientations])
  );
  const names = new Set<string>();
  for (const stage of SPECS[puzzle].stages) for (const move of stage.moves) names.add(move);
  const moves: MoveTable = {};
  for (const name of names) {
    moves[name] = kpuzzle.moveToTransformation(new Move(name)).transformationData as MoveTable[string];
  }
  return methodPhases(puzzle, start, { moves, sizes });
}
