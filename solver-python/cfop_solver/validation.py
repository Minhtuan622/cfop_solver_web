"""Validation and cubie-level inspection for a facelet cube."""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from itertools import combinations

from .cube import Cube, FACE_ORDER, FACE_NORMAL, INDEX_TO_KEY, Vec

CORNER_POSITIONS: tuple[Vec, ...] = (
    (1, 1, 1), ( -1, 1, 1), (-1, 1, -1), (1, 1, -1),
    (1, -1, 1), (-1, -1, 1), (-1, -1, -1), (1, -1, -1),
)
EDGE_POSITIONS: tuple[Vec, ...] = (
    (1, 1, 0), (0, 1, 1), (-1, 1, 0), (0, 1, -1),
    (1, -1, 0), (0, -1, 1), (-1, -1, 0), (0, -1, -1),
    (1, 0, 1), (-1, 0, 1), (-1, 0, -1), (1, 0, -1),
)


def _indices_at_position(pos: Vec) -> list[int]:
    return [i for i, (p, _normal) in enumerate(INDEX_TO_KEY) if p == pos]

POSITION_INDICES = {
    pos: _indices_at_position(pos)
    for pos in CORNER_POSITIONS + EDGE_POSITIONS
}


# Facelet order follows U, R, F, D, L, B with row-major indexing.
# These are the standard Kociemba reference facelets.
CORNER_FACELETS: tuple[tuple[int, int, int], ...] = (
    (8, 9, 20), (6, 18, 38), (0, 36, 47), (2, 45, 11),
    (29, 26, 15), (27, 44, 24), (33, 53, 42), (35, 17, 51),
)
EDGE_FACELETS: tuple[tuple[int, int], ...] = (
    (5, 10), (7, 19), (3, 37), (1, 46), (32, 16), (28, 25),
    (30, 43), (34, 52), (23, 12), (21, 41), (50, 39), (48, 14),
)
CORNER_COLORS: tuple[tuple[str, str, str], ...] = (
    ("U", "R", "F"), ("U", "F", "L"), ("U", "L", "B"), ("U", "B", "R"),
    ("D", "F", "R"), ("D", "L", "F"), ("D", "B", "L"), ("D", "R", "B"),
)
EDGE_COLORS: tuple[tuple[str, str], ...] = (
    ("U", "R"), ("U", "F"), ("U", "L"), ("U", "B"), ("D", "R"), ("D", "F"),
    ("D", "L"), ("D", "B"), ("F", "R"), ("F", "L"), ("B", "L"), ("B", "R"),
)


def _solved_piece_signatures() -> tuple[dict[frozenset[str], int], dict[frozenset[str], int]]:
    solved = Cube()
    corner_map: dict[frozenset[str], int] = {}
    edge_map: dict[frozenset[str], int] = {}
    for i, pos in enumerate(CORNER_POSITIONS):
        colors = frozenset(solved.stickers[j] for j in POSITION_INDICES[pos])
        corner_map[colors] = i
    for i, pos in enumerate(EDGE_POSITIONS):
        colors = frozenset(solved.stickers[j] for j in POSITION_INDICES[pos])
        edge_map[colors] = i
    return corner_map, edge_map

CORNER_SIGNATURES, EDGE_SIGNATURES = _solved_piece_signatures()


@dataclass(frozen=True)
class CubieView:
    corner_perm: tuple[int, ...]
    corner_ori: tuple[int, ...]
    edge_perm: tuple[int, ...]
    edge_ori: tuple[int, ...]


@lru_cache(maxsize=32_768)
def cubie_view(cube: Cube) -> CubieView:
    cp: list[int] = []
    co: list[int] = []
    ep: list[int] = []
    eo: list[int] = []

    for pos in CORNER_POSITIONS:
        indices = POSITION_INDICES[pos]
        colors = frozenset(cube.stickers[j] for j in indices)
        if len(colors) != 3 or colors not in CORNER_SIGNATURES:
            raise ValueError(f"Invalid corner colors at {pos}: {colors}")
        cp.append(CORNER_SIGNATURES[colors])
        ref = CORNER_FACELETS[CORNER_POSITIONS.index(pos)]
        orientation = next(
            ori for ori, index in enumerate(ref)
            if cube.stickers[index] in ("U", "D")
        )
        co.append(orientation)

    for pos in EDGE_POSITIONS:
        indices = POSITION_INDICES[pos]
        colors = frozenset(cube.stickers[j] for j in indices)
        if len(colors) != 2 or colors not in EDGE_SIGNATURES:
            raise ValueError(f"Invalid edge colors at {pos}: {colors}")
        piece = EDGE_SIGNATURES[colors]
        ep.append(piece)
        ref_a, ref_b = EDGE_FACELETS[EDGE_POSITIONS.index(pos)]
        expected_a, expected_b = EDGE_COLORS[piece]
        if (cube.stickers[ref_a], cube.stickers[ref_b]) == (expected_a, expected_b):
            eo.append(0)
        elif (cube.stickers[ref_a], cube.stickers[ref_b]) == (expected_b, expected_a):
            eo.append(1)
        else:
            raise ValueError(f"Invalid edge orientation at {pos}")

    return CubieView(tuple(cp), tuple(co), tuple(ep), tuple(eo))


def permutation_parity(values: tuple[int, ...]) -> int:
    return sum(values[i] > values[j] for i, j in combinations(range(len(values)), 2)) % 2


def validate_cube(cube: Cube, require_fixed_centers: bool = True) -> None:
    """Raise ValueError if cube is not a physically valid facelet state."""
    if len(cube.stickers) != 54:
        raise ValueError("Cube state must have 54 stickers")
    allowed = set(FACE_ORDER)
    if set(cube.stickers) - allowed:
        raise ValueError(f"Unknown colors; expected only {sorted(allowed)}")
    for face in FACE_ORDER:
        if cube.stickers.count(face) != 9:
            raise ValueError(f"Color {face} must appear exactly 9 times")
        center = cube.face(face)[4]
        if require_fixed_centers and center != face:
            raise ValueError(
                f"Center mismatch on {face}: got {center}; "
                "input must use U R F D L B center order"
            )
    view = cubie_view(cube)
    if len(set(view.corner_perm)) != 8 or len(set(view.edge_perm)) != 12:
        raise ValueError("Duplicate or missing cubie")
    if sum(view.corner_ori) % 3:
        raise ValueError("Corner orientation sum is not divisible by 3")
    if sum(view.edge_ori) % 2:
        raise ValueError("Edge orientation sum is not even")
    if permutation_parity(view.corner_perm) != permutation_parity(view.edge_perm):
        raise ValueError("Corner and edge permutation parity mismatch")


def is_valid(cube: Cube) -> bool:
    try:
        validate_cube(cube)
        return True
    except ValueError:
        return False
