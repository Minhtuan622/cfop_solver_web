//! Error types.

use std::fmt;

/// Reason a move token could not be parsed.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ParseErrorKind {
    /// The token does not start with a known move family.
    UnknownMove,
    /// The family is known but the suffix is not (e.g. `R4`, `U''`).
    InvalidSuffix(String),
}

/// A move-parsing error, pointing at the offending token.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ParseError {
    /// The offending token, verbatim.
    pub token: String,
    /// Zero-based index of the token in the sequence.
    pub token_index: usize,
    /// Byte offset of the token in the input string.
    pub byte_offset: usize,
    pub kind: ParseErrorKind,
}

impl ParseError {
    pub(crate) fn unknown_move(token: &str, token_index: usize, byte_offset: usize) -> Self {
        ParseError {
            token: token.to_string(),
            token_index,
            byte_offset,
            kind: ParseErrorKind::UnknownMove,
        }
    }

    pub(crate) fn invalid_suffix(
        token: &str,
        token_index: usize,
        byte_offset: usize,
        suffix: &str,
    ) -> Self {
        ParseError {
            token: token.to_string(),
            token_index,
            byte_offset,
            kind: ParseErrorKind::InvalidSuffix(suffix.to_string()),
        }
    }
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match &self.kind {
            ParseErrorKind::UnknownMove => write!(
                f,
                "invalid move '{}' at token {} (byte {}): unknown move; expected one of U R F D L B M E S x y z u r f d l b (or Uw, Rw, ...)",
                self.token,
                self.token_index + 1,
                self.byte_offset
            ),
            ParseErrorKind::InvalidSuffix(s) => write!(
                f,
                "invalid move '{}' at token {} (byte {}): unknown suffix '{}'; expected none, ', 2, 2' or 3",
                self.token,
                self.token_index + 1,
                self.byte_offset,
                s
            ),
        }
    }
}

impl std::error::Error for ParseError {}

/// Why a 54-sticker string (or cubie data) does not describe a reachable cube.
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum StateError {
    /// Input is not exactly 54 characters.
    InvalidLength(usize),
    /// Character outside `URFDLB`.
    InvalidColor { index: usize, found: char },
    /// A color does not appear exactly 9 times.
    ColorCount { color: char, count: usize },
    /// The six centers are not a rotation of the solved centers.
    InvalidCenters,
    /// A corner position holds a sticker combination that is not a corner.
    InvalidCorner { position: usize },
    /// An edge position holds a sticker combination that is not an edge.
    InvalidEdge { position: usize },
    /// The same corner piece appears more than once.
    DuplicateCorner { piece: usize },
    /// The same edge piece appears more than once.
    DuplicateEdge { piece: usize },
    /// Sum of corner twists is not divisible by 3.
    CornerTwist { sum: u32 },
    /// Sum of edge flips is odd.
    EdgeFlip { sum: u32 },
    /// Permutation parity mismatch (e.g. two edges swapped).
    Parity,
}

impl fmt::Display for StateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StateError::InvalidLength(n) => write!(f, "expected 54 stickers, got {n}"),
            StateError::InvalidColor { index, found } => {
                write!(
                    f,
                    "invalid sticker '{found}' at index {index}; expected one of URFDLB"
                )
            }
            StateError::ColorCount { color, count } => {
                write!(f, "color '{color}' appears {count} times; expected 9")
            }
            StateError::InvalidCenters => write!(f, "centers are not a valid cube orientation"),
            StateError::InvalidCorner { position } => {
                write!(f, "corner position {position} does not hold a valid corner")
            }
            StateError::InvalidEdge { position } => {
                write!(f, "edge position {position} does not hold a valid edge")
            }
            StateError::DuplicateCorner { piece } => write!(f, "corner {piece} appears twice"),
            StateError::DuplicateEdge { piece } => write!(f, "edge {piece} appears twice"),
            StateError::CornerTwist { sum } => {
                write!(
                    f,
                    "corner twist sum {sum} is not divisible by 3 (a corner is twisted)"
                )
            }
            StateError::EdgeFlip { sum } => {
                write!(f, "edge flip sum {sum} is odd (an edge is flipped)")
            }
            StateError::Parity => write!(f, "permutation parity mismatch (two pieces swapped)"),
        }
    }
}

impl std::error::Error for StateError {}
