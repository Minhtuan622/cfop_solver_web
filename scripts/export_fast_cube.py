"""Generate a TypeScript move-permutation table from the canonical CFOP cube model."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "cfop_solver"))

from cfop_solver.cube import MOVE_PERMS  # noqa: E402

output = ROOT / "cfop_solver_web" / "client" / "src" / "lib" / "fastCube.ts"
table = {move: list(perm) for move, perm in MOVE_PERMS.items()}
content = """/** Generated from cfop_solver/cube.py. Runs scramble previews without Pyodide. */
export const SOLVED_FAST_STATE = \"UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB\";
export const FAST_MOVE_PERMS: Record<string, number[]> = %s;

export function parseFastMoves(text: string): string[] {
  return text.replace(/[(),]/g, \" \").split(/\\s+/).filter(Boolean).map((raw) => {
    if (raw.endsWith(\"3'\")) return raw.slice(0, -2) + \"'\";
    if (raw.endsWith(\"3\")) return raw.slice(0, -1) + \"'\";
    return raw;
  });
}

export function stateFromScramble(text: string): string {
  let state = SOLVED_FAST_STATE;
  for (const move of parseFastMoves(text)) {
    const perm = FAST_MOVE_PERMS[move];
    if (!perm) throw new Error(`Unsupported move: ${move}`);
    const out = Array(54);
    for (let source = 0; source < 54; source += 1) out[perm[source]] = state[source];
    state = out.join(\"\");
  }
  return state;
}
""" % json.dumps(table, separators=(",", ":"))
output.write_text(content, encoding="utf-8")
print(f"Generated {output} with {len(table)} move permutations")
