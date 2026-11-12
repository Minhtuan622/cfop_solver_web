"""Bộ đo bộ giải CFOP trên CPython — đối chiếu với scripts/bench-solver.mjs.

    python3 solver-python/bench_solver.py

In ra bảng: đề, đúng/sai, số nước, thời gian. Dùng cùng bộ đề cố định và
cùng tham số giải với worker trong trình duyệt.
"""
from __future__ import annotations

import json
import pathlib
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "solver-python"))

from cfop_solver.cube import Cube, SOLVED  # noqa: E402
from cfop_solver.notation import parse_moves  # noqa: E402
from cfop_solver.solver import solve  # noqa: E402

# Tham số giải giống hệt đường gọi của worker trong trình duyệt.
SOLVE_OPTIONS = {
    "last_layer": "auto",
    "cross_color": "U",
    "opening": "cross",
    "xcross_depth": 8,
    "xxcross_depth": 8,
    "xxxcross_depth": 8,
    "xxxxcross_depth": 8,
    "direct_node_budget": 5000,
    # Cùng ngân sách với đường gọi của worker trong trình duyệt.
    "time_budget_sec": 40,
    "node_budget": 400000,
}


def main() -> None:
    scrambles = json.loads((ROOT / "scripts" / "bench-scrambles.json").read_text())
    results = []
    for group in ("specified", "random"):
        for scramble in scrambles[group]:
            cube = Cube().apply_many(parse_moves(scramble))
            started = time.monotonic()
            solution = solve(cube, **SOLVE_OPTIONS)
            elapsed = time.monotonic() - started
            check = Cube().apply_many(parse_moves(scramble)).apply_many(solution.moves)
            solved = check.stickers == SOLVED
            results.append({"group": group, "scramble": scramble, "solved": solved, "seconds": elapsed, "moves": list(solution.moves)})
            status = "OK  " if solved else "SAI "
            print(f"{status} {elapsed:6.2f}s  {len(solution.moves):3} nước  {scramble}")

    solved_count = sum(1 for row in results if row["solved"])
    slowest = max(results, key=lambda row: row["seconds"])
    print(f"\n{solved_count}/{len(results)} đúng · chậm nhất {slowest['seconds']:.2f}s ({slowest['scramble']})")

    if "--json" in sys.argv:
        print(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
