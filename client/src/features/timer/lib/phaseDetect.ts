export type PhaseDetection = {
  cross: boolean;
  f2l: boolean;
  oll: boolean;
};

const D_ALL = [27, 28, 29, 30, 31, 32, 33, 34, 35];
const D_CROSS = [28, 30, 32, 34];
const R_MIDDLE = [12, 13, 14];
const F_MIDDLE = [21, 22, 23];
const L_MIDDLE = [39, 40, 41];
const B_MIDDLE = [48, 49, 50];
const U_ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8];

const uniform = (state: string, indices: readonly number[], letter: string) =>
  indices.every(index => state[index] === letter);

export function detectCompletedPhases(state: string): PhaseDetection {
  if (typeof state !== "string" || state.length !== 54) {
    return { cross: false, f2l: false, oll: false };
  }
  const cross = uniform(state, D_CROSS, "D");
  const f2l =
    cross &&
    uniform(state, D_ALL, "D") &&
    uniform(state, R_MIDDLE, "R") &&
    uniform(state, F_MIDDLE, "F") &&
    uniform(state, L_MIDDLE, "L") &&
    uniform(state, B_MIDDLE, "B");
  const oll = uniform(state, U_ALL, "U");
  return { cross, f2l, oll };
}
