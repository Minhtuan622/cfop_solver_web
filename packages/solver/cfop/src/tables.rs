//! Piece-tracking move tables, reference frames and pruning tables.
//!
//! All searches run in a *canonical frame*: cross on D, first slot FR. A
//! cube with another cross color is conjugated into this frame once
//! (`G^-1 * cube * G`), searched, and the moves mapped back (`G m G^-1`).
//! The other three slots reuse the FR tables by conjugating the tracked
//! coordinates with `y^k`, so only one set of tables exists.
//!
//! Coordinates: an edge is `pos * 2 + flip` (0..24), a corner is
//! `pos * 3 + twist` (0..24). Edge pieces 4..=7 are the D-cross edges
//! (DR DF DL DB), 8..=11 the slot edges (FR FL BL BR), corner pieces 4..=7
//! the slot corners (DFR DLF DBL DRB).

use std::sync::OnceLock;
use std::time::Duration;

use cube_core::{move_cube, Cube, Move, MoveBase};

/// The 18 outer face turns, indexed like `Move::index()` (faces come first).
pub(crate) const FACE_MOVES: usize = 18;

pub(crate) const CROSS_EDGES: [usize; 4] = [4, 5, 6, 7];
/// (corner piece, edge piece) of canonical slots FR, FL, BL, BR.
pub(crate) const SLOTS: [(usize, usize); 4] = [(4, 8), (5, 9), (6, 10), (7, 11)];

/// Half-byte table; 0xF = not yet reached.
pub(crate) struct Nibbles {
    data: Vec<u8>,
}

impl Nibbles {
    fn new(len: usize) -> Self {
        Nibbles {
            data: vec![0xFF; len.div_ceil(2)],
        }
    }
    #[inline]
    pub(crate) fn get(&self, i: usize) -> u8 {
        (self.data[i >> 1] >> ((i & 1) * 4)) & 0xF
    }
    #[inline]
    fn set(&mut self, i: usize, v: u8) {
        let shift = (i & 1) * 4;
        let b = &mut self.data[i >> 1];
        *b = (*b & !(0xF << shift)) | (v << shift);
    }
    pub(crate) fn bytes(&self) -> usize {
        self.data.len()
    }
}

/// Which pieces a pruning table tracks: `n_edges` edges (in a fixed piece
/// order) and optionally one corner.
#[derive(Clone, Copy)]
struct Coord {
    n_edges: usize,
    corner: bool,
}

impl Coord {
    fn size(self) -> usize {
        let perms: usize = (0..self.n_edges).map(|k| 12 - k).product();
        (perms << self.n_edges) * if self.corner { 24 } else { 1 }
    }

    /// `edges[k]` = coordinate of the k-th tracked edge.
    #[inline]
    fn rank(self, edges: &[u8], corner: u8) -> usize {
        let mut used: u16 = 0;
        let mut perm = 0usize;
        let mut ori = 0usize;
        for (k, &e) in edges.iter().enumerate().take(self.n_edges) {
            let p = (e >> 1) as usize;
            let below = (used & ((1u16 << p) - 1)).count_ones() as usize;
            perm = perm * (12 - k) + (p - below);
            used |= 1 << p;
            ori = (ori << 1) | (e & 1) as usize;
        }
        let idx = (perm << self.n_edges) | ori;
        if self.corner {
            idx * 24 + corner as usize
        } else {
            idx
        }
    }

    fn unrank(self, mut idx: usize) -> ([u8; 5], u8) {
        let mut corner = 0;
        if self.corner {
            corner = (idx % 24) as u8;
            idx /= 24;
        }
        let ori = idx & ((1 << self.n_edges) - 1);
        let mut perm = idx >> self.n_edges;
        let mut digits = [0usize; 5];
        for k in (0..self.n_edges).rev() {
            let base = 12 - k;
            digits[k] = perm % base;
            perm /= base;
        }
        let mut used: u16 = 0;
        let mut edges = [0u8; 5];
        for k in 0..self.n_edges {
            // digits[k]-th unused position
            let mut count = digits[k];
            let mut p = 0;
            loop {
                if used & (1 << p) == 0 {
                    if count == 0 {
                        break;
                    }
                    count -= 1;
                }
                p += 1;
            }
            used |= 1 << p;
            let flip = (ori >> (self.n_edges - 1 - k)) & 1;
            edges[k] = (p * 2 + flip) as u8;
        }
        (edges, corner)
    }
}

/// Distance-to-goal table built by breadth-first search from the goal.
pub(crate) struct Pruning {
    coord: Coord,
    table: Nibbles,
    pub(crate) max_distance: u8,
}

impl Pruning {
    fn build(coord: Coord, mv: &MoveTables) -> Pruning {
        let size = coord.size();
        let mut table = Nibbles::new(size);
        let goal_edges: [u8; 5] = [8, 10, 12, 14, 16]; // pieces 4..=8 at home, unflipped
        table.set(coord.rank(&goal_edges, 12), 0); // corner piece 4 at pos 4
        let mut filled = 1usize;
        let mut depth = 0u8;
        while filled < size && depth < 14 {
            let mut changed = false;
            for idx in 0..size {
                if table.get(idx) != depth {
                    continue;
                }
                let (edges, corner) = coord.unrank(idx);
                for m in 0..FACE_MOVES {
                    let mut ne = [0u8; 5];
                    for k in 0..coord.n_edges {
                        ne[k] = mv.edge[m][edges[k] as usize];
                    }
                    let nc = if coord.corner {
                        mv.corner[m][corner as usize]
                    } else {
                        0
                    };
                    let j = coord.rank(&ne, nc);
                    if table.get(j) == 0xF {
                        table.set(j, depth + 1);
                        filled += 1;
                        changed = true;
                    }
                }
            }
            if !changed {
                break;
            }
            depth += 1;
        }
        Pruning {
            coord,
            table,
            max_distance: depth,
        }
    }

    #[inline]
    pub(crate) fn get(&self, edges: &[u8], corner: u8) -> u8 {
        self.table.get(self.coord.rank(edges, corner))
    }

    pub(crate) fn entries(&self) -> usize {
        self.coord.size()
    }

    pub(crate) fn bytes(&self) -> usize {
        self.table.bytes()
    }
}

/// Per-move coordinate transitions for single pieces.
pub(crate) struct MoveTables {
    pub(crate) edge: [[u8; 24]; FACE_MOVES],
    pub(crate) corner: [[u8; 24]; FACE_MOVES],
}

fn face_move(m: usize) -> Move {
    Move::from_index(m).expect("face move index")
}

impl MoveTables {
    fn build() -> MoveTables {
        let mut edge = [[0u8; 24]; FACE_MOVES];
        let mut corner = [[0u8; 24]; FACE_MOVES];
        for m in 0..FACE_MOVES {
            let mc = move_cube(face_move(m));
            for x in 0..24 {
                let (p, o) = (x / 2, x % 2);
                let q = mc
                    .edge_perm()
                    .iter()
                    .position(|&v| v as usize == p)
                    .unwrap();
                edge[m][x] = (q * 2 + ((o + mc.edge_ori()[q] as usize) & 1)) as u8;
                let (p, o) = (x / 3, x % 3);
                let q = mc
                    .corner_perm()
                    .iter()
                    .position(|&v| v as usize == p)
                    .unwrap();
                corner[m][x] = (q * 3 + (o + mc.corner_ori()[q] as usize) % 3) as u8;
            }
        }
        MoveTables { edge, corner }
    }
}

/// Conjugation of tracked coordinates by a rotation `Y` (t = Y^-1 s Y):
/// `edge[piece][coord] = (new piece, new coord)`.
pub(crate) struct Conj {
    pub(crate) edge: [[(u8, u8); 24]; 12],
    pub(crate) corner: [[(u8, u8); 24]; 8],
}

impl Conj {
    fn new(y: &Cube) -> Conj {
        let a = y.inverse();
        let pos_of = |perm: &[u8], p: usize| perm.iter().position(|&v| v as usize == p).unwrap();
        let edge = std::array::from_fn(|q| {
            std::array::from_fn(|x| {
                let (p, o) = (x / 2, x % 2);
                let i = pos_of(y.edge_perm(), p);
                let flip = (a.edge_ori()[q] as usize + o + y.edge_ori()[i] as usize) & 1;
                (a.edge_perm()[q], (i * 2 + flip) as u8)
            })
        });
        let corner = std::array::from_fn(|q| {
            std::array::from_fn(|x| {
                let (p, o) = (x / 3, x % 3);
                let i = pos_of(y.corner_perm(), p);
                let tw = (a.corner_ori()[q] as usize + o + y.corner_ori()[i] as usize) % 3;
                (a.corner_perm()[q], (i * 3 + tw) as u8)
            })
        });
        Conj { edge, corner }
    }
}

/// A reference frame for one cross color.
pub(crate) struct Frame {
    /// Rotation `G` taking the cross face to D.
    pub(crate) g: Cube,
    pub(crate) g_inv: Cube,
    /// Canonical move -> actual move (`G m G^-1`), for all 54 moves.
    pub(crate) to_actual: [Move; Move::COUNT],
    /// Actual edge position of each canonical edge position.
    pub(crate) edge_pos: [u8; 12],
}

pub(crate) struct Tables {
    pub(crate) mv: MoveTables,
    pub(crate) cross: Pruning,
    /// Cross edges + FR edge.
    pub(crate) pair_edge: Pruning,
    /// Cross edges + DFR corner.
    pub(crate) pair_corner: Pruning,
    /// `slot_conj[j]` maps slot j's pieces onto the FR pieces.
    pub(crate) slot_conj: [Conj; 4],
    /// Indexed by cross color (face index U R F D L B).
    pub(crate) frames: [Frame; 6],
    pub(crate) build_time: Option<Duration>,
}

static TABLES: OnceLock<Tables> = OnceLock::new();

pub(crate) fn tables() -> &'static Tables {
    TABLES.get_or_init(Tables::build)
}

fn rotations() -> Vec<Cube> {
    let x = *move_cube(Move::new(MoveBase::X, 1).unwrap());
    let y = *move_cube(Move::new(MoveBase::Y, 1).unwrap());
    let mut all = vec![Cube::SOLVED];
    let mut i = 0;
    while i < all.len() {
        for g in [&x, &y] {
            let n = all[i].multiply(g);
            if !all.contains(&n) {
                all.push(n);
            }
        }
        i += 1;
    }
    all
}

fn build_frame(rotations: &[Cube], color: usize) -> Frame {
    let g = *rotations
        .iter()
        .find(|g| g.centers()[3] as usize == color)
        .expect("a rotation brings every face to D");
    let g_inv = g.inverse();
    let to_actual = std::array::from_fn(|m| {
        let mv = Move::from_index(m).expect("move index");
        let target = g.multiply(move_cube(mv)).multiply(&g_inv);
        Move::all()
            .find(|&n| *move_cube(n) == target)
            .expect("conjugate of a move is a move of the same kind")
    });
    Frame {
        g,
        g_inv,
        to_actual,
        edge_pos: *g.edge_perm(),
    }
}

impl Tables {
    fn build() -> Tables {
        #[cfg(not(target_arch = "wasm32"))]
        let start = std::time::Instant::now();
        let mv = MoveTables::build();
        let cross = Pruning::build(
            Coord {
                n_edges: 4,
                corner: false,
            },
            &mv,
        );
        let pair_edge = Pruning::build(
            Coord {
                n_edges: 5,
                corner: false,
            },
            &mv,
        );
        let pair_corner = Pruning::build(
            Coord {
                n_edges: 4,
                corner: true,
            },
            &mv,
        );
        let y = *move_cube(Move::new(MoveBase::Y, 1).unwrap());
        let ys: Vec<Cube> = (0..4)
            .scan(Cube::SOLVED, |acc, _| {
                let cur = *acc;
                *acc = acc.multiply(&y);
                Some(cur)
            })
            .collect();
        let slot_conj = std::array::from_fn(|j| {
            let (cj, ej) = SLOTS[j];
            ys.iter()
                .map(Conj::new)
                .find(|c| c.edge[ej][ej * 2].0 == 8 && c.corner[cj][cj * 3].0 == 4)
                .expect("some y^k maps the slot onto FR")
        });
        let rots = rotations();
        let frames = std::array::from_fn(|c| build_frame(&rots, c));
        #[cfg(not(target_arch = "wasm32"))]
        let build_time = Some(start.elapsed());
        #[cfg(target_arch = "wasm32")]
        let build_time = None;
        Tables {
            mv,
            cross,
            pair_edge,
            pair_corner,
            slot_conj,
            frames,
            build_time,
        }
    }
}

/// Size and build cost of the lazily built tables.
#[derive(Clone, Debug)]
pub struct TableStats {
    pub cross_entries: usize,
    pub cross_bytes: usize,
    pub cross_max_distance: u8,
    pub pair_edge_entries: usize,
    pub pair_edge_bytes: usize,
    pub pair_edge_max_distance: u8,
    pub pair_corner_entries: usize,
    pub pair_corner_bytes: usize,
    pub pair_corner_max_distance: u8,
    /// All pruning tables together.
    pub total_bytes: usize,
    /// Time to build every table (native only).
    pub build_time: Option<Duration>,
}

/// Build the tables now (if not yet built) and report their size.
pub fn table_stats() -> TableStats {
    let t = tables();
    TableStats {
        cross_entries: t.cross.entries(),
        cross_bytes: t.cross.bytes(),
        cross_max_distance: t.cross.max_distance,
        pair_edge_entries: t.pair_edge.entries(),
        pair_edge_bytes: t.pair_edge.bytes(),
        pair_edge_max_distance: t.pair_edge.max_distance,
        pair_corner_entries: t.pair_corner.entries(),
        pair_corner_bytes: t.pair_corner.bytes(),
        pair_corner_max_distance: t.pair_corner.max_distance,
        total_bytes: t.cross.bytes() + t.pair_edge.bytes() + t.pair_corner.bytes(),
        build_time: t.build_time,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rank_unrank_round_trip() {
        for coord in [
            Coord {
                n_edges: 4,
                corner: false,
            },
            Coord {
                n_edges: 5,
                corner: false,
            },
            Coord {
                n_edges: 4,
                corner: true,
            },
        ] {
            for idx in (0..coord.size()).step_by(997) {
                let (e, c) = coord.unrank(idx);
                assert_eq!(coord.rank(&e, c), idx);
            }
        }
    }

    #[test]
    fn coordinate_moves_agree_with_cube() {
        let t = tables();
        for m in 0..FACE_MOVES {
            let c = Cube::SOLVED.apply(face_move(m));
            for piece in 0..12 {
                let pos = c
                    .edge_perm()
                    .iter()
                    .position(|&v| v as usize == piece)
                    .unwrap();
                let x = pos * 2 + c.edge_ori()[pos] as usize;
                assert_eq!(t.mv.edge[m][piece * 2] as usize, x);
            }
        }
    }

    #[test]
    fn rotations_are_24() {
        assert_eq!(rotations().len(), 24);
    }
}
