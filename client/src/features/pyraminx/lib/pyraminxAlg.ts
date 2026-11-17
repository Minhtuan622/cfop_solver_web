/**
 * The fastCube `invertAlgorithm` is a 3×3 rule (half turns are their own
 * inverse). On the Pyraminx every face turn is 120°, so an unprimed double
 * turn (`R2`) is the *inverse* quarter turn, not a self-inverse 180° move:
 *   "R" ¹ → "R'" (same direction, exponent 2)
 *   "R'" ¹ → "R"  (exponent 1)
 *   "R2" ¹ → "R"  (exponent 1)
 *   "R2'" ¹ → "R2" (cubing.js parses `R2'` as one turn, exponent 1)
 * Skewb turns are 90°, so the 3×3 rule holds there — this helper is for the
 * Pyraminx only. It emits a scramble string for `Puzzle3DCanvas`, which is
 * parsed back by cubing.js.
 */
export function invertPyraminxAlgorithm(text: string): string {
  const tokens = text
    .replace(/[(),]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const invertToken = (raw: string): string => {
    const doublePrime = /^([RLUBrlubxyz])2'$/.exec(raw);
    if (doublePrime) return `${doublePrime[1]}2`; // exponent 1 → inverse exponent 2
    const double = /^([RLUBrlubxyz])2$/.exec(raw);
    if (double) return double[1]; // exponent 2 → inverse exponent 1
    if (raw.endsWith("'")) return raw.slice(0, -1);
    return `${raw}'`;
  };
  return tokens.reverse().map(invertToken).join(" ");
}
