"""Singmaster move parsing and sequence utilities."""
from __future__ import annotations

import re

from .cube import MOVE_PERMS


def _expand_token(token: str) -> list[str]:
    token = token.strip()
    if not token:
        return []
    # The database uses R3 as a compact spelling of R'.
    if token.endswith("3'"):
        token = token[:-2] + "'"
    elif token.endswith("3"):
        token = token[:-1] + "'"
    if token not in MOVE_PERMS:
        raise ValueError(f"Invalid move: {token}")
    return [token]


def parse_moves(text: str) -> list[str]:
    # Parentheses and visual separators are not semantic moves.
    cleaned = re.sub(r"[()]", " ", text)
    tokens = cleaned.replace(",", " ").split()
    moves: list[str] = []
    for token in tokens:
        moves.extend(_expand_token(token))
    return moves


def inverse_move(move: str) -> str:
    if move.endswith("2"):
        return move
    if move.endswith("'"):
        return move[:-1]
    return move + "'"


def inverse_moves(moves: list[str]) -> list[str]:
    return [inverse_move(m) for m in reversed(moves)]


def normalize_moves(moves: list[str]) -> list[str]:
    """Combine adjacent moves on the same base face."""
    result: list[str] = []
    powers = {"": 1, "'": 3, "2": 2}
    suffixes = {1: "", 2: "2", 3: "'"}
    for move in moves:
        base = move[0]
        suffix = move[1:]
        if suffix not in powers:
            result.append(move)
            continue
        power = powers[suffix]
        if result and result[-1][0] == base and result[-1][1:] in powers:
            previous = result.pop()
            previous_power = powers[previous[1:]]
            total = (previous_power + power) % 4
            if total:
                result.append(base + suffixes[total])
        else:
            result.append(move)
    return result


def format_moves(moves: list[str]) -> str:
    return " ".join(normalize_moves(moves))
