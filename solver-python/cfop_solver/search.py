"""Bounded IDA* and a compact exact pruning table for Cross."""
from __future__ import annotations

import base64
import time
from collections import deque
from functools import lru_cache
from itertools import combinations
from typing import Callable
import zlib

from .cube import Cube
from .f2l_symmetry import macros_for_slot
from .notation import inverse_move
from .predicates import (
    CROSS_SLOTS,
    F2L_ORDER,
    F2L_SLOTS,
    cross_solved,
    cross_solved_view,
    f2l_slots_solved,
    f2l_slot_solved,
    f2l_slot_solved_view,
)
from .validation import cubie_view, CubieView

FACE_MOVES = tuple(
    f + suffix for f in ("U", "R", "F", "D", "L", "B") for suffix in ("", "2", "'")
)
FACE_ORDER = {f: i for i, f in enumerate("URFDLB")}
F2L_PREP_MOVES = ("U", "U2", "U'", "R", "R2", "R'", "F", "F2", "F'")
F2L_MEET_DEPTH = 4
DIRECT_SEARCH_NODE_BUDGET = 5_000
CROSS_STATE_BITS = 5
CROSS_TABLE_SIZE = 1 << (CROSS_STATE_BITS * len(CROSS_SLOTS))
CROSS_UNSEEN = 255
CROSS_SLOT_INDEX = {piece: index for index, piece in enumerate(CROSS_SLOTS)}


def _same_axis(a: str, b: str) -> bool:
    return {a, b} in ({"U", "D"}, {"R", "L"}, {"F", "B"})


def allowed_after(previous: str | None, move: str) -> bool:
    if previous is None:
        return True
    a, b = previous[0], move[0]
    if a == b:
        return False
    # Opposite faces commute. Keep one canonical order to reduce duplicates.
    if _same_axis(a, b) and FACE_ORDER[a] > FACE_ORDER[b]:
        return False
    return True


@lru_cache(maxsize=1)
def _edge_move_maps():
    """source edge -> target edge and orientation delta for each face move."""
    maps = {}
    solved = cubie_view(Cube())
    for move in FACE_MOVES:
        moved = cubie_view(Cube().apply(move))
        source_to_target = [0] * 12
        source_delta = [0] * 12
        for target, source in enumerate(moved.edge_perm):
            source_to_target[source] = target
            source_delta[source] = moved.edge_ori[target]
        maps[move] = (tuple(source_to_target), tuple(source_delta))
    return maps


def _build_cross_pruning_table() -> bytearray:
    """Build the exact Cross distance table for release artifact generation.

    Each target edge is packed as ``position * 2 + orientation`` (five bits).
    This replaces millions of transient nested tuples and dictionary hashes
    with integer transitions and direct bytearray lookups.
    """
    # Goal uses the solved position of each tracked edge and zero orientation.
    goal = sum((piece << 1) << (CROSS_STATE_BITS * index) for index, piece in enumerate(CROSS_SLOTS))
    table = bytearray([CROSS_UNSEEN]) * CROSS_TABLE_SIZE
    table[goal] = 0
    queue = deque([goal])
    maps = tuple(_edge_move_maps().values())
    while queue:
        state = queue.popleft()
        depth = table[state]
        for source_to_target, source_delta in maps:
            next_state = 0
            for index in range(len(CROSS_SLOTS)):
                packed = (state >> (CROSS_STATE_BITS * index)) & 31
                pos, ori = packed >> 1, packed & 1
                next_packed = (source_to_target[pos] << 1) | (ori ^ source_delta[pos])
                next_state |= next_packed << (CROSS_STATE_BITS * index)
            if table[next_state] == CROSS_UNSEEN:
                table[next_state] = depth + 1
                queue.append(next_state)
    return table


@lru_cache(maxsize=1)
def cross_pruning_table() -> bytes:
    """Load the build-time generated exact Cross distance table."""
    from .cross_table import CROSS_TABLE_B85

    table = zlib.decompress(base64.b85decode(CROSS_TABLE_B85))
    if len(table) != CROSS_TABLE_SIZE:
        raise RuntimeError("Invalid generated Cross distance table")
    return table


def cubie_view_after(view: CubieView, move: str) -> CubieView:
    """Apply a face move to a cubie view without rebuilding facelets.

    Mirrors :func:`_tracked_after` so the transition matches the verified
    meet-in-the-middle coordinate, but tracks all 20 cubies instead of a
    subset.  This is the hot path inside :func:`ida_star`: recomputing
    :func:`cubie_view` from facelets (frozenset signatures, position lookups)
    dominates solve time, while a cubie-level transition is pure integer
    arithmetic.
    """
    cm, cd, em, ed = _cubie_move_maps()[move]
    new_cp = [0] * 8
    new_co = [0] * 8
    for pos in range(8):
        new_cp[cm[pos]] = view.corner_perm[pos]
        new_co[cm[pos]] = (view.corner_ori[pos] + cd[pos]) % 3
    new_ep = [0] * 12
    new_eo = [0] * 12
    for pos in range(12):
        new_ep[em[pos]] = view.edge_perm[pos]
        new_eo[em[pos]] = (view.edge_ori[pos] + ed[pos]) % 2
    return CubieView(tuple(new_cp), tuple(new_co), tuple(new_ep), tuple(new_eo))


def cross_key_from_view(view: CubieView) -> int:
    """Packed Cross coordinate computed straight from a cubie view."""
    result = 0
    for pos, piece in enumerate(view.edge_perm):
        index = CROSS_SLOT_INDEX.get(piece)
        if index is not None:
            packed = (pos << 1) | view.edge_ori[pos]
            result |= packed << (CROSS_STATE_BITS * index)
    return result


def cross_heuristic_view(view: CubieView) -> int:
    """Exact Cross distance from a cubie view (no facelet reconstruction)."""
    return cross_pruning_table()[cross_key_from_view(view)]


def piece_distance_view(view: CubieView, kind: str, piece: int, target_pos: int) -> int:
    """Single-piece distance from a cubie view (no facelet reconstruction)."""
    perm = view.corner_perm if kind == "corner" else view.edge_perm
    ori = view.corner_ori if kind == "corner" else view.edge_ori
    current_pos = perm.index(piece)
    return _single_piece_distances(kind)[target_pos][(current_pos, ori[current_pos])]


def cross_key(cube: Cube, view: CubieView | None = None) -> int:
    if view is None:
        view = cubie_view(cube)
    return cross_key_from_view(view)


def cross_heuristic(cube: Cube, view: CubieView | None = None) -> int:
    if view is None:
        view = cubie_view(cube)
    return cross_pruning_table()[cross_key_from_view(view)]


def _cross_after_key(state: int, source_to_target: tuple[int, ...], source_delta: tuple[int, ...]) -> int:
    """Advance only the packed Cross coordinate, avoiding 18 full Cube copies."""
    next_state = 0
    for index in range(len(CROSS_SLOTS)):
        packed = (state >> (CROSS_STATE_BITS * index)) & 31
        pos, ori = packed >> 1, packed & 1
        next_state |= ((source_to_target[pos] << 1) | (ori ^ source_delta[pos])) << (CROSS_STATE_BITS * index)
    return next_state


@lru_cache(maxsize=1)
def _cubie_move_maps():
    maps = {}
    for move in FACE_MOVES:
        moved = cubie_view(Cube().apply(move))
        corner_target = [0] * 8
        corner_delta = [0] * 8
        edge_target = [0] * 12
        edge_delta = [0] * 12
        for target, source in enumerate(moved.corner_perm):
            corner_target[source] = target
            corner_delta[source] = moved.corner_ori[target]
        for target, source in enumerate(moved.edge_perm):
            edge_target[source] = target
            edge_delta[source] = moved.edge_ori[target]
        maps[move] = (
            tuple(corner_target), tuple(corner_delta),
            tuple(edge_target), tuple(edge_delta),
        )
    return maps


@lru_cache(maxsize=2)
def _single_piece_distances(kind: str):
    size, ori_mod = (8, 3) if kind == "corner" else (12, 2)
    target_tables = []
    maps = _cubie_move_maps()
    for target_pos in range(size):
        goal = (target_pos, 0)
        table = {goal: 0}
        queue = deque([goal])
        while queue:
            state = queue.popleft()
            depth = table[state]
            pos, ori = state
            for move in FACE_MOVES:
                cm, cd, em, ed = maps[move]
                targets, deltas = (cm, cd) if kind == "corner" else (em, ed)
                next_state = (targets[pos], (ori + deltas[pos]) % ori_mod)
                if next_state not in table:
                    table[next_state] = depth + 1
                    queue.append(next_state)
        target_tables.append(table)
    return target_tables


def piece_distance(cube: Cube, kind: str, piece: int, target_pos: int, view: CubieView | None = None) -> int:
    if view is None:
        view = cubie_view(cube)
    perm = view.corner_perm if kind == "corner" else view.edge_perm
    ori = view.corner_ori if kind == "corner" else view.edge_ori
    current_pos = perm.index(piece)
    return _single_piece_distances(kind)[target_pos][(current_pos, ori[current_pos])]


def _piece_positions(view: CubieView) -> tuple[dict[int, int], dict[int, int]]:
    """Vị trí hiện tại của từng mảnh góc và cạnh, dựng một lần cho mỗi view.

    `piece_distance_view` tự tìm vị trí bằng `perm.index(piece)`; trong
    heuristic F2L có tới mười lần tra mỗi node, nên dựng sẵn hai bảng tra
    rẻ hơn nhiều so với quét lại danh sách vị trí mỗi lần.
    """
    return (
        {piece: pos for pos, piece in enumerate(view.corner_perm)},
        {piece: pos for pos, piece in enumerate(view.edge_perm)},
    )


def f2l_heuristic_view(view: CubieView, slot: str, preserved: tuple[str, ...]) -> int:
    """Cận cận dưới cho một cặp F2L, chỉ dùng cubie view."""
    corner_pos, edge_pos = F2L_SLOTS[slot]
    corner_positions, edge_positions = _piece_positions(view)
    corner_distances = _single_piece_distances("corner")
    edge_distances = _single_piece_distances("edge")

    def distance(kind: str, piece: int) -> int:
        if kind == "corner":
            pos = corner_positions[piece]
            return corner_distances[piece][(pos, view.corner_ori[pos])]
        pos = edge_positions[piece]
        return edge_distances[piece][(pos, view.edge_ori[pos])]

    values = [
        cross_heuristic_view(view),
        distance("corner", corner_pos),
        distance("edge", edge_pos),
    ]
    for old in preserved:
        old_corner, old_edge = F2L_SLOTS[old]
        values.append(distance("corner", old_corner))
        values.append(distance("edge", old_edge))
    return max(values)


def f2l_heuristic(cube: Cube, slot: str, preserved: tuple[str, ...], view: CubieView | None = None) -> int:
    if view is None:
        view = cubie_view(cube)
    return f2l_heuristic_view(view, slot, preserved)


def _f2l_goal(slot: str, preserved: tuple[str, ...]) -> Callable[[CubieView], bool]:
    """Điều kiện đạt của một cặp F2L, đọc thẳng từ cubie view."""
    return lambda candidate: cross_solved_view(candidate) and all(
        f2l_slot_solved_view(candidate, piece) for piece in preserved + (slot,)
    )



def _tracked_f2l_pieces(slot: str, preserved: tuple[str, ...]) -> tuple[tuple[str, int], ...]:
    """Cubies whose solved positions make up the active phase invariant."""
    tracked: list[tuple[str, int]] = [("edge", piece) for piece in CROSS_SLOTS]
    for name in preserved + (slot,):
        corner, edge = F2L_SLOTS[name]
        tracked.extend((("corner", corner), ("edge", edge)))
    return tuple(tracked)


def _tracked_coordinate(cube: Cube, tracked: tuple[tuple[str, int], ...]) -> int:
    """Pack tracked cubie positions/orientations into five bits per cubie."""
    view = cubie_view(cube)
    corner_pos = {piece: pos for pos, piece in enumerate(view.corner_perm)}
    edge_pos = {piece: pos for pos, piece in enumerate(view.edge_perm)}
    coordinate = 0
    for index, (kind, piece) in enumerate(tracked):
        if kind == "corner":
            pos = corner_pos[piece]
            packed = pos * 3 + view.corner_ori[pos]
        else:
            pos = edge_pos[piece]
            packed = pos * 2 + view.edge_ori[pos]
        coordinate |= packed << (CROSS_STATE_BITS * index)
    return coordinate


def _tracked_goal_coordinate(tracked: tuple[tuple[str, int], ...]) -> int:
    coordinate = 0
    for index, (kind, piece) in enumerate(tracked):
        packed = piece * (3 if kind == "corner" else 2)
        coordinate |= packed << (CROSS_STATE_BITS * index)
    return coordinate


def _tracked_after(
    coordinate: int, tracked: tuple[tuple[str, int], ...], move: str
) -> int:
    cm, cd, em, ed = _cubie_move_maps()[move]
    next_coordinate = 0
    for index, (kind, _piece) in enumerate(tracked):
        packed = (coordinate >> (CROSS_STATE_BITS * index)) & 31
        if kind == "corner":
            pos, orientation = divmod(packed, 3)
            next_packed = cm[pos] * 3 + ((orientation + cd[pos]) % 3)
        else:
            pos, orientation = divmod(packed, 2)
            next_packed = em[pos] * 2 + ((orientation + ed[pos]) % 2)
        next_coordinate |= next_packed << (CROSS_STATE_BITS * index)
    return next_coordinate


@lru_cache(maxsize=4)
def _f2l_reverse_frontier(
    tracked: tuple[tuple[str, int], ...]
) -> dict[int, tuple[int, str]]:
    """Build a radius-four reverse frontier from a solved F2L invariant."""
    goal = _tracked_goal_coordinate(tracked)
    frontier: dict[int, tuple[int, str]] = {goal: (goal, "")}
    queue = deque([(goal, 0, None)])
    while queue:
        state, depth, previous = queue.popleft()
        if depth == F2L_MEET_DEPTH:
            continue
        for move in FACE_MOVES:
            # Consecutive turns of one face collapse into a direct face turn.
            if previous and previous[0] == move[0]:
                continue
            candidate = _tracked_after(state, tracked, move)
            if candidate not in frontier:
                frontier[candidate] = (state, move)
                queue.append((candidate, depth + 1, move))
    return frontier


def _path_from_reverse_frontier(
    state: int, frontier: dict[int, tuple[int, str]]
) -> list[str]:
    moves: list[str] = []
    while True:
        parent, move = frontier[state]
        if not move:
            break
        moves.append(inverse_move(move))
        state = parent
    return moves


def _solve_f2l_meet_in_middle(
    cube: Cube, slot: str, preserved: tuple[str, ...], max_depth: int, node_budget: int = DIRECT_SEARCH_NODE_BUDGET, attempt_log: list[dict[str, object]] | None = None
) -> list[str] | None:
    """Join bounded forward/reverse F2L coordinate BFS frontiers.

    Equality in the coordinate captures only the Cross plus preserved/current
    F2L cubies. The candidate is then rechecked against the full invariant
    before returning, so untracked cubies cannot invalidate the transaction.
    """
    tracked = _tracked_f2l_pieces(slot, preserved)
    reverse = _f2l_reverse_frontier(tracked)
    start = _tracked_coordinate(cube, tracked)
    target_slots = preserved + (slot,)
    def record(status: str, nodes: int) -> None:
        if attempt_log is not None:
            attempt_log.append({"slots": list(target_slots), "nodes": nodes, "budget": node_budget, "depth": max_depth, "status": status})
    if start in reverse:
        direct = _path_from_reverse_frontier(start, reverse)
        if len(direct) <= max_depth:
            record("solved", 1)
            return direct

    queue = deque([(start, [], None)])
    visited = {start}
    forward_limit = min(F2L_MEET_DEPTH, max_depth)
    goal = _f2l_goal(slot, preserved)
    while queue:
        state, path, previous = queue.popleft()
        if len(path) == forward_limit:
            continue
        for move in FACE_MOVES:
            if previous and previous[0] == move[0]:
                continue
            candidate = _tracked_after(state, tracked, move)
            if candidate in visited:
                continue
            next_path = path + [move]
            if len(next_path) <= max_depth and candidate in reverse:
                solution = next_path + _path_from_reverse_frontier(candidate, reverse)
                if len(solution) <= max_depth and goal(cubie_view(cube.apply_many(solution))):
                    record("solved", len(visited))
                    return solution
            visited.add(candidate)
            if len(visited) >= node_budget:
                record("budget", len(visited))
                return None
            queue.append((candidate, next_path, move))
    record("no_solution", len(visited))
    return None


@lru_cache(maxsize=1)
def _f2l_prep_sequences() -> tuple[tuple[str, ...], ...]:
    """Short F2L extraction setups explored before a standard macro."""
    result: list[tuple[str, ...]] = [()]
    result.extend((move,) for move in F2L_PREP_MOVES)
    result.extend(
        (first, second)
        for first in F2L_PREP_MOVES
        for second in F2L_PREP_MOVES
        if allowed_after(first, second)
    )
    return tuple(result)


def _fast_f2l_slot(cube: Cube, slot: str, preserved: tuple[str, ...]) -> list[str] | None:
    """Try symmetry-generated F2L macros after short setups before IDA*.

    The database is canonical FR only; ``macros_for_slot`` derives the other
    three orientations by engine-verified y-conjugation.  Every candidate is
    still checked against the full Cross/preserved/current-slot invariant.
    """
    if preserved:
        return None
    goal = _f2l_goal(slot, preserved)
    for setup in _f2l_prep_sequences():
        pre = cube.apply_many(setup)
        for _case, macro in macros_for_slot(slot):
            moves = list(setup + macro)
            if goal(cubie_view(pre.apply_many(macro))):
                return moves
    return None


class SearchLimit(Exception):
    pass


def ida_star(
    start: CubieView,
    goal: Callable[[CubieView], bool],
    heuristic: Callable[[CubieView], int],
    max_depth: int,
    moves: tuple[str, ...] = FACE_MOVES,
    node_budget: int | None = None,
    time_budget_sec: float | None = None,
) -> list[str]:
    """Find a short path with IDA*, returning [] if already at goal.

    The implementation is deliberately bounded. A caller can retry with a
    larger max_depth or use a table-based phase solver.

    ``node_budget`` caps the number of dfs nodes expanded; ``time_budget_sec``
    caps wall-clock time.  Either budget being exceeded raises
    :class:`SearchLimit` with a structured message so callers can fall back to
    an alternative phase or report a clear error instead of running forever.

    The search runs on cubie views only: a node never materialises a ``Cube``,
    so the hot loop pays for one integer transition instead of a facelet copy
    plus a full cubie view rebuild.
    """
    if goal(start):
        return []
    bound = heuristic(start)
    path: list[str] = []
    visited: set[tuple[CubieView, int]] = set()
    nodes = 0
    start_time = time.monotonic() if time_budget_sec is not None else None
    time_check_interval = 1024

    def check_budget() -> None:
        nonlocal nodes
        nodes += 1
        if node_budget is not None and nodes > node_budget:
            raise SearchLimit(f"IDA* node budget {node_budget} exceeded")
        if (
            start_time is not None
            and nodes % time_check_interval == 0
            and time.monotonic() - start_time > time_budget_sec
        ):
            raise SearchLimit(f"IDA* time budget {time_budget_sec}s exceeded")

    def dfs(view: CubieView, depth: int, bound: int, previous: str | None):
        check_budget()
        estimate = depth + heuristic(view)
        if estimate > bound:
            return estimate
        if goal(view):
            return list(path)
        if depth == bound:
            return bound + 1
        minimum = 10**9
        for move in moves:
            if not allowed_after(previous, move):
                continue
            next_view = cubie_view_after(view, move)
            key = (next_view, depth + 1)
            if key in visited:
                continue
            visited.add(key)
            path.append(move)
            result = dfs(next_view, depth + 1, bound, move)
            path.pop()
            if isinstance(result, list):
                return result
            minimum = min(minimum, result)
        return minimum

    while bound <= max_depth:
        visited.clear()
        result = dfs(start, 0, bound, None)
        if isinstance(result, list):
            return result
        bound = max(bound + 1, result)
    raise SearchLimit(f"No solution found within depth {max_depth}")



def solve_cross(cube: Cube, max_depth: int = 12) -> list[str]:
    """Follow the exact Cross pruning table downhill to an optimal solution.

    Unlike F2L, Cross owns a compact complete coordinate table. Re-running
    IDA* after computing this exact distance wastes most of the phase time;
    a neighbor with distance one lower is always available until the goal.
    """
    table = cross_pruning_table()
    current = cube
    distance = table[cross_key(current)]
    if distance == CROSS_UNSEEN or distance > max_depth:
        raise SearchLimit(f"No Cross solution found within depth {max_depth}")

    solution: list[str] = []
    key = cross_key(current)
    maps = _edge_move_maps()
    while distance:
        for move in FACE_MOVES:
            source_to_target, source_delta = maps[move]
            next_key = _cross_after_key(key, source_to_target, source_delta)
            if table[next_key] == distance - 1:
                solution.append(move)
                current = current.apply(move)
                key = next_key
                distance -= 1
                break
        else:  # Defensive guard: an exact table must always descend.
            raise SearchLimit("Cross pruning table has no descending neighbor")
    return solution


def solve_f2l_slot(
    cube: Cube,
    slot: str,
    preserved: tuple[str, ...],
    max_depth: int = 12,
    node_budget: int | None = None,
    time_budget_sec: float | None = None,
) -> list[str]:
    fast = _fast_f2l_slot(cube, slot, preserved)
    if fast is not None:
        return fast

    bidirectional = _solve_f2l_meet_in_middle(cube, slot, preserved, max_depth)
    if bidirectional is not None:
        return bidirectional

    return ida_star(
        cubie_view(cube),
        _f2l_goal(slot, preserved),
        lambda view: f2l_heuristic_view(view, slot, preserved),
        max_depth,
        node_budget=node_budget,
        time_budget_sec=time_budget_sec,
    )


def solve_xcross(
    cube: Cube,
    max_depth: int = 8,
    preferred_slot: str | None = None,
    excluded_slots: tuple[str, ...] = (),
    node_budget: int = DIRECT_SEARCH_NODE_BUDGET,
    attempt_log: list[dict[str, object]] | None = None,
) -> tuple[str, list[str]]:
    """Find Cross plus the best single F2L slot without committing Cross first.

    Four bounded tracked-cubie meet-in-the-middle searches are attempted.  A
    candidate is accepted only after the full Cross+slot predicate is checked;
    the ranking is deterministic by HTM, then slot order, then notation.
    ``SearchLimit`` lets the caller fall back cleanly to the existing Cross
    pipeline in ``opening='auto'`` mode.
    """
    excluded = set(excluded_slots)
    if preferred_slot is not None and preferred_slot not in F2L_ORDER:
        raise ValueError(f"Unknown preferred XCross slot: {preferred_slot}")
    slots = tuple(slot for slot in F2L_ORDER if slot not in excluded)
    if not slots:
        raise SearchLimit("No XCross slots remain after exclusions")

    candidates: list[tuple[int, int, tuple[str, ...], str, list[str]]] = []
    for slot_index, slot in enumerate(slots):
        moves = _solve_f2l_meet_in_middle(cube, slot, (), max_depth, node_budget, attempt_log)
        if moves is None:
            continue
        if _f2l_goal(slot, ())(cubie_view(cube.apply_many(moves))):
            candidates.append((len(moves), slot_index, tuple(moves), slot, moves))
    if not candidates:
        raise SearchLimit(f"No XCross solution found within depth {max_depth}")
    preferred = [candidate for candidate in candidates if candidate[3] == preferred_slot]
    _length, _index, _notation, slot, moves = min(preferred or candidates)
    return slot, moves


def solve_xxcross(
    cube: Cube,
    max_depth: int = 8,
    preferred_slot: str | None = None,
    excluded_slots: tuple[str, ...] = (),
    node_budget: int = DIRECT_SEARCH_NODE_BUDGET,
    attempt_log: list[dict[str, object]] | None = None,
) -> tuple[tuple[str, str], list[str]]:
    """Find Cross plus two F2L slots in one bounded tracked-cubie search.

    The existing F2L meet-in-the-middle coordinate already represents Cross,
    preserved slots, and an active slot.  Passing one slot as ``preserved``
    makes its target include exactly Cross + a two-slot pair, without creating
    a dense XXCross pattern database.  A preferred slot must appear in the
    selected pair; exclusions are absolute.
    """
    excluded = set(excluded_slots)
    if preferred_slot is not None and preferred_slot not in F2L_ORDER:
        raise ValueError(f"Unknown preferred XXCross slot: {preferred_slot}")
    allowed = tuple(slot for slot in F2L_ORDER if slot not in excluded)
    pairs = tuple(combinations(allowed, 2))
    if preferred_slot is not None:
        pairs = tuple(pair for pair in pairs if preferred_slot in pair)
    if not pairs:
        raise SearchLimit("No XXCross slot pair remains after preferences/exclusions")

    candidates: list[tuple[int, tuple[int, int], tuple[str, ...], tuple[str, str], list[str]]] = []
    for pair in pairs:
        # The goal coordinate is Cross + pair[0] + pair[1], irrespective of
        # the apparent insertion order in the returned sequence.
        moves = _solve_f2l_meet_in_middle(cube, pair[1], (pair[0],), max_depth, node_budget, attempt_log)
        if moves is None:
            continue
        if f2l_slots_solved(cube.apply_many(moves), pair):
            rank = tuple(F2L_ORDER.index(slot) for slot in pair)
            candidates.append((len(moves), rank, tuple(moves), pair, moves))
    if not candidates:
        raise SearchLimit(f"No XXCross solution found within depth {max_depth}")
    _length, _rank, _notation, pair, moves = min(candidates)
    return pair, moves


def solve_xxxcross(
    cube: Cube,
    max_depth: int = 8,
    preferred_slot: str | None = None,
    excluded_slots: tuple[str, ...] = (),
    node_budget: int = DIRECT_SEARCH_NODE_BUDGET,
    attempt_log: list[dict[str, object]] | None = None,
) -> tuple[tuple[str, str, str], list[str]]:
    """Find Cross plus three F2L slots in one bounded tracked-cubie search.

    Four possible triples are formed from the F2L slots.  The existing compact
    tracked coordinate scales without a new table: pass the first two slots as
    ``preserved`` and the final slot as active.  This keeps the browser budget
    bounded at the same meet-in-the-middle radius used by XXCross.  A preferred
    slot must occur in the selected triple; exclusions are absolute.
    """
    excluded = set(excluded_slots)
    if preferred_slot is not None and preferred_slot not in F2L_ORDER:
        raise ValueError(f"Unknown preferred XXXCross slot: {preferred_slot}")
    allowed = tuple(slot for slot in F2L_ORDER if slot not in excluded)
    triples = tuple(combinations(allowed, 3))
    if preferred_slot is not None:
        triples = tuple(triple for triple in triples if preferred_slot in triple)
    if not triples:
        raise SearchLimit("No XXXCross slot triple remains after preferences/exclusions")

    candidates: list[tuple[int, tuple[int, int, int], tuple[str, ...], tuple[str, str, str], list[str]]] = []
    for triple in triples:
        moves = _solve_f2l_meet_in_middle(cube, triple[2], triple[:2], max_depth, node_budget, attempt_log)
        if moves is None:
            continue
        if f2l_slots_solved(cube.apply_many(moves), triple):
            rank = tuple(F2L_ORDER.index(slot) for slot in triple)
            candidates.append((len(moves), rank, tuple(moves), triple, moves))
    if not candidates:
        raise SearchLimit(f"No XXXCross solution found within depth {max_depth}")
    _length, _rank, _notation, triple, moves = min(candidates)
    return triple, moves


def solve_xxxxcross(
    cube: Cube,
    max_depth: int = 8,
    preferred_slot: str | None = None,
    excluded_slots: tuple[str, ...] = (),
    node_budget: int = DIRECT_SEARCH_NODE_BUDGET,
    attempt_log: list[dict[str, object]] | None = None,
) -> list[str]:
    """Find Cross plus all F2L slots in one bounded tracked-cubie search.

    XXXXCross is the completed first two layers.  The tracked coordinate remains
    exact for Cross plus all eight F2L cubies, while the bidirectional frontier
    remains bounded at radius four.  Preferences are accepted for a shared API
    but do not alter the only possible four-slot set; an excluded slot makes
    this opening impossible and triggers the normal fallback chain.
    """
    if preferred_slot is not None and preferred_slot not in F2L_ORDER:
        raise ValueError(f"Unknown preferred XXXXCross slot: {preferred_slot}")
    excluded = set(excluded_slots)
    if excluded:
        raise SearchLimit("XXXXCross requires all four F2L slots; exclusions trigger fallback")
    moves = _solve_f2l_meet_in_middle(cube, F2L_ORDER[-1], F2L_ORDER[:-1], max_depth, node_budget, attempt_log)
    if moves is None or not f2l_slots_solved(cube.apply_many(moves), F2L_ORDER):
        raise SearchLimit(f"No XXXXCross solution found within depth {max_depth}")
    return moves
