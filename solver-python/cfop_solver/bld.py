"""3-Style 3BLD tracing with Speffz lettering.

This module deliberately separates two invariant-preserving concerns:
1. trace the physical sticker cycles from the validated cubie view; and
2. emit buffer-target-target keys for an external 3-Style algorithm catalog.

The solver never invents a commutator.  Each execution key can be resolved
against a verified 3-Style catalog (BLDDB in the web client).
"""
from __future__ import annotations

from dataclasses import asdict, dataclass

from .cube import Cube
from .validation import CORNER_COLORS, CORNER_FACELETS, EDGE_COLORS, EDGE_FACELETS, cubie_view, permutation_parity

# Speffz follows the standard ULFRBD spiral.  Center entries are spaces.
_POSITIONS = (
    "UBL", "UB", "UBR", "UR", "U", "UF", "UFR", "UL", "UFL",
    "LUB", "LU", "LUF", "LF", "L", "LD", "LDF", "LB", "LDB",
    "FUL", "FU", "FUR", "FR", "F", "FD", "FDR", "FL", "FDL",
    "RUF", "RU", "RUB", "RB", "R", "RD", "RDB", "RF", "RDF",
    "BUR", "BU", "BUL", "BL", "B", "BD", "BDL", "BR", "BDR",
    "DFL", "DF", "DFR", "DR", "D", "DB", "DBR", "DL", "DBL",
)
_SPEFFZ = "AABD BDCCEEFH FHGGIIJL JLKKMMNP NPOOQQRT RTSSUUVX VXWW"


def _labels(piece_len: int, colors: tuple[tuple[str, ...], ...], facelets: tuple[tuple[int, ...], ...]) -> tuple[dict[str, int], dict[int, str]]:
    location_to_index: dict[str, int] = {}
    source_index_to_label: dict[int, str] = {}
    for position, letter in zip(_POSITIONS, _SPEFFZ):
        if len(position) != piece_len or letter == " ":
            continue
        piece = next(index for index, piece_colors in enumerate(colors) if set(piece_colors) == set(position))
        sticker = facelets[piece][colors[piece].index(position[0])]
        location_to_index[letter] = sticker
        source_index_to_label[sticker] = letter
    return location_to_index, source_index_to_label


EDGE_LOCATION, EDGE_LABEL = _labels(2, EDGE_COLORS, EDGE_FACELETS)
CORNER_LOCATION, CORNER_LABEL = _labels(3, CORNER_COLORS, CORNER_FACELETS)
EDGE_BUFFER = "C"  # UF
CORNER_BUFFER = "A"  # UBL


@dataclass(frozen=True)
class Cycle:
    buffer: str
    targets: tuple[str, ...]
    cycle_break: bool = False

    @property
    def memo(self) -> str:
        return "".join(self.targets)

    @property
    def execution_keys(self) -> tuple[str, ...]:
        return tuple(self.buffer + self.targets[index] + self.targets[index + 1] for index in range(0, len(self.targets) - 1, 2))


def _sticker_map(cube: Cube, kind: str) -> dict[str, str]:
    view = cubie_view(cube)
    if kind == "edge":
        positions, colors, facelets, permutation, location = EDGE_LOCATION, EDGE_COLORS, EDGE_FACELETS, view.edge_perm, EDGE_LOCATION
    else:
        positions, colors, facelets, permutation, location = CORNER_LOCATION, CORNER_COLORS, CORNER_FACELETS, view.corner_perm, CORNER_LOCATION
    result: dict[str, str] = {}
    for letter, current_index in positions.items():
        current_piece = next(index for index, indices in enumerate(facelets) if current_index in indices)
        source_piece = permutation[current_piece]
        source_color = cube.stickers[current_index]
        source_index = facelets[source_piece][colors[source_piece].index(source_color)]
        result[letter] = (EDGE_LABEL if kind == "edge" else CORNER_LABEL)[source_index]
    return result


def _trace_cycles(mapping: dict[str, str], buffer: str) -> tuple[Cycle, ...]:
    unsolved = {letter for letter, target in mapping.items() if letter != target}
    cycles: list[Cycle] = []
    for start, is_break in ((buffer, False), *[(letter, True) for letter in sorted(unsolved) if letter != buffer]):
        if start not in unsolved:
            continue
        path = [start]
        cursor = mapping[start]
        while cursor != start and cursor not in path:
            path.append(cursor)
            cursor = mapping[cursor]
        unsolved.difference_update(path)
        if len(path) > 1:
            cycles.append(Cycle(buffer=buffer, targets=tuple(path[1:]), cycle_break=is_break))
    return tuple(cycles)


def _pair_memo(cycles: tuple[Cycle, ...]) -> tuple[str, ...]:
    stream: list[str] = []
    for cycle in cycles:
        if cycle.cycle_break:
            stream.append("•")
        stream.extend(cycle.targets)
    if len(stream) % 2:
        stream.append("•")
    return tuple("".join(stream[index : index + 2]) for index in range(0, len(stream), 2))


def _specials(cube: Cube) -> dict[str, object]:
    view = cubie_view(cube)
    edge_positions = ("UR", "UF", "UL", "UB", "DR", "DF", "DL", "DB", "FR", "FL", "BL", "BR")
    edge_flip_positions = tuple(edge_positions[index] for index, value in enumerate(view.edge_ori) if value)
    corner_positions = ("UFR", "UFL", "UBL", "UBR", "DFR", "DFL", "DBL", "DBR")
    corner_twists = tuple({"position": corner_positions[index], "direction": {1: "cw", 2: "ccw"}[value]} for index, value in enumerate(view.corner_ori) if value)
    return {
        "parity": bool(permutation_parity(view.edge_perm)),
        "edge_flips": edge_flip_positions,
        "corner_twists": corner_twists,
        "edge_orientation_sum": sum(view.edge_ori),
        "corner_orientation_sum": sum(view.corner_ori),
    }


def analyze_3style(cube: Cube) -> dict[str, object]:
    """Return a deterministic Speffz 3-Style memo and catalog execution plan.

    The result is a plan rather than guessed moves.  The browser enriches each
    `execution_keys` entry with a verified BLDDB commutator when available.
    """
    edge_cycles = _trace_cycles(_sticker_map(cube, "edge"), EDGE_BUFFER)
    corner_cycles = _trace_cycles(_sticker_map(cube, "corner"), CORNER_BUFFER)
    serialize_cycle = lambda cycle: {**asdict(cycle), "memo": cycle.memo, "execution_keys": cycle.execution_keys}
    return {
        "method": "3style-speffz",
        "buffers": {"edge": {"letter": EDGE_BUFFER, "position": "UF"}, "corner": {"letter": CORNER_BUFFER, "position": "UBL"}},
        "edges": {"cycles": [serialize_cycle(cycle) for cycle in edge_cycles], "memo": _pair_memo(edge_cycles), "execution_keys": tuple(key for cycle in edge_cycles for key in cycle.execution_keys)},
        "corners": {"cycles": [serialize_cycle(cycle) for cycle in corner_cycles], "memo": _pair_memo(corner_cycles), "execution_keys": tuple(key for cycle in corner_cycles for key in cycle.execution_keys)},
        "special": _specials(cube),
        "solved": cube.is_solved(),
        "catalog": {"provider": "BLDDB", "source": "https://github.com/nbwzx/blddb", "note": "Execution algorithms are resolved by exact Speffz buffer-target-target key; unresolved special cases are flagged, never guessed."},
    }
