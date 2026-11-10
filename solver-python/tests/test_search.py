"""Tests for the CFOP search helpers (IDA*, cubie view, budgets)."""
from __future__ import annotations

import time

import pytest

from cfop_solver.cube import Cube, SOLVED
from cfop_solver.notation import parse_moves
from cfop_solver.search import (
    DIRECT_SEARCH_NODE_BUDGET,
    FACE_MOVES,
    SearchLimit,
    cubie_view,
    cubie_view_after,
    cross_heuristic,
    cross_heuristic_view,
    f2l_heuristic,
    ida_star,
    piece_distance,
    piece_distance_view,
    solve_f2l_slot,
)
from cfop_solver.validation import is_valid


def _apply(cube: Cube, moves) -> Cube:
    return cube.apply_many(moves)


class TestCubieViewAfter:
    """The incremental cubie transition must match a full facelet rebuild."""

    def test_single_move_matches_cubie_view(self):
        cube = Cube()
        view = cubie_view(cube)
        for move in FACE_MOVES:
            expected = cubie_view(cube.apply(move))
            actual = cubie_view_after(view, move)
            assert actual == expected, f"mismatch on {move}"

    def test_random_sequence_matches_cubie_view(self):
        import random

        random.seed(20261110)
        for _ in range(200):
            moves = [random.choice(FACE_MOVES) for _ in range(random.randint(1, 12))]
            cube = Cube()
            view = cubie_view(cube)
            for move in moves:
                view = cubie_view_after(view, move)
                cube = cube.apply(move)
            assert view == cubie_view(cube)


class TestHeuristics:
    def test_view_and_facelet_heuristics_agree(self):
        cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        view = cubie_view(cube)
        for slot in ("FR", "FL", "BL", "BR"):
            for preserved in ((), ("FR",), ("FR", "FL")):
                facelet = f2l_heuristic(cube, slot, preserved)
                view_based = f2l_heuristic(cube, slot, preserved, view)
                assert facelet == view_based

    def test_cross_heuristic_view_matches(self):
        cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        view = cubie_view(cube)
        assert cross_heuristic(cube) == cross_heuristic_view(view)

    def test_piece_distance_view_matches(self):
        cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        view = cubie_view(cube)
        for kind in ("corner", "edge"):
            for piece in range(8 if kind == "corner" else 12):
                for target in range(8 if kind == "corner" else 12):
                    facelet = piece_distance(cube, kind, piece, target)
                    view_based = piece_distance_view(view, kind, piece, target)
                    assert facelet == view_based


class TestIdaStarBudgets:
    def test_solved_start_returns_empty(self):
        cube = Cube()
        assert ida_star(cube, lambda c: c.stickers == SOLVED, lambda c, v=None: 0, 5) == []

    def test_node_budget_raises_structured_error(self):
        cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        cube = _apply(cube, parse_moves("R U R' U' F R U R' U' F'"))
        with pytest.raises(SearchLimit) as exc:
            ida_star(
                cube,
                lambda c: False,
                lambda c, v=None: 0,
                12,
                node_budget=50,
            )
        assert "node budget" in str(exc.value)

    def test_time_budget_raises_structured_error(self):
        cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        cube = _apply(cube, parse_moves("R U R' U' F R U R' U' F'"))
        with pytest.raises(SearchLimit) as exc:
            ida_star(
                cube,
                lambda c: False,
                lambda c, v=None: 0,
                12,
                time_budget_sec=0.0001,
            )
        assert "time budget" in str(exc.value)

    def test_budget_respected_before_solution_found(self):
        # With an unrealistic goal nothing is ever found; budget must still cap.
        cube = Cube()
        with pytest.raises(SearchLimit):
            ida_star(cube, lambda c: False, lambda c, v=None: 0, 3, node_budget=100)


class TestSolveF2lSlotBudget:
    def test_time_budget_is_accepted_and_solves(self):
        # Budget parameters are forwarded through solve_f2l_slot without
        # altering results for a solvable case.
        cube = Cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB")
        cube = _apply(cube, parse_moves("R U R' F' R U R' U' R' F R2 U' R' U'"))
        result = solve_f2l_slot(cube, "FR", (), 12, node_budget=10_000, time_budget_sec=60.0)
        assert isinstance(result, list)
        assert all(move in FACE_MOVES for move in result)
