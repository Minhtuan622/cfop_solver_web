/**
 * Notation helpers for the FTO L3T lane.
 *
 * The published 3-Look L3T algorithms are already in plain FTO face-turn
 * notation (120° turns, lowercase = wide) after the S/H macro expansion done
 * in `l3tData.ts`, so the only normalisation needed is dropping bracket
 * groupings printed by sources ("[U]" pre-AUFs — not used here, kept for
 * robustness).
 *
 * The inverse is computed token-wise instead of via `fastCube` because that
 * parser only understands the 3×3 facelet moves.
 */

/** Strip bracketed groupings printed by the source pages; keep move order. */
export function toCubingNotation(alg: string): string {
  return alg.replace(/[[\]{}]/g, " ").split(/\s+/).filter(Boolean).join(" ");
}

/** Token-wise inverse: reversed order, primes flipped, half turns kept. */
export function invertFtoL3tAlgorithm(alg: string): string {
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
export function ftoL3tScrambleOf(alg: string): string {
  return invertFtoL3tAlgorithm(alg);
}
