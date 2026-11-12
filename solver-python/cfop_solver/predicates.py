"""Phase predicates for a fixed U/R/F/D/L/B orientation."""
from __future__ import annotations

from .cube import Cube
from .validation import CubieView, cubie_view

# Positions in validation.py: URF,UFL,ULB,UBR,DFR,DLF,DBL,DRB;
# edges: UR,UF,UL,UB,DR,DF,DL,DB,FR,FL,BL,BR.
CROSS_SLOTS = (5, 4, 7, 6)  # DF, DR, DB, DL
F2L_SLOTS = {
    "FR": (4, 8),
    "FL": (5, 9),
    "BL": (6, 10),
    "BR": (7, 11),
}
F2L_ORDER = tuple(F2L_SLOTS)
U_CORNERS = (0, 1, 2, 3)
U_EDGES = (0, 1, 2, 3)


def cross_solved_view(view: CubieView) -> bool:
    """Cross đã xong, đọc thẳng từ cubie view.

    Bản view cho phép kiểm tra điều kiện mà không dựng lại facelet: trong
    vòng tìm kiếm F2L, điều kiện được hỏi hàng trăm nghìn lần nên phần
    dựng lại `cubie_view` là chi phí lớn nhất.
    """
    return all(view.edge_perm[p] == p and view.edge_ori[p] == 0 for p in CROSS_SLOTS)


def f2l_slot_solved_view(view: CubieView, slot: str) -> bool:
    """Một cặp F2L đã vào đúng chỗ, đọc thẳng từ cubie view."""
    corner_pos, edge_pos = F2L_SLOTS[slot]
    return (
        view.corner_perm[corner_pos] == corner_pos
        and view.corner_ori[corner_pos] == 0
        and view.edge_perm[edge_pos] == edge_pos
        and view.edge_ori[edge_pos] == 0
    )


def cross_solved(cube: Cube) -> bool:
    return cross_solved_view(cubie_view(cube))


def f2l_slot_solved(cube: Cube, slot: str) -> bool:
    return f2l_slot_solved_view(cubie_view(cube), slot)


def xcross_solved(cube: Cube, slot: str) -> bool:
    """Cross plus one fully inserted F2L pair in a named slot."""
    return cross_solved(cube) and f2l_slot_solved(cube, slot)


def xxcross_solved(cube: Cube, slots: tuple[str, str]) -> bool:
    """Cross plus two fully inserted F2L pairs in named slots."""
    return f2l_slots_solved(cube, slots)


def xxxcross_solved(cube: Cube, slots: tuple[str, str, str]) -> bool:
    """Cross plus three fully inserted F2L pairs in named slots."""
    return f2l_slots_solved(cube, slots)


def xxxxcross_solved(cube: Cube) -> bool:
    """Cross plus all four F2L pairs; equivalent to a completed first two layers."""
    return f2l_solved(cube)


def f2l_slots_solved(cube: Cube, slots: tuple[str, ...]) -> bool:
    """Shared invariant for XCross, XXCross and normal incremental F2L."""
    return cross_solved(cube) and all(f2l_slot_solved(cube, slot) for slot in slots)


def f2l_solved(cube: Cube, slots: tuple[str, ...] | None = None) -> bool:
    slots = slots or F2L_ORDER
    return cross_solved(cube) and all(f2l_slot_solved(cube, slot) for slot in slots)


def oll_solved(cube: Cube) -> bool:
    view = cubie_view(cube)
    return (
        f2l_solved(cube)
        and all(view.corner_ori[p] == 0 for p in U_CORNERS)
        and all(view.edge_ori[p] == 0 for p in U_EDGES)
    )


def last_layer_edges_oriented(cube: Cube) -> bool:
    """F2L is complete and the U-layer edges meet ZBLL's EO precondition."""
    view = cubie_view(cube)
    return f2l_solved(cube) and all(view.edge_ori[p] == 0 for p in U_EDGES)


def pll_solved(cube: Cube) -> bool:
    view = cubie_view(cube)
    return (
        oll_solved(cube)
        and view.corner_perm == tuple(range(8))
        and view.edge_perm == tuple(range(12))
        and all(o == 0 for o in view.corner_ori)
        and all(o == 0 for o in view.edge_ori)
    )


def cube_solved(cube: Cube) -> bool:
    return cube.is_solved()
