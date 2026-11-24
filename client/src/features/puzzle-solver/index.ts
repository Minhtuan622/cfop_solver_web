/** Public surface of the 2×2 / Pyraminx / Skewb solver. */
export { OtherPuzzleSolver } from "./components/OtherPuzzleSolver";
export { FaceletStatePainter } from "./components/FaceletStatePainter";
export { SolutionStage, isPlayableAlgorithm } from "./components/SolutionStage";
export {
  PuzzleKindPicker,
  isCubeSolveMode,
  type CubeSolveMode,
  type SolveChoice,
} from "./components/PuzzleKindPicker";
export * from "./lib/puzzleSolve";
