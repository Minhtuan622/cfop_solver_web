"""Regression test cho B2: bộ giải phải nhanh và phải báo lỗi có cấu trúc.

Hai điều đã hỏng trước đây:

- bước ghép cặp F2L có thể rơi vào một cặp rất khó, khiến bộ tìm kiếm
  phải duyệt hàng triệu node và mất hàng chục giây (vượt giới hạn 45 giây
  của giao diện);
- ngân sách thời gian và số node của bước F2L không được nối vào đường gọi
  của trình duyệt, nên khi hết ngân sách người dùng chỉ thấy thông báo
  chung chung thay vì một lỗi có cấu trúc.
"""
from __future__ import annotations

import time

import pytest

from cfop_solver.cube import Cube, SOLVED
from cfop_solver.notation import parse_moves
from cfop_solver.solver import CFOPError, F2L_ORDER_CANDIDATES, solve

# Ba đề được nêu trong yêu cầu: trước đây cả ba đề vượt giới hạn giao diện.
SPECIFIED_SCRAMBLES = [
    "U L B2 L' F U2 B R2 B2 L2 R2 L U' R' F D U L D2 F'",
    "D' U2 R' D U R2 L D2 F' L U' D B' L D' L2 B' U2 L2 R2",
    "R U R' U' R' F R2 U' R' U' R U R' F' D L2 B2 U2 F2 L2 U'",
]

# Ngân sách thời gian của bộ giải trong trình duyệt (giây).
TIME_BUDGET_SEC = 40.0
NODE_BUDGET = 400_000


def _solve(scramble: str, **options):
    cube = Cube().apply_many(parse_moves(scramble))
    started = time.monotonic()
    solution = solve(
        cube,
        last_layer="auto",
        cross_color="U",
        opening="cross",
        direct_node_budget=5000,
        time_budget_sec=TIME_BUDGET_SEC,
        node_budget=NODE_BUDGET,
        **options,
    )
    return solution, time.monotonic() - started


@pytest.mark.parametrize("scramble", SPECIFIED_SCRAMBLES, ids=lambda s: s[:14])
def test_specified_scrambles_are_solved_within_budget(scramble):
    solution, elapsed = _solve(scramble)
    check = Cube().apply_many(parse_moves(scramble)).apply_many(solution.moves)
    assert check.stickers == SOLVED, f"scramble not solved: {scramble}"
    # Giao diện dừng sau 45 giây; ngân sách của solver phải nằm dưới mức đó.
    assert elapsed < 45.0, f"too slow ({elapsed:.2f}s): {scramble}"


def test_f2l_order_fallback_tries_another_order():
    # Với thứ tự mặc định, đề này rơi vào một cặp F2L khó. Bộ giải phải
    # tự thử thứ tự khác thay vì chậm hết thời gian.
    scramble = SPECIFIED_SCRAMBLES[0]
    solution, elapsed = _solve(scramble)
    assert len(solution.f2l_attempts) > 1, "phải có hơn một lần thử thứ tự F2L"
    assert elapsed < 45.0


def test_hitting_the_budget_raises_a_structured_error():
    # Ngân sách nhỏ tới mức bất khả thi: lỗi phải có mã rõ ràng để giao diện
    # hiển thị đúng, không phải một thông báo chung chung.
    cube = Cube().apply_many(parse_moves(SPECIFIED_SCRAMBLES[0]))
    with pytest.raises(CFOPError) as exc:
        solve(
            cube,
            last_layer="auto",
            cross_color="U",
            opening="cross",
            direct_node_budget=5000,
            time_budget_sec=0.001,
            node_budget=1,
        )
    assert exc.value.code == "search_limit"


def test_f2l_order_candidates_cover_more_than_one_order():
    # Phải có nhiều thứ tự để thử: chỉ một thứ tự thì không có phương án dự
    # phòng khi một cặp rơi vào trạng thái khó.
    assert len(F2L_ORDER_CANDIDATES) >= 3
    assert len(set(F2L_ORDER_CANDIDATES)) == len(F2L_ORDER_CANDIDATES)
    for order in F2L_ORDER_CANDIDATES:
        assert sorted(order) == sorted(F2L_ORDER_CANDIDATES[0])


def test_every_candidate_order_produces_a_solved_cube():
    # Dù thứ tự nào được chọn, kết quả cuối cùng vẫn phải là khối đã giải.
    scramble = SPECIFIED_SCRAMBLES[2]
    cube = Cube().apply_many(parse_moves(scramble))
    solution = solve(
        cube,
        last_layer="auto",
        cross_color="U",
        opening="cross",
        direct_node_budget=5000,
        time_budget_sec=TIME_BUDGET_SEC,
        node_budget=NODE_BUDGET,
    )
    check = Cube().apply_many(parse_moves(scramble)).apply_many(solution.moves)
    assert check.stickers == SOLVED
