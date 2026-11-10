"""End-to-end solver tests: correctness and time budget on fixed scrambles.

The two scrambles from the pre-release evaluation are included verbatim, plus
eight fixed-seed random scrambles.  Each solve must leave the cube solved and
complete within a generous time budget so the suite is not flaky on slow CI
runners; actual timings are printed so the <15 s CPython target can be tracked.
"""
from __future__ import annotations

import time

import pytest

from cfop_solver.cube import Cube, SOLVED
from cfop_solver.notation import parse_moves
from cfop_solver.solver import solve

# The two scrambles from the pre-release evaluation report (verbatim).
SPECIFIED_SCRAMBLES = [
    "U L B2 L' F U2 B R2 B2 L2 R2 L U' R' F D U L D2 F'",
    "D' U2 R' D U R2 L D2 F' L U' D B' L D' L2 B' U2 L2 R2",
]

# Fixed-seed random scrambles (deterministic across runs / CI).
RANDOM_SCRAMBLES = [
    "F' R' B' D' B2 F L2 R2 L' D' R2 B' D' B R' B2 L R F' U F2 U",
    "R' D' R2 U L2 D L U F2 R B2 F U L2 U' F D R' D2 R' D U'",
    "F D L' F U D' U D B R' L D' U' D' B R F' D U L2 B' R'",
    "R' F U2 L' R2 L R B' L D' R D R2 L R L2 U2 F2 B' D2 B D2",
    "L R' L' D F U2 L' R' B2 F2 R D' B D' L2 D' U D' R2 B' U' D2",
    "R L' D R D L F D2 B U' R' L D' B2 F L' B2 U D' B2 R B",
    "U' F2 B' R D' L2 D2 L' R2 D' U' L' B' D' R2 L' R' F' R2 U R' L2",
    "R' U2 F2 D2 R L' B F' U' R U L R2 L D2 F R' F D U' D F2",
]

ALL_SCRAMBLES = SPECIFIED_SCRAMBLES + RANDOM_SCRAMBLES

# Hard cap so a pathological case cannot hang the suite; the asserted budget.
TIME_BUDGET_SEC = 120.0


def _solve(scramble: str):
    cube = Cube()
    cube = cube.apply_many(parse_moves(scramble))
    start = time.monotonic()
    solution = solve(
        cube,
        last_layer="auto",
        cross_color="U",
        opening="cross",
        direct_node_budget=5000,
    )
    elapsed = time.monotonic() - start
    return solution, elapsed


@pytest.mark.parametrize("scramble", ALL_SCRAMBLES, ids=lambda s: s.replace(" ", "_")[:20])
def test_scrambles_are_solved_within_budget(scramble):
    solution, elapsed = _solve(scramble)
    # The whole cube must be solved after applying the returned algorithm.
    check = Cube()
    check = check.apply_many(parse_moves(scramble))
    check = check.apply_many(solution.moves)
    assert check.stickers == SOLVED, f"scramble not solved: {scramble}"
    # Time budget (target < 15 s on CPython; actual reported below).
    assert elapsed < TIME_BUDGET_SEC, f"too slow ({elapsed:.2f}s): {scramble}"
    print(f"\n  {elapsed:6.2f}s  {scramble}")


def test_time_budget_param_is_accepted():
    # The time_budget_sec parameter is forwarded through solve without
    # altering results for a solvable case.
    cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
    solution = solve(cube, last_layer="auto", cross_color="U", opening="cross", time_budget_sec=60.0)
    check = Cube()
    check = check.apply_many(solution.moves)
    assert check.stickers == SOLVED
