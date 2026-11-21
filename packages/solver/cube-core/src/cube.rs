//! Cubie-level cube state and precomputed move tables.
//!
//! Representation ("replaced-by", as in Kociemba's two-phase solver):
//! `cp[i]` is the corner piece sitting at corner position `i`, `co[i]` its
//! twist (0..=2); `ep`/`eo` likewise for edges (flip 0..=1) and `centers[i]`
//! is the center piece at center position `i`. Applying move `m` to state
//! `s` is the product `s * m`.
//!
//! Corner order: URF UFL ULB UBR DFR DLF DBL DRB.
//! Edge order:   UR UF UL UB DR DF DL DB FR FL BL BR.
//! Center order: U R F D L B.

use std::sync::OnceLock;

use crate::error::StateError;
use crate::geometry::{apply_permutation, layer_permutation, FACE_NORMAL};
use crate::moves::{Move, MoveBase};

/// Face letters in sticker-string order.
pub const FACE_CHARS: [char; 6] = ['U', 'R', 'F', 'D', 'L', 'B'];

/// Solved 54-sticker string.
pub const SOLVED_STICKERS: &str = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

/// Sticker index of each center, in center order.
pub const CENTER_FACELETS: [usize; 6] = [4, 13, 22, 31, 40, 49];

/// Sticker indices of each corner position, reference (U/D) sticker first,
/// then clockwise.
pub const CORNER_FACELETS: [[usize; 3]; 8] = [
    [8, 9, 20],
    [6, 18, 38],
    [0, 36, 47],
    [2, 45, 11],
    [29, 26, 15],
    [27, 44, 24],
    [33, 53, 42],
    [35, 17, 51],
];

/// Sticker indices of each edge position, reference sticker first.
pub const EDGE_FACELETS: [[usize; 2]; 12] = [
    [5, 10],
    [7, 19],
    [3, 37],
    [1, 46],
    [32, 16],
    [28, 25],
    [30, 43],
    [34, 52],
    [23, 12],
    [21, 41],
    [50, 39],
    [48, 14],
];

/// Colors (face indices) of each corner piece, in facelet order.
pub const CORNER_COLORS: [[u8; 3]; 8] = [
    [0, 1, 2],
    [0, 2, 4],
    [0, 4, 5],
    [0, 5, 1],
    [3, 2, 1],
    [3, 4, 2],
    [3, 5, 4],
    [3, 1, 5],
];

/// Colors (face indices) of each edge piece, in facelet order.
pub const EDGE_COLORS: [[u8; 2]; 12] = [
    [0, 1],
    [0, 2],
    [0, 4],
    [0, 5],
    [3, 1],
    [3, 2],
    [3, 4],
    [3, 5],
    [2, 1],
    [2, 4],
    [5, 4],
    [5, 1],
];

/// A 3x3x3 cube state at cubie level, including the six centers.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Cube {
    cp: [u8; 8],
    co: [u8; 8],
    ep: [u8; 12],
    eo: [u8; 12],
    centers: [u8; 6],
}

impl Default for Cube {
    fn default() -> Self {
        Cube::SOLVED
    }
}

impl Cube {
    pub const SOLVED: Cube = Cube {
        cp: [0, 1, 2, 3, 4, 5, 6, 7],
        co: [0; 8],
        ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        eo: [0; 12],
        centers: [0, 1, 2, 3, 4, 5],
    };

    /// Build a state from raw cubie arrays, validating it.
    pub fn from_parts(
        cp: [u8; 8],
        co: [u8; 8],
        ep: [u8; 12],
        eo: [u8; 12],
        centers: [u8; 6],
    ) -> Result<Cube, StateError> {
        let cube = Cube {
            cp,
            co,
            ep,
            eo,
            centers,
        };
        cube.verify()?;
        Ok(cube)
    }

    pub fn corner_perm(&self) -> &[u8; 8] {
        &self.cp
    }
    pub fn corner_ori(&self) -> &[u8; 8] {
        &self.co
    }
    pub fn edge_perm(&self) -> &[u8; 12] {
        &self.ep
    }
    pub fn edge_ori(&self) -> &[u8; 12] {
        &self.eo
    }
    pub fn centers(&self) -> &[u8; 6] {
        &self.centers
    }

    /// `self * other`: the state after applying `other` to `self`.
    pub fn multiply(&self, other: &Cube) -> Cube {
        let mut r = Cube::SOLVED;
        for i in 0..8 {
            let src = other.cp[i] as usize;
            r.cp[i] = self.cp[src];
            r.co[i] = (self.co[src] + other.co[i]) % 3;
        }
        for i in 0..12 {
            let src = other.ep[i] as usize;
            r.ep[i] = self.ep[src];
            r.eo[i] = (self.eo[src] + other.eo[i]) & 1;
        }
        for i in 0..6 {
            r.centers[i] = self.centers[other.centers[i] as usize];
        }
        r
    }

    /// Group inverse: `c.multiply(&c.inverse()) == Cube::SOLVED`.
    pub fn inverse(&self) -> Cube {
        let mut r = Cube::SOLVED;
        for i in 0..8 {
            let p = self.cp[i] as usize;
            r.cp[p] = i as u8;
            r.co[p] = (3 - self.co[i]) % 3;
        }
        for i in 0..12 {
            let p = self.ep[i] as usize;
            r.ep[p] = i as u8;
            r.eo[p] = self.eo[i];
        }
        for i in 0..6 {
            r.centers[self.centers[i] as usize] = i as u8;
        }
        r
    }

    /// Apply a single move.
    pub fn apply(&self, m: Move) -> Cube {
        self.multiply(move_cube(m))
    }

    /// Apply moves in order.
    pub fn apply_moves(&self, moves: &[Move]) -> Cube {
        moves.iter().fold(*self, |c, &m| c.apply(m))
    }

    /// The state reached from solved by `moves`.
    pub fn from_moves(moves: &[Move]) -> Cube {
        Cube::SOLVED.apply_moves(moves)
    }

    /// Exactly solved, in the reference orientation (U center on top, F in front).
    pub fn is_solved(&self) -> bool {
        *self == Cube::SOLVED
    }

    /// Every face shows a single color (solved in any whole-cube orientation).
    pub fn is_solved_any_orientation(&self) -> bool {
        let s = self.to_sticker_array();
        (0..6).all(|f| s[f * 9..f * 9 + 9].iter().all(|&c| c == s[f * 9 + 4]))
    }

    /// Check that this state is reachable by legal moves and rotations.
    pub fn verify(&self) -> Result<(), StateError> {
        let mut seen = [false; 12];
        for &p in &self.cp {
            let p = p as usize;
            if p >= 8 || seen[p] {
                return Err(if p >= 8 {
                    StateError::InvalidCorner { position: p }
                } else {
                    StateError::DuplicateCorner { piece: p }
                });
            }
            seen[p] = true;
        }
        seen = [false; 12];
        for &p in &self.ep {
            let p = p as usize;
            if p >= 12 || seen[p] {
                return Err(if p >= 12 {
                    StateError::InvalidEdge { position: p }
                } else {
                    StateError::DuplicateEdge { piece: p }
                });
            }
            seen[p] = true;
        }
        if self.co.iter().any(|&o| o > 2) {
            return Err(StateError::CornerTwist {
                sum: self.co.iter().map(|&o| o as u32).sum(),
            });
        }
        if self.eo.iter().any(|&o| o > 1) {
            return Err(StateError::EdgeFlip {
                sum: self.eo.iter().map(|&o| o as u32).sum(),
            });
        }
        if !tables().center_orientations.contains(&self.centers) {
            return Err(StateError::InvalidCenters);
        }
        let twist: u32 = self.co.iter().map(|&o| o as u32).sum();
        if !twist.is_multiple_of(3) {
            return Err(StateError::CornerTwist { sum: twist });
        }
        let flip: u32 = self.eo.iter().map(|&o| o as u32).sum();
        if !flip.is_multiple_of(2) {
            return Err(StateError::EdgeFlip { sum: flip });
        }
        // Whole-cube rotations are odd on edges and centers together, so the
        // invariant includes the center permutation parity.
        if parity(&self.cp) ^ parity(&self.ep) ^ parity(&self.centers) {
            return Err(StateError::Parity);
        }
        Ok(())
    }

    /// Parse a 54-character URFDLB sticker string and validate it.
    pub fn from_stickers(s: &str) -> Result<Cube, StateError> {
        let chars: Vec<char> = s.chars().collect();
        if chars.len() != 54 {
            return Err(StateError::InvalidLength(chars.len()));
        }
        let mut f = [0u8; 54];
        let mut counts = [0usize; 6];
        for (i, &ch) in chars.iter().enumerate() {
            let c = FACE_CHARS
                .iter()
                .position(|&x| x == ch)
                .ok_or(StateError::InvalidColor {
                    index: i,
                    found: ch,
                })?;
            f[i] = c as u8;
            counts[c] += 1;
        }
        for (c, &n) in counts.iter().enumerate() {
            if n != 9 {
                return Err(StateError::ColorCount {
                    color: FACE_CHARS[c],
                    count: n,
                });
            }
        }
        let cube = cube_from_facelets(&f)?;
        cube.verify()?;
        Ok(cube)
    }

    /// 54-character URFDLB sticker string.
    pub fn to_stickers(&self) -> String {
        self.to_sticker_array()
            .iter()
            .map(|&c| FACE_CHARS[c as usize])
            .collect()
    }

    /// Stickers as face indices (0..6) in URFDLB order.
    pub fn to_sticker_array(&self) -> [u8; 54] {
        let mut f = [0u8; 54];
        for i in 0..6 {
            f[CENTER_FACELETS[i]] = self.centers[i];
        }
        for i in 0..8 {
            let j = self.cp[i] as usize;
            let o = self.co[i] as usize;
            for n in 0..3 {
                f[CORNER_FACELETS[i][(n + o) % 3]] = CORNER_COLORS[j][n];
            }
        }
        for i in 0..12 {
            let j = self.ep[i] as usize;
            let o = self.eo[i] as usize;
            for n in 0..2 {
                f[EDGE_FACELETS[i][(n + o) % 2]] = EDGE_COLORS[j][n];
            }
        }
        f
    }
}

/// `true` if the permutation is odd.
fn parity(p: &[u8]) -> bool {
    let mut odd = false;
    for i in 0..p.len() {
        for j in i + 1..p.len() {
            if p[i] > p[j] {
                odd = !odd;
            }
        }
    }
    odd
}

/// Facelets (face indices) to cubies, without the reachability checks.
fn cube_from_facelets(f: &[u8; 54]) -> Result<Cube, StateError> {
    let mut cube = Cube::SOLVED;
    for i in 0..6 {
        cube.centers[i] = f[CENTER_FACELETS[i]];
    }
    let mut seen_c = [false; 8];
    for (i, fl) in CORNER_FACELETS.iter().enumerate() {
        let ori = (0..3)
            .find(|&o| f[fl[o]] == 0 || f[fl[o]] == 3)
            .ok_or(StateError::InvalidCorner { position: i })?;
        let c1 = f[fl[(ori + 1) % 3]];
        let c2 = f[fl[(ori + 2) % 3]];
        let c0 = f[fl[ori]];
        let j = (0..8)
            .find(|&j| CORNER_COLORS[j] == [c0, c1, c2])
            .ok_or(StateError::InvalidCorner { position: i })?;
        if seen_c[j] {
            return Err(StateError::DuplicateCorner { piece: j });
        }
        seen_c[j] = true;
        cube.cp[i] = j as u8;
        cube.co[i] = ori as u8;
    }
    let mut seen_e = [false; 12];
    for i in 0..12 {
        let a = f[EDGE_FACELETS[i][0]];
        let b = f[EDGE_FACELETS[i][1]];
        let (j, o) = (0..12)
            .find_map(|j| {
                if EDGE_COLORS[j] == [a, b] {
                    Some((j, 0))
                } else if EDGE_COLORS[j] == [b, a] {
                    Some((j, 1))
                } else {
                    None
                }
            })
            .ok_or(StateError::InvalidEdge { position: i })?;
        if seen_e[j] {
            return Err(StateError::DuplicateEdge { piece: j });
        }
        seen_e[j] = true;
        cube.ep[i] = j as u8;
        cube.eo[i] = o;
    }
    Ok(cube)
}

struct Tables {
    moves: [Cube; Move::COUNT],
    center_orientations: Vec<[u8; 6]>,
}

static TABLES: OnceLock<Tables> = OnceLock::new();

fn tables() -> &'static Tables {
    TABLES.get_or_init(build_tables)
}

/// The precomputed cube for a move (built once, on first use).
pub fn move_cube(m: Move) -> &'static Cube {
    &tables().moves[m.index()]
}

fn solved_facelets() -> [u8; 54] {
    let mut f = [0u8; 54];
    for (i, x) in f.iter_mut().enumerate() {
        *x = (i / 9) as u8;
    }
    f
}

fn cube_from_perm(perm: &[u8; 54]) -> Cube {
    let f = apply_permutation(&solved_facelets(), perm);
    cube_from_facelets(&f).expect("geometric move yields a valid cube")
}

fn power(c: &Cube, n: u8) -> Cube {
    (0..n).fold(Cube::SOLVED, |acc, _| acc.multiply(c))
}

fn compose(parts: &[(&Cube, u8)]) -> Cube {
    parts
        .iter()
        .fold(Cube::SOLVED, |acc, (c, n)| acc.multiply(&power(c, *n)))
}

fn build_tables() -> Tables {
    use MoveBase::*;
    // Primitives from 3D geometry: six outer layers and three rotations.
    let face = |f: usize| cube_from_perm(&layer_permutation(FACE_NORMAL[f], Some(1)));
    let (u, r, fr, d, l, b) = (face(0), face(1), face(2), face(3), face(4), face(5));
    let x = cube_from_perm(&layer_permutation(FACE_NORMAL[1], None));
    let y = cube_from_perm(&layer_permutation(FACE_NORMAL[0], None));
    let z = cube_from_perm(&layer_permutation(FACE_NORMAL[2], None));

    // Slices and wide turns are *defined* as face turns plus a rotation;
    // centers therefore only ever move through x/y/z.
    let quarter = |base: MoveBase| -> Cube {
        match base {
            U => u,
            R => r,
            F => fr,
            D => d,
            L => l,
            B => b,
            X => x,
            Y => y,
            Z => z,
            M => compose(&[(&r, 1), (&l, 3), (&x, 3)]), // M = R L' x'
            E => compose(&[(&u, 1), (&d, 3), (&y, 3)]), // E = U D' y'
            S => compose(&[(&fr, 3), (&b, 1), (&z, 1)]), // S = F' B z
            Rw => compose(&[(&l, 1), (&x, 1)]),         // r = L x
            Lw => compose(&[(&r, 1), (&x, 3)]),         // l = R x'
            Uw => compose(&[(&d, 1), (&y, 1)]),         // u = D y
            Dw => compose(&[(&u, 1), (&y, 3)]),         // d = U y'
            Fw => compose(&[(&b, 1), (&z, 1)]),         // f = B z
            Bw => compose(&[(&fr, 1), (&z, 3)]),        // b = F z'
        }
    };

    let mut moves = [Cube::SOLVED; Move::COUNT];
    for base in MoveBase::ALL {
        let q = quarter(base);
        for turns in 1..=3u8 {
            let m = Move::new(base, turns).expect("non-zero turn");
            moves[m.index()] = power(&q, turns);
        }
    }

    // The 24 whole-cube orientations, as center arrangements.
    let mut center_orientations = vec![Cube::SOLVED.centers];
    let mut i = 0;
    while i < center_orientations.len() {
        let c = center_orientations[i];
        for g in [&x, &y] {
            let mut n = [0u8; 6];
            for k in 0..6 {
                n[k] = c[g.centers[k] as usize];
            }
            if !center_orientations.contains(&n) {
                center_orientations.push(n);
            }
        }
        i += 1;
    }

    Tables {
        moves,
        center_orientations,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::moves::parse_moves;

    fn mv(s: &str) -> Move {
        s.parse().unwrap()
    }

    /// Well-known cubie tables from Kociemba's two-phase solver, written out
    /// by hand: an independent check of the geometry-derived tables.
    #[test]
    fn face_moves_match_kociemba_reference_tables() {
        type Row = (&'static str, [u8; 8], [u8; 8], [u8; 12], [u8; 12]);
        let reference: [Row; 6] = [
            (
                "U",
                [3, 0, 1, 2, 4, 5, 6, 7],
                [0; 8],
                [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
                [0; 12],
            ),
            (
                "R",
                [4, 1, 2, 0, 7, 5, 6, 3],
                [2, 0, 0, 1, 1, 0, 0, 2],
                [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
                [0; 12],
            ),
            (
                "F",
                [1, 5, 2, 3, 0, 4, 6, 7],
                [1, 2, 0, 0, 2, 1, 0, 0],
                [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
                [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
            ),
            (
                "D",
                [0, 1, 2, 3, 5, 6, 7, 4],
                [0; 8],
                [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11],
                [0; 12],
            ),
            (
                "L",
                [0, 2, 6, 3, 4, 1, 5, 7],
                [0, 1, 2, 0, 0, 2, 1, 0],
                [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11],
                [0; 12],
            ),
            (
                "B",
                [0, 1, 3, 7, 4, 5, 2, 6],
                [0, 0, 1, 2, 0, 0, 2, 1],
                [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7],
                [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
            ),
        ];
        for (name, cp, co, ep, eo) in reference {
            let c = move_cube(mv(name));
            assert_eq!(c.cp, cp, "{name} cp");
            assert_eq!(c.co, co, "{name} co");
            assert_eq!(c.ep, ep, "{name} ep");
            assert_eq!(c.eo, eo, "{name} eo");
            assert_eq!(c.centers, [0, 1, 2, 3, 4, 5], "{name} centers");
        }
    }

    /// Slices and wide moves are composed from faces + rotations; check that
    /// the composition equals the direct geometric layer turn.
    #[test]
    fn composed_moves_match_direct_geometry() {
        let solved = solved_facelets();
        let slice = |axis: usize| {
            apply_permutation(&solved, &layer_permutation(FACE_NORMAL[axis], Some(0)))
        };
        let cases = [("M", slice(4)), ("E", slice(3)), ("S", slice(2))];
        for (name, f) in cases {
            assert_eq!(Cube::SOLVED.apply(mv(name)).to_sticker_array(), f, "{name}");
        }
        // Wide = outer layer + slice, both geometric.
        let wide = [
            ("r", 1, 4, true),
            ("l", 4, 4, false),
            ("u", 0, 3, true),
            ("d", 3, 3, false),
            ("f", 2, 2, false),
            ("b", 5, 2, true),
        ];
        for (name, outer, slice_axis, slice_inverted) in wide {
            let mut f = apply_permutation(&solved, &layer_permutation(FACE_NORMAL[outer], Some(1)));
            let sp = layer_permutation(FACE_NORMAL[slice_axis], Some(0));
            for _ in 0..if slice_inverted { 3 } else { 1 } {
                f = apply_permutation(&f, &sp);
            }
            assert_eq!(Cube::SOLVED.apply(mv(name)).to_sticker_array(), f, "{name}");
        }
    }

    #[test]
    fn there_are_24_center_orientations() {
        assert_eq!(tables().center_orientations.len(), 24);
    }

    #[test]
    fn sequence_helper_works() {
        let c = Cube::from_moves(&parse_moves("R U R' U'").unwrap());
        assert!(!c.is_solved());
    }
}

#[cfg(feature = "serde")]
mod serde_impl {
    use super::Cube;
    use serde::{de, Deserialize, Deserializer, Serialize, Serializer};

    /// Serialized as its 54-sticker `URFDLB` string.
    impl Serialize for Cube {
        fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
            s.serialize_str(&self.to_stickers())
        }
    }

    impl<'de> Deserialize<'de> for Cube {
        fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
            let s = String::deserialize(d)?;
            Cube::from_stickers(&s).map_err(de::Error::custom)
        }
    }
}
