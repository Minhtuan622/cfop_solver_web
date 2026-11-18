/**
 * Notation helpers for the 5×5 L2E lane.
 *
 * 5×5×5 is an odd-dimension cube, so middle-slice turns (M/E/S) and
 * inner/wide turns are all legal as written — no M→"l r'" conversion like
 * the 4×4 lane needs. The only normalisation is dropping the "(…)" grouping
 * parentheses the sources print around cue moves.
 *
 * The inverse is computed token-wise instead of via `fastCube` because that
 * parser only understands the 3×3 facelet moves ("3Rw" and friends are not
 * supported there — and would crash the practice card).
 */

/** Strip grouping parentheses printed by the source pages; keep move order. */
export function toCubingNotation(alg: string): string {
  return alg.replace(/[()]/g, " ").split(/\s+/).filter(Boolean).join(" ");
}

/** Token-wise inverse: reversed order, primes flipped, half turns kept. */
export function invertFiveByFiveL2EAlgorithm(alg: string): string {
  return toCubingNotation(alg)
    .split(" ")
    .reverse()
    .map(token => {
      if (token.endsWith("2")) return token;
      return token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
    })
    .join(" ");
}

/** The move sequence that presents the case: inverse of the converted alg. */
export function fiveByFiveL2EScrambleOf(alg: string): string {
  return invertFiveByFiveL2EAlgorithm(alg);
}
