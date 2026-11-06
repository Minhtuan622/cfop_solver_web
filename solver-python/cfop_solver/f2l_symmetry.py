"""Generate four-slot F2L macros from the canonical front-right database.

The macro database is intentionally stored once for FR.  A whole-cube y
rotation is only used as a conjugation *construction*; the returned sequence
contains exclusively outer face turns and is therefore directly playable by
the solver and the 3D guide.
"""
from __future__ import annotations

from functools import lru_cache

from .cube import Cube
from .f2l_macros import F2L_MACROS
from .notation import inverse_moves

FACE_TURNS = tuple(face + suffix for face in "URFDLB" for suffix in ("", "2", "'"))

# The rotations map the canonical front-right construction around the D-layer.
# They are represented as move tuples to keep the conjugation exact and testable.
SLOT_Y_ROTATION: dict[str, tuple[str, ...]] = {
    "FR": (),
    "FL": ("y",),
    "BL": ("y2",),
    "BR": ("y'",),
}


@lru_cache(maxsize=128)
def conjugate_face_turn(move: str, rotation: tuple[str, ...]) -> str:
    """Return the outer turn equivalent to ``r · move · r⁻¹``.

    Matching against the cube engine instead of a handwritten face mapping
    removes the common y/y' sign error and makes this module independent from
    a particular visualization convention.
    """
    inverse = tuple(inverse_moves(list(rotation)))
    target = Cube().apply_many(rotation + (move,) + inverse).stickers
    try:
        return next(candidate for candidate in FACE_TURNS if Cube().apply(candidate).stickers == target)
    except StopIteration as exc:  # Defensive: a rotation must conjugate a face turn to a face turn.
        raise RuntimeError(f"Cannot conjugate {move} by {' '.join(rotation) or 'identity'}") from exc


@lru_cache(maxsize=4)
def macros_for_slot(slot: str) -> tuple[tuple[str, tuple[str, ...]], ...]:
    """Return canonical FR macros transformed to ``FR/FL/BL/BR``.

    The sequence is the engine-verified conjugation of each individual face
    turn.  It is still rechecked against the full F2L invariant by search.py
    before it can be returned as a solution.
    """
    try:
        rotation = SLOT_Y_ROTATION[slot]
    except KeyError as exc:
        raise ValueError(f"Unsupported F2L slot: {slot}") from exc
    if not rotation:
        return F2L_MACROS
    return tuple(
        (f"{case}@{slot}", tuple(conjugate_face_turn(move, rotation) for move in macro))
        for case, macro in F2L_MACROS
    )


def verify_slot_macro_symmetry(slot: str) -> bool:
    """Verify every generated macro equals its explicit y-conjugation."""
    rotation = SLOT_Y_ROTATION[slot]
    inverse = tuple(inverse_moves(list(rotation)))
    for (_case, canonical), (_derived, transformed) in zip(F2L_MACROS, macros_for_slot(slot), strict=True):
        expected = Cube().apply_many(rotation + canonical + inverse)
        if Cube().apply_many(transformed) != expected:
            return False
    return True
