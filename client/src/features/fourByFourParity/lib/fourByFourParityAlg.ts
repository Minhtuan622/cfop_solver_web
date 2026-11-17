/**
 * The published 4×4 parity algorithms use M-slice notation ("M2", "M'").
 * cubing.js rejects M on even cubes ("Bad grip in move M") because the
 * middle layer is ambiguous there, so the playback path converts each
 * M token into the two inner slices turning like an L face:
 *   M   → "l r'"
 *   M'  → "l' r"
 *   M2  → "l2 r2"
 * Display (`<pre>`) keeps the published notation; only the player path
 * converts. Skewb/big-cube turns keep their order, so fastCube's usual
 * inverse rule (half turns self-inverse) applies after conversion.
 */
import { invertAlgorithm } from "@/lib/fastCube";

export function toCubingNotation(alg: string): string {
  return alg
    .split(/\s+/)
    .flatMap(token => {
      if (token === "M") return ["l", "r'"];
      if (token === "M'") return ["l'", "r"];
      if (token === "M2") return ["l2", "r2"];
      return [token];
    })
    .join(" ");
}

/** The scramble the player applies to show the case: inverse of the converted alg. */
export function fourByFourParityScrambleOf(alg: string): string {
  return invertAlgorithm(toCubingNotation(alg));
}
