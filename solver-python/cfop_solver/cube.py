"""Facelet cube model with geometry-generated move permutations.

The model uses Singmaster face order U, R, F, D, L, B and nine stickers per
face in row-major order as viewed directly at that face.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

Vec = tuple[int, int, int]

FACE_ORDER = ("U", "R", "F", "D", "L", "B")
FACE_INDEX = {face: i for i, face in enumerate(FACE_ORDER)}
FACE_NORMAL: dict[str, Vec] = {
    "U": (0, 1, 0),
    "R": (1, 0, 0),
    "F": (0, 0, 1),
    "D": (0, -1, 0),
    "L": (-1, 0, 0),
    "B": (0, 0, -1),
}
FACE_RIGHT: dict[str, Vec] = {
    "U": (1, 0, 0),
    "R": (0, 0, -1),
    "F": (1, 0, 0),
    "D": (1, 0, 0),
    "L": (0, 0, 1),
    "B": (-1, 0, 0),
}
FACE_UP: dict[str, Vec] = {
    "U": (0, 0, -1),
    "R": (0, 1, 0),
    "F": (0, 1, 0),
    "D": (0, 0, 1),
    "L": (0, 1, 0),
    "B": (0, 1, 0),
}

# A sticker is identified by the cubie coordinate it lies on and its outward
# normal. Coordinates are always in {-1, 0, 1}.
StickerKey = tuple[Vec, Vec]


def vadd(a: Vec, b: Vec) -> Vec:
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def vscale(a: Vec, k: int) -> Vec:
    return (a[0] * k, a[1] * k, a[2] * k)


def dot(a: Vec, b: Vec) -> int:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def rotate_quarter(v: Vec, axis: Vec, clockwise: bool = True) -> Vec:
    """Rotate an integer vector 90 degrees around an oriented unit axis.

    For a move viewed from the outward normal, clockwise is -90 degrees by
    the right-hand rule. The formula is Rodrigues' formula specialized to a
    quarter turn.
    """
    sign = -1 if clockwise else 1
    # v_rot = axis*(axis.v) + sign*(axis x v)
    cross = (
        axis[1] * v[2] - axis[2] * v[1],
        axis[2] * v[0] - axis[0] * v[2],
        axis[0] * v[1] - axis[1] * v[0],
    )
    parallel = vscale(axis, dot(axis, v))
    return vadd(parallel, vscale(cross, sign))


def sticker_index(face: str, row: int, col: int) -> int:
    return FACE_INDEX[face] * 9 + row * 3 + col


def sticker_key(face: str, row: int, col: int) -> StickerKey:
    n = FACE_NORMAL[face]
    right = FACE_RIGHT[face]
    up = FACE_UP[face]
    pos = vadd(n, vadd(vscale(right, col - 1), vscale(up, 1 - row)))
    return pos, n


INDEX_TO_KEY: list[StickerKey] = []
KEY_TO_INDEX: dict[StickerKey, int] = {}
for face in FACE_ORDER:
    for row in range(3):
        for col in range(3):
            idx = sticker_index(face, row, col)
            key = sticker_key(face, row, col)
            INDEX_TO_KEY.append(key)
            KEY_TO_INDEX[key] = idx

SOLVED = "".join(face for face in FACE_ORDER for _ in range(9))


def layer_permutation(axis_normal: Vec, layer: int | None) -> tuple[int, ...]:
    """Create a permutation for one face/slice/whole-cube clockwise move."""
    perm = list(range(54))
    for source, (pos, normal) in enumerate(INDEX_TO_KEY):
        if layer is not None and dot(pos, axis_normal) != layer:
            continue
        new_pos = rotate_quarter(pos, axis_normal, clockwise=True)
        new_normal = rotate_quarter(normal, axis_normal, clockwise=True)
        target = KEY_TO_INDEX[(new_pos, new_normal)]
        perm[source] = target
    return tuple(perm)


def invert_permutation(perm: tuple[int, ...]) -> tuple[int, ...]:
    inv = [0] * len(perm)
    for source, target in enumerate(perm):
        inv[target] = source
    return tuple(inv)


def compose_permutation(a: tuple[int, ...], b: tuple[int, ...]) -> tuple[int, ...]:
    """Return permutation for applying a then b."""
    return tuple(b[a[i]] for i in range(54))


BASE_PERMS: dict[str, tuple[int, ...]] = {}
for face in ("U", "R", "F", "D", "L", "B"):
    BASE_PERMS[face] = layer_permutation(FACE_NORMAL[face], 1)
# Slice directions follow Singmaster: M follows L, E follows D, S follows F.
BASE_PERMS["M"] = layer_permutation(FACE_NORMAL["L"], 0)
BASE_PERMS["E"] = layer_permutation(FACE_NORMAL["D"], 0)
BASE_PERMS["S"] = layer_permutation(FACE_NORMAL["F"], 0)
# Whole-cube rotations follow R, U and F respectively.
BASE_PERMS["x"] = layer_permutation(FACE_NORMAL["R"], None)
BASE_PERMS["y"] = layer_permutation(FACE_NORMAL["U"], None)
BASE_PERMS["z"] = layer_permutation(FACE_NORMAL["F"], None)

MOVE_PERMS: dict[str, tuple[int, ...]] = {}
for name, perm in BASE_PERMS.items():
    MOVE_PERMS[name] = perm
    MOVE_PERMS[name + "'"] = invert_permutation(perm)
    MOVE_PERMS[name + "2"] = compose_permutation(perm, perm)

# Wide moves: lowercase notation turns the named outer layer together with
# the adjacent middle slice. They are represented as compositions of already
# generated legal permutations, so the facelet geometry remains single-source.
WIDE_COMPONENTS = {
    "r": ("R", "M'"),
    "l": ("L", "M"),
    "u": ("U", "E'"),
    "d": ("D", "E"),
    "f": ("F", "S"),
    "b": ("B", "S'"),
}
for name, components in WIDE_COMPONENTS.items():
    perm = tuple(range(54))
    for component in components:
        perm = compose_permutation(perm, MOVE_PERMS[component])
    MOVE_PERMS[name] = perm
    MOVE_PERMS[name + "'"] = invert_permutation(perm)
    MOVE_PERMS[name + "2"] = compose_permutation(perm, perm)


@dataclass(frozen=True)
class Cube:
    """Immutable facelet state; applying moves returns a new Cube."""

    stickers: str = SOLVED

    def __post_init__(self) -> None:
        if len(self.stickers) != 54:
            raise ValueError("A 3x3 cube state must contain exactly 54 stickers")

    def apply(self, move: str) -> "Cube":
        perm = MOVE_PERMS[move]
        out = ["?"] * 54
        for source, target in enumerate(perm):
            out[target] = self.stickers[source]
        return Cube("".join(out))

    def apply_many(self, moves: Iterable[str]) -> "Cube":
        result = self
        for move in moves:
            result = result.apply(move)
        return result

    def is_solved(self) -> bool:
        return self.stickers == SOLVED

    def copy(self) -> "Cube":
        return Cube(self.stickers)

    def face(self, name: str) -> str:
        i = FACE_INDEX[name] * 9
        return self.stickers[i : i + 9]

    def __str__(self) -> str:
        return self.stickers
