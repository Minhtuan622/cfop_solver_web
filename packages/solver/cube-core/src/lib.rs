//! `cube-core`: 3x3x3 Rubik's cube model for the CFOP solver.
//!
//! * [`Cube`]: cubie state (8 corners, 12 edges, 6 centers) with
//!   permutation + orientation, validated conversion to/from the
//!   54-sticker `URFDLB` string.
//! * [`Move`]: U R F D L B, M E S, x y z and wide u r f d l b, each with
//!   `''`, `'` and `2`; parsing and formatting of sequences.
//!
//! Move tables are built once (lazily) from 3D geometry for the six face
//! turns and the three rotations; slices and wide turns are compositions of
//! those (e.g. `M = R L' x'`).

#![forbid(unsafe_code)]

mod cube;
mod error;
mod geometry;
mod moves;

pub use cube::{
    move_cube, Cube, CENTER_FACELETS, CORNER_COLORS, CORNER_FACELETS, EDGE_COLORS, EDGE_FACELETS,
    FACE_CHARS, SOLVED_STICKERS,
};
pub use error::{ParseError, ParseErrorKind, StateError};
pub use moves::{format_moves, invert_moves, parse_moves, simplify_moves, Move, MoveBase};
