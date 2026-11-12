"""Thử nghiệm: thứ tự giải các cặp F2L nào là nhanh.

Mỗi cặp F2L được giải với một ngân sách thời gian; cặp nào vượt ngân sách
thì thứ tự đó bị loại. Mục đích: tìm ra cách chọn thứ tự sao cho không cặp
nào rơi vào trạng thái khó.

    python3 solver-python/experiment_f2l_order.py
"""
from __future__ import annotations

import itertools
import pathlib
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "solver-python"))

from cfop_solver.cube import Cube  # noqa: E402
from cfop_solver.notation import parse_moves  # noqa: E402
from cfop_solver.predicates import F2L_ORDER  # noqa: E402
from cfop_solver.search import SearchLimit, solve_f2l_slot  # noqa: E402
from cfop_solver.solver import _normalize_cross_orientation  # noqa: E402

SCRAMBLES = [
    "U L B2 L' F U2 B R2 B2 L2 R2 L U' R' F D U L D2 F'",
    "D' U2 R' D U R2 L D2 F' L U' D B' L D' L2 B' U2 L2 R2",
    "R U R' U' R' F R2 U' R' U' R U R' F' D L2 B2 U2 F2 L2 U'",
    "R' D' R2 U L2 D L U F2 R B2 F U L2 U' F D R' D2 R' D U'",
]

# Ngân sách cho một cặp F2L trong thí nghiệm.
SLOT_BUDGET_SEC = 3.0


def cross_phase(cube: Cube) -> Cube:
    from cfop_solver.search import solve_cross

    normalized, _rotation = _normalize_cross_orientation(cube, "U")
    return normalized.apply_many(solve_cross(normalized))


def try_order(cube: Cube, order: tuple[str, ...]) -> tuple[bool, float]:
    current = cube
    solved: list[str] = []
    total = 0.0
    for slot in order:
        started = time.monotonic()
        try:
            moves = solve_f2l_slot(current, slot, tuple(solved), 12, time_budget_sec=SLOT_BUDGET_SEC)
        except SearchLimit:
            return False, total + (time.monotonic() - started)
        total += time.monotonic() - started
        current = current.apply_many(moves)
        solved.append(slot)
    return True, total


def main() -> None:
    for scramble in SCRAMBLES:
        cube = cross_phase(Cube().apply_many(parse_moves(scramble)))
        print(f"\n=== {scramble}")
        results = []
        for order in itertools.permutations(F2L_ORDER):
            ok, elapsed = try_order(cube, order)
            results.append((ok, elapsed, order))
        passed = [row for row in results if row[0]]
        passed.sort(key=lambda row: row[1])
        print(f"  thứ tự vượt ngân sách {SLOT_BUDGET_SEC}s: {len(passed)}/{len(results)}")
        for ok, elapsed, order in passed[:6]:
            print(f"    {'->'.join(order)}: {elapsed:6.2f}s")
        if not passed:
            best = sorted(results, key=lambda row: row[1])[:3]
            for ok, elapsed, order in best:
                print(f"    (không đạt) {'->'.join(order)}: {elapsed:6.2f}s")


if __name__ == "__main__":
    main()
