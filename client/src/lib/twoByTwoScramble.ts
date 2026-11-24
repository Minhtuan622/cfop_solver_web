type CubeMove = { cp: number[]; co: number[] };
const QUARTER: Record<"U" | "R" | "F", CubeMove> = {
  U: { cp: [3, 0, 1, 2, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0] },
  R: { cp: [4, 1, 2, 0, 7, 5, 6, 3], co: [2, 0, 0, 1, 1, 0, 0, 2] },
  F: { cp: [1, 5, 2, 3, 0, 4, 6, 7], co: [1, 2, 0, 0, 2, 1, 0, 0] },
};
const FACES = ["U", "R", "F"] as const;
const SUFFIXES = ["", "2", "'"] as const;
const MOVE_NAMES = FACES.flatMap(face => SUFFIXES.map(suffix => face + suffix));

function multiply(a: CubeMove, b: CubeMove): CubeMove {
  return {
    cp: b.cp.map(index => a.cp[index]),
    co: b.co.map((twist, i) => (a.co[b.cp[i]] + twist) % 3),
  };
}

const FREE = [0, 1, 2, 3, 4, 5, 7];
const FACT = [1, 1, 2, 6, 24, 120, 720, 5040];
const N_PERM = 5040;
const N_ORI = 729;

function encodePerm(cp: number[]): number {
  const pieces = FREE.map(position => cp[position]);
  let rank = 0;
  for (let i = 0; i < 7; i += 1) {
    let smaller = 0;
    for (let j = i + 1; j < 7; j += 1) if (pieces[j] < pieces[i]) smaller += 1;
    rank += smaller * FACT[6 - i];
  }
  return rank;
}
function decodePerm(rank: number): number[] {
  const remaining = [...FREE];
  const cp = [0, 1, 2, 3, 4, 5, 6, 7];
  for (let i = 0; i < 7; i += 1) {
    const index = Math.floor(rank / FACT[6 - i]);
    rank %= FACT[6 - i];
    cp[FREE[i]] = remaining.splice(index, 1)[0];
  }
  return cp;
}
function encodeOri(co: number[]): number {
  let value = 0;
  for (let i = 0; i < 6; i += 1) value = value * 3 + co[i];
  return value;
}
function decodeOri(value: number): number[] {
  const co = [0, 0, 0, 0, 0, 0, 0, 0];
  let sum = 0;
  for (let i = 5; i >= 0; i -= 1) {
    co[i] = value % 3;
    sum += co[i];
    value = Math.floor(value / 3);
  }
  co[7] = (3 - (sum % 3)) % 3;
  return co;
}

type Tables = { perm: Uint16Array; ori: Uint16Array; dist: Uint8Array };
let tables: Tables | null = null;

export function twoByTwoTables(): Tables {
  if (tables) return tables;
  const moves = FACES.flatMap(face => {
    const once = QUARTER[face];
    const twice = multiply(once, once);
    return [once, twice, multiply(twice, once)];
  });
  const identity = (): CubeMove => ({ cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0] });
  const perm = new Uint16Array(N_PERM * 9);
  for (let p = 0; p < N_PERM; p += 1) {
    const state = { ...identity(), cp: decodePerm(p) };
    moves.forEach((move, m) => (perm[p * 9 + m] = encodePerm(multiply(state, move).cp)));
  }
  const ori = new Uint16Array(N_ORI * 9);
  for (let o = 0; o < N_ORI; o += 1) {
    const state = { ...identity(), co: decodeOri(o) };
    moves.forEach((move, m) => (ori[o * 9 + m] = encodeOri(multiply(state, move).co)));
  }
  const total = N_PERM * N_ORI;
  const dist = new Uint8Array(total).fill(255);
  const queue = new Uint32Array(total);
  dist[0] = 0;
  let head = 0;
  let tail = 1;
  while (head < tail) {
    const index = queue[head++];
    const p = Math.floor(index / N_ORI);
    const o = index % N_ORI;
    const next = dist[index] + 1;
    for (let m = 0; m < 9; m += 1) {
      const target = perm[p * 9 + m] * N_ORI + ori[o * 9 + m];
      if (dist[target] === 255) {
        dist[target] = next;
        queue[tail++] = target;
      }
    }
  }
  tables = { perm, ori, dist };
  return tables;
}

function optimalSolution(index: number, t: Tables): number[] {
  const path: number[] = [];
  let p = Math.floor(index / N_ORI);
  let o = index % N_ORI;
  let distance = t.dist[index];
  while (distance > 0) {
    const lastFace = path.length ? Math.floor(path[path.length - 1] / 3) : -1;
    let advanced = false;
    for (let m = 0; m < 9 && !advanced; m += 1) {
      if (Math.floor(m / 3) === lastFace) continue;
      const np = t.perm[p * 9 + m];
      const no = t.ori[o * 9 + m];
      if (t.dist[np * N_ORI + no] === distance - 1) {
        path.push(m);
        p = np;
        o = no;
        distance -= 1;
        advanced = true;
      }
    }
    if (!advanced) throw new Error("2×2 distance table is inconsistent");
  }
  return path;
}

const inverseName = (m: number) => MOVE_NAMES[Math.floor(m / 3) * 3 + (2 - (m % 3))];

export function twoByTwoDistance(scramble: string): number {
  const t = twoByTwoTables();
  let p = 0;
  let o = 0;
  for (const move of scramble.split(/\s+/).filter(Boolean)) {
    const m = MOVE_NAMES.indexOf(move);
    if (m < 0) throw new Error(`Unsupported 2×2 move: ${move}`);
    p = t.perm[p * 9 + m];
    o = t.ori[o * 9 + m];
  }
  return t.dist[p * N_ORI + o];
}

export function randomTwoByTwoScramble(random: () => number = Math.random): string {
  const t = twoByTwoTables();
  for (;;) {
    const index = Math.floor(random() * N_PERM) * N_ORI + Math.floor(random() * N_ORI);
    if (t.dist[index] < 4) continue;
    return optimalSolution(index, t).reverse().map(inverseName).join(" ");
  }
}
