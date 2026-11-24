use std::fmt;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum ParseErrorKind {
    UnknownMove,
    InvalidSuffix(String),
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ParseError {
    pub token: String,
    pub token_index: usize,
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

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum StateError {
    InvalidLength(usize),
    InvalidColor { index: usize, found: char },
    ColorCount { color: char, count: usize },
    InvalidCenters,
    InvalidCorner { position: usize },
    InvalidEdge { position: usize },
    DuplicateCorner { piece: usize },
    DuplicateEdge { piece: usize },
    CornerTwist { sum: u32 },
    EdgeFlip { sum: u32 },
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
