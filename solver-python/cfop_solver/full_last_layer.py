"""Full OLL/PLL recognition and solving.

The recognizer is state-based, not image-based. Each database case is
fingerprinted by applying the inverse of its algorithm to a solved cube. AUF
variants are indexed automatically. At solve time the selected algorithm is
replayed on a copy and accepted only if the phase postcondition holds.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

from .cube import Cube
from .full_database import OLL_ALGORITHMS, PLL_ALGORITHMS
from .notation import parse_moves, inverse_moves
from .one_look_database import ONE_LLL_DIRECT_CASES, ZBLL_DIRECT_CASES
from .predicates import cube_solved, f2l_solved, last_layer_edges_oriented, oll_solved
from .validation import cubie_view, is_valid

AUF_SEQUENCES: tuple[tuple[str, ...], ...] = (
    (), ("U",), ("U2",), ("U'",)
)


@dataclass(frozen=True)
class LastLayerCase:
    name: int | str
    group: str
    text: str
    moves: tuple[str, ...]
    fingerprint: tuple


def _oll_fingerprint(cube: Cube) -> tuple:
    view = cubie_view(cube)
    return (
        tuple(view.corner_ori[i] for i in range(4)),
        tuple(view.edge_ori[i] for i in range(4)),
    )


def _pll_fingerprint(cube: Cube) -> tuple:
    view = cubie_view(cube)
    return (
        tuple(view.corner_perm[:4]),
        tuple(view.edge_perm[:4]),
    )


def _build_cases(rows, fingerprint_fn):
    cases = []
    for name, group, text in rows:
        moves = tuple(parse_moves(text))
        inverse_state = Cube().apply_many(inverse_moves(list(moves)))
        if not is_valid(inverse_state):
            raise RuntimeError(f"Database case {name} generates invalid state")
        cases.append(LastLayerCase(name, group, text, moves, fingerprint_fn(inverse_state)))
    return tuple(cases)


OLL_CASES: tuple[LastLayerCase, ...] = _build_cases(OLL_ALGORITHMS, _oll_fingerprint)
PLL_CASES: tuple[LastLayerCase, ...] = _build_cases(PLL_ALGORITHMS, _pll_fingerprint)

if len(OLL_CASES) != 57 or len(PLL_CASES) != 21:
    raise RuntimeError("Full database must contain exactly 57 OLL and 21 PLL cases")


def _index_cases(cases, fingerprint_fn):
    index: dict[tuple, list[tuple[LastLayerCase, tuple[str, ...]]]] = {}
    for case in cases:
        inverse_state = Cube().apply_many(inverse_moves(list(case.moves)))
        for auf in AUF_SEQUENCES:
            state = inverse_state.apply_many(auf)
            index.setdefault(fingerprint_fn(state), []).append((case, auf))
    return index


OLL_INDEX = _index_cases(OLL_CASES, _oll_fingerprint)
PLL_INDEX = _index_cases(PLL_CASES, _pll_fingerprint)


def _index_direct_one_look(rows: tuple[tuple[str, str, str], ...]):
    """Index inverse fixtures plus AUF variants for an offline direct-case table."""
    index: dict[str, list[tuple[str, tuple[str, ...]]]] = {}
    for case_id, text, fixture_state in rows:
        moves = tuple(parse_moves(text))
        fixture = Cube(fixture_state)
        for auf in AUF_SEQUENCES:
            state = fixture.apply_many(auf)
            prefix = tuple(inverse_moves(list(auf)))
            index.setdefault(state.stickers, []).append((case_id, prefix + moves))
    return index


ONE_LLL_DIRECT_INDEX = _index_direct_one_look(ONE_LLL_DIRECT_CASES)
ZBLL_DIRECT_INDEX = _index_direct_one_look(ZBLL_DIRECT_CASES)


def direct_case_coverage() -> dict[str, int]:
    """Report direct fixed-frame coverage actually shipped in the offline tables."""
    return {
        "1lll_cases": len(ONE_LLL_DIRECT_CASES),
        "zbll_cases": len(ZBLL_DIRECT_CASES),
    }


def list_direct_one_look_cases(
    family: str = "all", query: str = "", group: str = "all", limit: int = 2000
) -> list[dict[str, str]]:
    """Return shipped, replay-verified cases for the interactive Last Layer Explorer.

    Groups are derived from the stable catalog identifiers: ZBLLAS-001 becomes
    group AS, while 1LLL-01-001 becomes group 01. The fixture state is returned
    so the browser can load and highlight the exact last-layer case offline.
    """
    normalized_family = family.lower().strip()
    normalized_group = group.upper().strip()
    needle = query.upper().strip()
    tables: tuple[tuple[str, tuple[tuple[str, str, str], ...]], ...] = (
        ("zbll", ZBLL_DIRECT_CASES),
        ("1lll", ONE_LLL_DIRECT_CASES),
    )
    rows: list[dict[str, str]] = []
    for table_family, table in tables:
        if normalized_family not in ("all", table_family):
            continue
        for case_id, algorithm, fixture_state in table:
            case_group = case_id[4:].split("-", 1)[0] if table_family == "zbll" else case_id.split("-")[1]
            searchable = f"{case_id} {case_group} {algorithm}".upper()
            if normalized_group not in ("", "ALL") and case_group != normalized_group:
                continue
            if needle and needle not in searchable:
                continue
            rows.append({
                "id": case_id,
                "family": table_family,
                "group": case_group,
                "algorithm": algorithm,
                "state": fixture_state,
            })
            if len(rows) >= max(1, min(limit, 2000)):
                return rows
    return rows


def _solve_direct_one_look(
    cube: Cube, index: dict[str, list[tuple[str, tuple[str, ...]]]]
) -> tuple[str, list[str]] | None:
    if not f2l_solved(cube):
        raise ValueError("One-look Last Layer requires Cross and all F2L slots solved")
    for case_id, moves in index.get(cube.stickers, ()):
        candidate = cube.apply_many(moves)
        if is_valid(candidate) and cube_solved(candidate):
            return case_id, list(moves)
    return None


def solve_zbll_direct(cube: Cube) -> tuple[str, list[str]] | None:
    """Solve a shipped direct ZBLL case, only after the EO precondition is met."""
    if not last_layer_edges_oriented(cube):
        return None
    return _solve_direct_one_look(cube, ZBLL_DIRECT_INDEX)


def solve_1lll_direct(cube: Cube) -> tuple[str, list[str]] | None:
    """Solve a shipped direct 1LLL case; returns None when catalog coverage misses."""
    return _solve_direct_one_look(cube, ONE_LLL_DIRECT_INDEX)


def _candidate_sequences(index, fingerprint, phase_goal, cube: Cube):
    """Yield verified candidate sequences for an indexed state."""
    for case, auf in index.get(fingerprint, ()):
        for pre_auf in AUF_SEQUENCES:
            candidate_moves = list(pre_auf) + list(case.moves)
            candidate = cube.apply_many(candidate_moves)
            if is_valid(candidate) and phase_goal(candidate):
                yield case, tuple(candidate_moves), candidate


def recognize_oll(cube: Cube) -> LastLayerCase | None:
    """Return the full OLL case matching orientation, independent of AUF."""
    if not f2l_solved(cube):
        return None
    if oll_solved(cube):
        return None
    for case, _moves, _candidate in _candidate_sequences(
        OLL_INDEX, _oll_fingerprint(cube), oll_solved, cube
    ):
        return case
    return None


def solve_oll_full(cube: Cube) -> tuple[str, list[str]]:
    """Recognize and solve one full OLL case."""
    if not f2l_solved(cube):
        raise ValueError("Full OLL requires Cross and all F2L slots solved")
    if oll_solved(cube):
        return "solved", []
    candidates = list(_candidate_sequences(OLL_INDEX, _oll_fingerprint(cube), oll_solved, cube))
    if not candidates:
        raise RuntimeError("No full OLL case matched the current state")
    case, moves, _candidate = candidates[0]
    return str(case.name), list(moves)


def recognize_pll(cube: Cube) -> LastLayerCase | None:
    """Return the full PLL case matching top-layer permutation."""
    if not oll_solved(cube):
        return None
    for case, _moves, _candidate in _candidate_sequences(
        PLL_INDEX, _pll_fingerprint(cube), cube_solved, cube
    ):
        return case
    return None


def _pll_rotation_sequences():
    rotations = ((), ("y",), ("y2",), ("y'",))
    inverses = ((), ("y'",), ("y2",), ("y",))
    for k in range(4):
        yield rotations[k], inverses[k]


def _scan_pll_database(cube: Cube):
    """Exhaustive but small fallback over 21 cases, AUF and y views."""
    for case in PLL_CASES:
        for rotation, inverse_rotation in _pll_rotation_sequences():
            for pre_auf in AUF_SEQUENCES:
                base = list(pre_auf) + list(rotation) + list(case.moves) + list(inverse_rotation)
                candidate = cube.apply_many(base)
                if not is_valid(candidate):
                    continue
                if cube_solved(candidate):
                    yield case, tuple(base), candidate
                for final_auf in AUF_SEQUENCES:
                    end = candidate.apply_many(final_auf)
                    if cube_solved(end):
                        yield case, tuple(base) + final_auf, end


def solve_pll_full(cube: Cube) -> tuple[str, list[str]]:
    """Recognize and solve one full PLL case, including AUF and y-view setup."""
    if not oll_solved(cube):
        raise ValueError("Full PLL requires OLL solved")
    if cube_solved(cube):
        return "solved", []
    candidates = list(_candidate_sequences(PLL_INDEX, _pll_fingerprint(cube), cube_solved, cube))
    if candidates:
        case, moves, candidate = candidates[0]
        if cube_solved(candidate):
            return str(case.name), list(moves)
    fallback = next(_scan_pll_database(cube), None)
    if fallback is None:
        raise RuntimeError("No full PLL case matched the current state")
    case, moves, _candidate = fallback
    return str(case.name), list(moves)


def verify_full_database() -> dict[str, int]:
    """Replay inverse-generated fixtures and return coverage counts."""
    oll_ok = 0
    pll_ok = 0
    for case in OLL_CASES:
        fixture = Cube().apply_many(inverse_moves(list(case.moves)))
        if f2l_solved(fixture) and oll_solved(fixture.apply_many(case.moves)):
            oll_ok += 1
    for case in PLL_CASES:
        fixture = Cube().apply_many(inverse_moves(list(case.moves)))
        if oll_solved(fixture) and cube_solved(fixture.apply_many(case.moves)):
            pll_ok += 1
    return {"oll_total": len(OLL_CASES), "oll_verified": oll_ok, "pll_total": len(PLL_CASES), "pll_verified": pll_ok}
