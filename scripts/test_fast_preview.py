"""Verify the generated browser move table against the canonical Python cube model."""
from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "cfop_solver"))
from cfop_solver import Cube, parse_moves  # noqa: E402

SCRAMBLE = "B L R B2 U2 R U2 L F2 R F2 D' R F U' R F L2 R"
source = (ROOT / "cfop_solver_web" / "client" / "src" / "lib" / "fastCube.ts").read_text(encoding="utf-8")
match = re.search(r"FAST_MOVE_PERMS: Record<string, number\[]> = (\{.*?\});\n\nexport function", source, re.S)
if not match:
    raise RuntimeError("Could not read FAST_MOVE_PERMS from generated TypeScript")
table = json.loads(match.group(1))

state = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"
for move in parse_moves(SCRAMBLE):
    perm = table[move]
    output = [""] * 54
    for index, target in enumerate(perm):
        output[target] = state[index]
    state = "".join(output)

expected = Cube().apply_many(parse_moves(SCRAMBLE)).stickers
assert state == expected, "Frontend permutation state diverges from Python solver state"
print(f"Fast preview verified for {len(parse_moves(SCRAMBLE))} moves: {state}")
