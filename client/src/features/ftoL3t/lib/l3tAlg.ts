/**
 * Notation helpers for the FTO L3T lane.
 *
 * The lane stores and displays the sheet's exact notation (see
 * `l3tData.ts`): braces {…} are puzzle rotations and S/H are macros.
 * `expandSheetAlgorithm` produces the macro-free face-turn sequence a
 * fixed-frame machine could apply:
 *   - brace tokens (puzzle rotations) are dropped,
 *   - S/S' expand to R' L R L' / L R' L' R, H/H' to R U' R' U / U' R U R',
 *   - R2' is normalised to R2 (a double turn).
 * The expanded form is used for machine checks; the app displays the
 * published algorithm unchanged.
 */

/** Strip the sheet's macro notation and rotations; keep the face turns. */
export function expandSheetAlgorithm(alg: string): string {
  const macros: Record<string, string> = {
    S: "R' L R L'",
    "S'": "L R' L' R",
    H: "R U' R' U",
    "H'": "U' R U R'",
  };
  return alg
    .split(/\s+/)
    .filter(token => !/^\{[A-Za-z]{1,2},[A-Za-z]{1,2}\}$/.test(token))
    .map(token => macros[token] ?? token)
    .join(" ")
    .replace(/R2'/g, "R2")
    .replace(/\s+/g, " ")
    .trim();
}
