import { randomThreeByThreeScramble } from "./cubeScramble";

const pick = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)];
const SUFFIXES = ["", "2", "'"] as const;

type AxisMove = { name: string; axis: number; rank: number };

function cubeMoves(length: number, moves: readonly AxisMove[]) {
  const result: string[] = [];
  let sameAxis: AxisMove[] = [];
  while (result.length < length) {
    const move = pick(moves);
    const last = sameAxis.at(-1);
    if (last && move.axis === last.axis && move.rank <= last.rank) continue;
    if (!last || move.axis !== last.axis) sameAxis = [];
    sameAxis.push(move);
    result.push(move.name + pick(SUFFIXES));
  }
  return result.join(" ");
}

const AXIS: Record<string, number> = { U: 0, D: 0, R: 1, L: 1, F: 2, B: 2 };
function layerMove(face: string, layers: number): AxisMove {
  const name = layers === 1 ? face : layers === 2 ? `${face}w` : `${layers}${face}w`;
  const sideRank = "URF".includes(face) ? 0 : 10;
  return { name, axis: AXIS[face], rank: sideRank + layers };
}
const faces = (list: string, layers: number) =>
  [...list].map(face => layerMove(face, layers));

const NXN_MOVES = {
  "2": faces("URF", 1),
  "4": [...faces("URFDLB", 1), ...faces("URF", 2)],
  "5": [...faces("URFDLB", 1), ...faces("URFDLB", 2)],
  "6": [...faces("URFDLB", 1), ...faces("URFDLB", 2), ...faces("URF", 3)],
  "7": [...faces("URFDLB", 1), ...faces("URFDLB", 2), ...faces("URFDLB", 3)],
};

function bldOrientation(xMove: string, yMove: string) {
  return [xMove, yMove]
    .map(move => {
      const suffix = pick(["", "", "2", "'"]);
      return suffix === "" && Math.random() < 0.5 ? "" : move + suffix;
    })
    .filter(Boolean)
    .join(" ");
}
const withSuffix = (scramble: string, suffix: string) =>
  suffix ? `${scramble} ${suffix}` : scramble;

function megaminx() {
  return Array.from({ length: 7 }, () => {
    const line = Array.from({ length: 10 }, (_, index) =>
      `${index % 2 ? "D" : "R"}${pick(["++", "--"])}`
    );
    return [...line, pick(["U", "U'"])].join(" ");
  }).join("\n");
}

function pyraminx() {
  const body: string[] = [];
  while (body.length < 10) {
    const face = pick(["U", "L", "R", "B"]);
    if (body.at(-1)?.[0] === face) continue;
    body.push(face + pick(["", "'"]));
  }
  const tips = ["u", "l", "r", "b"]
    .map(tip => pick(["", tip, `${tip}'`]))
    .filter(Boolean);
  return [...body, ...tips].join(" ");
}

function skewb() {
  const moves: string[] = [];
  while (moves.length < 11) {
    const face = pick(["R", "U", "L", "B"]);
    if (moves.at(-1)?.[0] === face) continue;
    moves.push(face + pick(["", "'"]));
  }
  return moves.join(" ");
}

function clock() {
  const turn = (pin: string) => {
    const value = Math.floor(Math.random() * 12) - 5;
    return `${pin}${Math.abs(value)}${value < 0 ? "-" : "+"}`;
  };
  const front = ["UR", "DR", "DL", "UL", "U", "R", "D", "L", "ALL"].map(turn);
  const back = ["U", "R", "D", "L", "ALL"].map(turn);
  return [...front, "y2", ...back].join(" ");
}

export function squareOne(twists = 12) {
  let top = [0, 1, 1, 2, 3, 3, 4, 5, 5, 6, 7, 7];
  let bottom = [8, 9, 9, 10, 11, 11, 12, 13, 13, 14, 15, 15];
  const rotate = (layer: number[], amount: number) =>
    layer.map((_, index) => layer[(((index - amount) % 12) + 12) % 12]);
  const canSlice = (layer: number[]) =>
    layer[11] !== layer[0] && layer[5] !== layer[6];
  const steps: string[] = [];
  while (steps.length < twists) {
    const a = Math.floor(Math.random() * 12) - 5;
    const b = Math.floor(Math.random() * 12) - 5;
    if (a === 0 && b === 0) continue;
    const nextTop = rotate(top, a);
    const nextBottom = rotate(bottom, b);
    if (!canSlice(nextTop) || !canSlice(nextBottom)) continue;
    top = [...nextBottom.slice(0, 6).reverse(), ...nextTop.slice(6)];
    bottom = [...nextTop.slice(0, 6).reverse(), ...nextBottom.slice(6)];
    steps.push(`(${a},${b})/`);
  }
  return steps.join(" ");
}

function fto() {
  const moves: string[] = [];
  while (moves.length < 30) {
    const face = pick(["U", "F", "R", "L", "D", "B", "BR", "BL"]);
    if (moves.at(-1)?.replace("'", "") === face) continue;
    moves.push(face + pick(["", "'"]));
  }
  return moves.join(" ");
}

export function fallbackScramble(eventId: string): string {
  switch (eventId) {
    case "222":
      return cubeMoves(11, NXN_MOVES["2"]);
    case "333":
    case "333oh":
    case "333mbf":
      return randomThreeByThreeScramble();
    case "333bf":
      return withSuffix(randomThreeByThreeScramble(), bldOrientation("Rw", "Uw"));
    case "333fm":
      return `R' U' F ${randomThreeByThreeScramble(20)} R' U' F`;
    case "444":
      return cubeMoves(40, NXN_MOVES["4"]);
    case "444bf":
      return withSuffix(cubeMoves(40, NXN_MOVES["4"]), bldOrientation("x", "y"));
    case "555":
      return cubeMoves(60, NXN_MOVES["5"]);
    case "555bf":
      return withSuffix(cubeMoves(60, NXN_MOVES["5"]), bldOrientation("3Rw", "3Uw"));
    case "666":
      return cubeMoves(80, NXN_MOVES["6"]);
    case "777":
      return cubeMoves(100, NXN_MOVES["7"]);
    case "pyram":
      return pyraminx();
    case "skewb":
      return skewb();
    case "minx":
      return megaminx();
    case "sq1":
      return squareOne();
    case "clock":
      return clock();
    case "fto":
      return fto();
    default:
      return randomThreeByThreeScramble();
  }
}
