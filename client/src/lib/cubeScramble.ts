const THREE_BY_THREE_FACES = ["U", "R", "F", "D", "L", "B"] as const;
const MOVE_SUFFIXES = ["", "2", "'"] as const;

function sameAxis(left?: string, right?: string) {
  if (!left || !right) return false;
  return (left === "U" || left === "D") === (right === "U" || right === "D")
    && (left === "R" || left === "L") === (right === "R" || right === "L");
}

/** Generates a valid provisional 3×3 scramble while native event scrambles load. */
export function randomThreeByThreeScramble(length = 20) {
  const moves: string[] = [];
  while (moves.length < length) {
    const face = THREE_BY_THREE_FACES[Math.floor(Math.random() * THREE_BY_THREE_FACES.length)];
    const previous = moves.at(-1)?.[0];
    const before = moves.at(-2)?.[0];
    if (face === previous || (previous && before && sameAxis(face, previous) && sameAxis(face, before))) continue;
    moves.push(face + MOVE_SUFFIXES[Math.floor(Math.random() * MOVE_SUFFIXES.length)]);
  }
  return moves.join(" ");
}
