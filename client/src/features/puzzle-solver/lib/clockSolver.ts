export const CLOCK_MOVE_NAMES = ["UR", "DR", "DL", "UL", "U", "R", "D", "L", "ALL"] as const;
export type ClockMoveName = (typeof CLOCK_MOVE_NAMES)[number];

export type ClockFlip = { permutation: number[]; delta: number[] };

export type ClockModel = {
  front: Record<ClockMoveName, number[]>;
  back: Record<ClockMoveName, number[]>;
  flip: ClockFlip;
};

const mod = (value: number, modulus: number) => ((value % modulus) + modulus) % modulus;

function applyFlip(flip: ClockFlip, dials: number[]) {
  return dials.map((_, index) => mod(dials[flip.permutation[index]] + flip.delta[index], 12));
}

function permuteOnly(flip: ClockFlip, vector: number[]) {
  return vector.map((_, index) => vector[flip.permutation[index]]);
}

function solveLocal(columns: number[][], rhs: number[], prime: number, exponent: number): number[] | null {
  const modulus = prime ** exponent;
  const rows = rhs.length;
  const cols = columns.length;
  const matrix = Array.from({ length: rows }, (_, row) => columns.map(column => mod(column[row], modulus)));
  const b = rhs.map(value => mod(value, modulus));
  const q: number[][] = Array.from({ length: cols }, (_, row) =>
    Array.from({ length: cols }, (_, col) => (row === col ? 1 : 0))
  );
  const valuation = (value: number) => {
    if (value === 0) return exponent;
    let count = 0;
    let rest = value;
    while (rest % prime === 0) {
      rest /= prime;
      count += 1;
    }
    return Math.min(count, exponent);
  };
  const inverse = (value: number) => {
    for (let candidate = 1; candidate < modulus; candidate += 1)
      if ((value * candidate) % modulus === 1) return candidate;
    return 1;
  };
  const diagonal: number[] = [];
  for (let k = 0; k < Math.min(rows, cols); k += 1) {
    let best = exponent;
    let bi = -1;
    let bj = -1;
    for (let i = k; i < rows; i += 1)
      for (let j = k; j < cols; j += 1) {
        const v = valuation(matrix[i][j]);
        if (v < best) {
          best = v;
          bi = i;
          bj = j;
        }
      }
    if (bi < 0) break;
    [matrix[k], matrix[bi]] = [matrix[bi], matrix[k]];
    [b[k], b[bi]] = [b[bi], b[k]];
    for (const row of matrix) [row[k], row[bj]] = [row[bj], row[k]];
    for (const row of q) [row[k], row[bj]] = [row[bj], row[k]];
    const unit = inverse(matrix[k][k] / prime ** best);
    matrix[k] = matrix[k].map(value => (value * unit) % modulus);
    b[k] = (b[k] * unit) % modulus;
    const pivot = prime ** best;
    for (let i = 0; i < rows; i += 1) {
      if (i === k || matrix[i][k] === 0) continue;
      const factor = matrix[i][k] / pivot;
      matrix[i] = matrix[i].map((value, index) => mod(value - factor * matrix[k][index], modulus));
      b[i] = mod(b[i] - factor * b[k], modulus);
    }
    for (let j = k + 1; j < cols; j += 1) {
      if (matrix[k][j] === 0) continue;
      const factor = matrix[k][j] / pivot;
      matrix[k][j] = 0;
      for (const row of q) row[j] = mod(row[j] - factor * row[k], modulus);
    }
    diagonal.push(pivot);
  }
  const y = new Array<number>(cols).fill(0);
  for (let i = 0; i < rows; i += 1) {
    if (i < diagonal.length) {
      if (b[i] % diagonal[i] !== 0) return null;
      y[i] = b[i] / diagonal[i];
    } else if (b[i] !== 0) return null;
  }
  return q.map(row => mod(row.reduce((sum, value, index) => sum + value * y[index], 0), modulus));
}

function solveMod12(columns: number[][], rhs: number[]): number[] | null {
  const mod3 = solveLocal(columns, rhs, 3, 1);
  const mod4 = solveLocal(columns, rhs, 2, 2);
  if (!mod3 || !mod4) return null;
  return mod3.map((value3, index) => {
    for (let candidate = 0; candidate < 12; candidate += 1)
      if (candidate % 3 === value3 && candidate % 4 === mod4[index]) return candidate;
    return 0;
  });
}

export function clockMoveToken(name: string, hours: number) {
  const amount = mod(hours, 12);
  if (amount === 0) return null;
  return amount <= 6 ? `${name}${amount}+` : `${name}${12 - amount}-`;
}

export type ClockSolution = { moves: string[] };

export function solveClock(model: ClockModel, dials: number[]): ClockSolution | null {
  const names = [...CLOCK_MOVE_NAMES];
  const frontOnly = solveMod12(
    names.map(name => model.front[name]),
    dials.map(value => -value)
  );
  if (frontOnly)
    return { moves: names.flatMap((name, index) => clockMoveToken(name, frontOnly[index]) ?? []) };

  const flipped = applyFlip(model.flip, dials);
  const columns = [
    ...names.map(name => permuteOnly(model.flip, model.front[name])),
    ...names.map(name => model.back[name]),
  ];
  const solution = solveMod12(columns, flipped.map(value => -value));
  if (!solution) return null;
  const front = names.flatMap((name, index) => clockMoveToken(name, solution[index]) ?? []);
  const back = names.flatMap((name, index) => clockMoveToken(name, solution[names.length + index]) ?? []);
  return { moves: [...front, "y2", ...back] };
}

export function invertClockAlgorithm(algorithm: string) {
  return algorithm
    .split(/\s+/)
    .filter(Boolean)
    .reverse()
    .map(move => (move.endsWith("+") ? `${move.slice(0, -1)}-` : move.endsWith("-") ? `${move.slice(0, -1)}+` : move))
    .join(" ");
}
