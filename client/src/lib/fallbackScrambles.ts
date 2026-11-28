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

// Slots 0-11 are the top layer and 12-23 the bottom layer. A turn (a,b) moves the layers
// by a and b slots and the slice swaps slots 6-11 with slots 12-17, the same
// convention cubing's square1 puzzle uses.
export function squareOne(twists = 12) {
  const wrap = (slot: number) => ((slot % 12) + 12) % 12;
  // 0 and 1 are the two halves of a corner, 2 is an edge; the bottom layer
  // reads edge, corner, corner while the top reads corner, corner, edge.
  let kinds = Array.from({ length: 24 }, (_, slot) => (slot + (slot < 12 ? 0 : 2)) % 3);
  const steps: string[] = [];
  while (steps.length < twists) {
    const a = Math.floor(Math.random() * 12) - 5;
    const b = Math.floor(Math.random() * 12) - 5;
    if (a === 0 && b === 0) continue;
    const turned = kinds.map((kind, slot) =>
      slot < 12 ? kinds[wrap(slot - a)] : kinds[12 + wrap(slot - 12 - b)] ?? kind
    );
    // The slice may not cut through a corner in either layer.
    if ([0, 12].some(layer => turned[layer] === 1 || turned[layer + 6] === 1)) continue;
    kinds = turned.map((kind, slot) =>
      slot >= 6 && slot < 12 ? turned[slot + 6] : slot >= 12 && slot < 18 ? turned[slot - 6] : kind
    );
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
