"""CFOP phase solvers.

Cross/F2L use bounded search. OLL/PLL use standard 2-look macro sets and
search over AUF plus verified algorithms. Every returned sequence is checked
against its phase postcondition by the pipeline.
"""
from __future__ import annotations

from collections import deque

from .cube import Cube
from .notation import parse_moves
from .predicates import (
    F2L_ORDER,
    U_CORNERS,
    U_EDGES,
    cube_solved,
    f2l_solved,
    oll_solved,
    pll_solved,
)
from .search import FACE_MOVES, SearchLimit, solve_cross, solve_f2l_slot, ida_star
from .validation import cubie_view


def _alg(text: str) -> tuple[str, ...]:
    return tuple(parse_moves(text))


AUF = {
    "U": _alg("U"),
    "U'": _alg("U'"),
    "U2": _alg("U2"),
}

# Two-look OLL edge orientation algorithms. These are the standard line and
# L cases; repeated with AUF they cover dot/line/L edge patterns.
OLL_EDGE_ALGS = {
    "line": _alg("F R U R' U' F'"),
    "l": _alg("F U R U' R' F'"),
}

# Sune and anti-Sune orient last-layer corners while preserving F2L.
OLL_CORNER_ALGS = {
    "sune": _alg("R U R' U R U2 R'"),
    "antisune": _alg("R U2 R' U' R U' R'"),
}

# 2-look PLL: A/E permutations for corners, then Ua/Ub/H/Z for edges.
PLL_CORNER_ALGS = {
    "Aa": _alg("x R' U R' D2 R U' R' D2 R2 x'"),
    "Ab": _alg("x R2 D2 R U R' D2 R U' R x'"),
    "E": _alg("x' R U' R' D R U R' D' R U R' D R U' R' D' x"),
}
PLL_EDGE_ALGS = {
    "Ua": _alg("M2 U M U2 M' U M2"),
    "Ub": _alg("M2 U' M U2 M' U' M2"),
    "H": _alg("M2 U M2 U2 M2 U M2"),
    "Z": _alg("M2 U M2 U M' U2 M2 U2 M' U2"),
}


def apply_macro(cube: Cube, macro: tuple[str, ...]) -> Cube:
    return cube.apply_many(macro)


def macro_search(
    start: Cube,
    goal,
    macros: dict[str, tuple[str, ...]],
    max_depth: int,
) -> list[str]:
    if goal(start):
        return []
    queue = deque([(start, [])])
    visited = {start.stickers}
    while queue:
        cube, path = queue.popleft()
        if len(path) >= max_depth:
            continue
        for name, macro in macros.items():
            candidate = apply_macro(cube, macro)
            if candidate.stickers in visited:
                continue
            visited.add(candidate.stickers)
            new_path = path + [name]
            if goal(candidate):
                out: list[str] = []
                for macro_name in new_path:
                    out.extend(macros[macro_name])
                return out
            queue.append((candidate, new_path))
    raise SearchLimit(f"No macro solution within depth {max_depth}")


def oll_edge_goal(cube: Cube) -> bool:
    if not f2l_solved(cube):
        return False
    view = cubie_view(cube)
    return all(view.edge_ori[p] == 0 for p in U_EDGES)


def oll_corner_goal(cube: Cube) -> bool:
    return oll_solved(cube)


def solve_oll(cube: Cube, macro_depth: int = 5) -> list[str]:
    if not f2l_solved(cube):
        raise ValueError("OLL requires Cross and all F2L slots solved")
    edge_macros = {**AUF, **OLL_EDGE_ALGS}
    edge_moves = macro_search(cube, oll_edge_goal, edge_macros, macro_depth)
    after_edges = cube.apply_many(edge_moves)
    corner_macros = {**AUF, **OLL_CORNER_ALGS}
    corner_moves = macro_search(after_edges, oll_corner_goal, corner_macros, macro_depth)
    result = edge_moves + corner_moves
    after = cube.apply_many(result)
    if not oll_solved(after):
        raise SearchLimit("OLL macro tables did not reach OLL goal")
    return result


def solve_pll(cube: Cube, macro_depth: int = 5) -> list[str]:
    if not oll_solved(cube):
        raise ValueError("PLL requires OLL solved")
    corner_macros = {**AUF, **PLL_CORNER_ALGS}
    corner_moves = macro_search(cube, _corner_perm_goal, corner_macros, macro_depth)
    after_corners = cube.apply_many(corner_moves)
    edge_macros = {**AUF, **PLL_EDGE_ALGS}
    edge_moves = macro_search(after_corners, cube_solved, edge_macros, macro_depth)
    result = corner_moves + edge_moves
    if not cube_solved(cube.apply_many(result)):
        raise SearchLimit("PLL macro tables did not reach solved goal")
    return result


def _corner_perm_goal(cube: Cube) -> bool:
    if not oll_solved(cube):
        return False
    view = cubie_view(cube)
    return view.corner_perm[:4] == (0, 1, 2, 3)


def solve_cfop_phases(cube: Cube, cross_depth: int = 12, f2l_depth: int = 12):
    """Yield phase name, moves, and resulting cube in strict CFOP order."""
    current = cube
    cross = solve_cross(current, max_depth=cross_depth)
    current = current.apply_many(cross)
    yield "cross", cross, current

    solved_slots: list[str] = []
    for slot in F2L_ORDER:
        moves = solve_f2l_slot(current, slot, tuple(solved_slots), max_depth=f2l_depth)
        current = current.apply_many(moves)
        yield f"f2l_{slot}", moves, current
        solved_slots.append(slot)

    oll = solve_oll(current)
    current = current.apply_many(oll)
    yield "oll", oll, current

    pll = solve_pll(current)
    current = current.apply_many(pll)
    yield "pll", pll, current

    if not cube_solved(current):
        raise SearchLimit("CFOP pipeline ended without solved cube")
