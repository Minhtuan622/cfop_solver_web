"""Public CFOP solver API with phase transactions and invariant checks."""
from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from typing import Callable, Literal

from .cube import Cube, MOVE_PERMS
from .notation import format_moves, inverse_moves
from .phases import solve_oll as solve_oll_2look, solve_pll as solve_pll_2look
from .full_last_layer import solve_1lll_direct, solve_oll_full, solve_pll_full, solve_zbll_direct
from .predicates import (
    F2L_ORDER,
    cube_solved,
    cross_solved,
    f2l_slot_solved,
    f2l_solved,
    oll_solved,
    xcross_solved,
    xxcross_solved,
    xxxcross_solved,
    xxxxcross_solved,
)
from .search import SearchLimit, solve_cross, solve_f2l_slot, solve_xcross, solve_xxcross, solve_xxxcross, solve_xxxxcross
from .validation import is_valid, validate_cube


# A selected original center is rotated to D, then sticker labels are renamed
# so the existing fixed-center CFOP pipeline can preserve its invariants.
CROSS_ORIENTATIONS: dict[str, tuple[str, ...]] = {
    "U": ("x2",),  # White in the Studio color scheme.
    "D": (),
    "F": ("x'",),
    "B": ("x",),
    "R": ("z",),
    "L": ("z'",),
}
ORIENTABLE_MOVES = tuple(MOVE_PERMS)
OPENING_FIND_MAX_DEPTH = 10


class CFOPError(RuntimeError):
    def __init__(self, code: str, message: str):
        super().__init__(f"{code}: {message}")
        self.code = code
        self.message = message


def _normalize_cross_orientation(cube: Cube, cross_color: str) -> tuple[Cube, tuple[str, ...]]:
    """Rotate selected center to D and relabel all stickers to fixed centers."""
    try:
        rotation = CROSS_ORIENTATIONS[cross_color]
    except KeyError as exc:
        raise CFOPError("invalid_cross_color", f"Unsupported Cross color: {cross_color}") from exc
    oriented = cube.apply_many(rotation)
    color_to_face = {oriented.face(face)[4]: face for face in "URFDLB"}
    return Cube("".join(color_to_face[sticker] for sticker in oriented.stickers)), rotation


@lru_cache(maxsize=6)
def _move_conjugation(rotation: tuple[str, ...]) -> dict[str, str]:
    """Map a normalized face turn back to the player's original orientation."""
    inverse_rotation = tuple(inverse_moves(list(rotation)))
    mapping: dict[str, str] = {}
    for move in ORIENTABLE_MOVES:
        target = Cube().apply_many(rotation + (move,) + inverse_rotation).stickers
        mapping[move] = next(candidate for candidate in ORIENTABLE_MOVES if Cube().apply(candidate).stickers == target)
    return mapping


def _restore_player_orientation(
    original: Cube, normalized: "CFOPSolution", rotation: tuple[str, ...]
) -> "CFOPSolution":
    """Convert solved normalized phases back to the player's cube orientation."""
    mapping = _move_conjugation(rotation)
    restored = CFOPSolution(
        initial_state=original.stickers,
        opening_requested=normalized.opening_requested,
        opening_attempts=list(normalized.opening_attempts),
        opening_achieved=normalized.opening_achieved,
        opening_method=normalized.opening_method,
        direct_node_budget=normalized.direct_node_budget,
        direct_attempts=list(normalized.direct_attempts),
        last_layer_requested=normalized.last_layer_requested,
        last_layer_attempts=list(normalized.last_layer_attempts),
        last_layer_achieved=normalized.last_layer_achieved,
        last_layer_case_id=normalized.last_layer_case_id,
    )
    current = original
    for record in normalized.phases:
        moves = tuple(mapping[move] for move in record.moves)
        current = current.apply_many(moves)
        restored.phases.append(
            PhaseRecord(
                record.name,
                moves,
                current.stickers,
                is_valid(current),
                record.predicate_after,
                record.case_id,
            )
        )
    restored.final_state = current.stickers
    return restored


@dataclass(frozen=True)
class PhaseRecord:
    name: str
    moves: tuple[str, ...]
    state_after: str
    valid_after: bool
    predicate_after: bool
    case_id: str | None = None

    @property
    def algorithm(self) -> str:
        return format_moves(list(self.moves))


@dataclass
class CFOPSolution:
    initial_state: str
    phases: list[PhaseRecord] = field(default_factory=list)
    final_state: str = ""
    opening_requested: str = "cross"
    opening_attempts: list[str] = field(default_factory=list)
    opening_achieved: str = ""
    opening_method: str = "direct"
    direct_node_budget: int = 5_000
    direct_attempts: list[dict[str, object]] = field(default_factory=list)
    last_layer_requested: str = "oll_pll"
    last_layer_attempts: list[str] = field(default_factory=list)
    last_layer_achieved: str = ""
    last_layer_case_id: str | None = None

    @property
    def moves(self) -> list[str]:
        result: list[str] = []
        for phase in self.phases:
            result.extend(phase.moves)
        return result

    @property
    def algorithm(self) -> str:
        return format_moves(self.moves)

    @property
    def opening_summary(self) -> dict[str, object]:
        """Describe the requested opening and the exact bounded-search outcome."""
        target = "xcross" if self.opening_requested == "auto" else self.opening_requested
        achieved = self.opening_achieved or "cross"
        attempts = self.opening_attempts or [achieved]
        return {
            "requested": self.opening_requested,
            "target": target,
            "achieved": achieved,
            "attempts": list(attempts),
            "method": self.opening_method,
            "fallback_count": max(0, len(attempts) - 1),
            "did_fallback": achieved != target,
            "direct_search": {"node_budget": self.direct_node_budget, "attempts": list(self.direct_attempts)},
        }

    @property
    def last_layer_summary(self) -> dict[str, object]:
        """Describe direct one-look selection versus verified OLL/PLL fallback."""
        requested = "oll_pll" if self.last_layer_requested == "full" else self.last_layer_requested
        achieved = self.last_layer_achieved or "oll_pll"
        attempts = self.last_layer_attempts or [achieved]
        did_fallback = requested in ("auto", "zbll", "1lll") and achieved == "oll_pll"
        return {
            "requested": requested,
            "achieved": achieved,
            "attempts": list(attempts),
            "case_id": self.last_layer_case_id if achieved in ("zbll", "1lll") else None,
            "fallback_count": 1 if did_fallback else 0,
            "did_fallback": did_fallback,
        }

    def as_dict(self) -> dict:
        return {
            "algorithm": self.algorithm,
            "solved": self.final_state == Cube().stickers,
            "opening": self.opening_summary,
            "last_layer": self.last_layer_summary,
            "phases": [
                {
                    "name": p.name,
                    "algorithm": p.algorithm,
                    "moves": list(p.moves),
                    "state_after": p.state_after,
                    "valid_after": p.valid_after,
                    "predicate_after": p.predicate_after,
                    "case_id": p.case_id,
                }
                for p in self.phases
            ],
            "final_state": self.final_state,
        }


def _commit(
    current: Cube,
    name: str,
    moves: list[str],
    predicate: Callable[[Cube], bool],
    result: CFOPSolution,
    case_id: str | None = None,
) -> Cube:
    """Apply a phase on a copy and commit only if all invariants hold."""
    candidate = current.copy().apply_many(moves)
    valid = is_valid(candidate)
    ok = valid and predicate(candidate)
    record = PhaseRecord(name, tuple(moves), candidate.stickers, valid, ok, case_id)
    if not valid:
        raise CFOPError("invalid_transition", f"Phase {name} created an invalid cube")
    if not ok:
        raise CFOPError("postcondition_failed", f"Phase {name} did not satisfy its goal")
    result.phases.append(record)
    return candidate


def _retry_opening_search(search: Callable[[int], object], depth: int, find_result: bool):
    """Keep the manual direct-depth contract unless the learner requests a bounded retry.

    Direct meet-in-the-middle is verified through depth eight.  Find-result
    mode tries that complete direct envelope once but never constructs Cross
    and F2L sequentially then mislabels the result as a high-tier opening.
    """
    depths = (depth,) if not find_result else (min(8, max(4, depth)),)
    last_error: SearchLimit | None = None
    for candidate_depth in depths:
        try:
            return search(candidate_depth)
        except SearchLimit as exc:
            last_error = exc
    raise last_error or SearchLimit("No direct opening result found within the safe retry budget")


def solve(
    cube: Cube,
    cross_depth: int = 12,
    f2l_depth: int = 12,
    macro_depth: int = 5,
    last_layer: Literal["full", "2look", "oll_pll", "zbll", "1lll", "auto"] = "oll_pll",
    cross_color: Literal["U", "R", "F", "D", "L", "B"] = "D",
    opening: Literal["cross", "xcross", "xxcross", "xxxcross", "xxxxcross", "auto"] = "cross",
    xcross_depth: int = 8,
    xxcross_depth: int = 8,
    xxxcross_depth: int = 8,
    xxxxcross_depth: int = 8,
    xcross_preferred_slot: str | None = None,
    xcross_excluded_slots: tuple[str, ...] = (),
    opening_find_result: bool = False,
    direct_node_budget: int = 5_000,
    time_budget_sec: float | None = None,
) -> CFOPSolution:
    """Solve a cube with a chosen Cross color; fixed-center API defaults to D."""
    try:
        validate_cube(cube)
    except ValueError as exc:
        raise CFOPError("invalid_input", str(exc)) from exc

    normalized_cube, rotation = _normalize_cross_orientation(cube, cross_color)
    result = CFOPSolution(
        initial_state=normalized_cube.stickers,
        opening_requested=opening,
        last_layer_requested=last_layer,
        direct_node_budget=max(500, min(50_000, int(direct_node_budget))),
    )
    current = normalized_cube
    try:
        solved_slots: list[str] = []
        if opening == "xxxxcross":
            result.opening_attempts.append("xxxxcross")
            try:
                moves = _retry_opening_search(
                    lambda depth: solve_xxxxcross(current, depth, preferred_slot=xcross_preferred_slot, excluded_slots=xcross_excluded_slots, node_budget=result.direct_node_budget, attempt_log=result.direct_attempts),
                    xxxxcross_depth,
                    opening_find_result,
                )
                current = _commit(current, f"xxxxcross_{'_'.join(F2L_ORDER)}", moves, xxxxcross_solved, result)
                solved_slots.extend(F2L_ORDER)
                result.opening_achieved = "xxxxcross"
            except SearchLimit:
                pass

        if not solved_slots and opening in ("xxxcross", "xxxxcross"):
            result.opening_attempts.append("xxxcross")
            try:
                xxxcross_slots, moves = _retry_opening_search(
                    lambda depth: solve_xxxcross(current, depth, preferred_slot=xcross_preferred_slot, excluded_slots=xcross_excluded_slots, node_budget=result.direct_node_budget, attempt_log=result.direct_attempts),
                    xxxcross_depth,
                    opening_find_result,
                )
                current = _commit(current, f"xxxcross_{'_'.join(xxxcross_slots)}", moves, lambda candidate, slots=xxxcross_slots: xxxcross_solved(candidate, slots), result)
                solved_slots.extend(xxxcross_slots)
                result.opening_achieved = "xxxcross"
            except SearchLimit:
                pass

        if not solved_slots and opening in ("xxcross", "xxxcross", "xxxxcross"):
            result.opening_attempts.append("xxcross")
            try:
                xxcross_slots, moves = _retry_opening_search(
                    lambda depth: solve_xxcross(current, depth, preferred_slot=xcross_preferred_slot, excluded_slots=xcross_excluded_slots, node_budget=result.direct_node_budget, attempt_log=result.direct_attempts),
                    xxcross_depth,
                    opening_find_result,
                )
                current = _commit(current, f"xxcross_{'_'.join(xxcross_slots)}", moves, lambda candidate, slots=xxcross_slots: xxcross_solved(candidate, slots), result)
                solved_slots.extend(xxcross_slots)
                result.opening_achieved = "xxcross"
            except SearchLimit:
                pass

        if not solved_slots and opening in ("auto", "xcross", "xxcross", "xxxcross", "xxxxcross"):
            result.opening_attempts.append("xcross")
            try:
                xcross_slot, moves = _retry_opening_search(
                    lambda depth: solve_xcross(current, depth, preferred_slot=xcross_preferred_slot, excluded_slots=xcross_excluded_slots, node_budget=result.direct_node_budget, attempt_log=result.direct_attempts),
                    xcross_depth,
                    opening_find_result,
                )
                current = _commit(current, f"xcross_{xcross_slot}", moves, lambda candidate, slot=xcross_slot: xcross_solved(candidate, slot), result)
                solved_slots.append(xcross_slot)
                result.opening_achieved = "xcross"
            except SearchLimit:
                pass

        if not solved_slots:
            if opening not in ("cross", "auto", "xcross", "xxcross", "xxxcross", "xxxxcross"):
                raise CFOPError("invalid_opening", f"Unknown opening mode: {opening}")
            if opening_find_result and opening in ("xcross", "xxcross", "xxxcross", "xxxxcross"):
                result.opening_achieved = "none"
                result.opening_method = "unavailable"
            result.opening_attempts.append("cross")
            moves = solve_cross(current, cross_depth)
            current = _commit(current, "cross", moves, cross_solved, result)
            if not result.opening_achieved:
                result.opening_achieved = "cross"

        for slot in F2L_ORDER:
            if slot in solved_slots:
                continue
            moves = solve_f2l_slot(
                current,
                slot,
                tuple(solved_slots),
                f2l_depth,
                time_budget_sec=time_budget_sec,
            )
            def slot_goal(candidate: Cube, slot=slot, old=tuple(solved_slots)) -> bool:
                return cross_solved(candidate) and all(
                    f2l_slot_solved(candidate, p) for p in old + (slot,)
                )
            current = _commit(current, f"f2l_{slot}", moves, slot_goal, result)
            solved_slots.append(slot)

        if last_layer in ("full", "oll_pll"):
            result.last_layer_attempts.append("oll_pll")
            oll_case, oll_moves = solve_oll_full(current)
            current = _commit(current, "oll", oll_moves, oll_solved, result, oll_case)
            pll_case, pll_moves = solve_pll_full(current)
            current = _commit(current, "pll", pll_moves, cube_solved, result, pll_case)
            result.last_layer_achieved = "oll_pll"
        elif last_layer == "2look":
            result.last_layer_attempts.append("2look")
            current = _commit(current, "oll", solve_oll_2look(current, macro_depth), oll_solved, result)
            current = _commit(current, "pll", solve_pll_2look(current, macro_depth), cube_solved, result)
            result.last_layer_achieved = "2look"
        elif last_layer in ("zbll", "1lll", "auto"):
            direct = None
            if last_layer in ("zbll", "auto"):
                result.last_layer_attempts.append("zbll")
                direct = solve_zbll_direct(current)
                if direct is not None:
                    case_id, moves = direct
                    current = _commit(current, "zbll", moves, cube_solved, result, case_id)
                    result.last_layer_achieved = "zbll"
                    result.last_layer_case_id = case_id
            if direct is None and last_layer in ("1lll", "auto"):
                result.last_layer_attempts.append("1lll")
                direct = solve_1lll_direct(current)
                if direct is not None:
                    case_id, moves = direct
                    current = _commit(current, "1lll", moves, cube_solved, result, case_id)
                    result.last_layer_achieved = "1lll"
                    result.last_layer_case_id = case_id
            if direct is None:
                result.last_layer_attempts.append("oll_pll")
                oll_case, oll_moves = solve_oll_full(current)
                current = _commit(current, "oll", oll_moves, oll_solved, result, oll_case)
                pll_case, pll_moves = solve_pll_full(current)
                current = _commit(current, "pll", pll_moves, cube_solved, result, pll_case)
                result.last_layer_achieved = "oll_pll"
        else:
            raise CFOPError("invalid_mode", f"Unknown last_layer mode: {last_layer}")
    except SearchLimit as exc:
        raise CFOPError("search_limit", str(exc)) from exc

    result.final_state = current.stickers
    if not cube_solved(current):
        raise CFOPError("not_solved", "CFOP pipeline finished without solved cube")
    restored = _restore_player_orientation(cube, result, rotation)
    if not cube_solved(Cube(restored.final_state)):
        raise CFOPError("not_solved", "Restored player orientation is not solved")
    return restored
