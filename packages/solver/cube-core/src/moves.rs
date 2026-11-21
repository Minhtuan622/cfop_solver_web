//! Move notation, parsing and formatting.

use std::fmt;

use crate::error::ParseError;

/// The 18 move families. Index order is stable and used by move tables.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum MoveBase {
    U,
    R,
    F,
    D,
    L,
    B,
    /// Middle slice, turns like L.
    M,
    /// Equatorial slice, turns like D.
    E,
    /// Standing slice, turns like F.
    S,
    /// Whole-cube rotation like R.
    X,
    /// Whole-cube rotation like U.
    Y,
    /// Whole-cube rotation like F.
    Z,
    /// Wide U (u / Uw).
    Uw,
    /// Wide R (r / Rw).
    Rw,
    /// Wide F (f / Fw).
    Fw,
    /// Wide D (d / Dw).
    Dw,
    /// Wide L (l / Lw).
    Lw,
    /// Wide B (b / Bw).
    Bw,
}

impl MoveBase {
    pub const ALL: [MoveBase; 18] = [
        MoveBase::U,
        MoveBase::R,
        MoveBase::F,
        MoveBase::D,
        MoveBase::L,
        MoveBase::B,
        MoveBase::M,
        MoveBase::E,
        MoveBase::S,
        MoveBase::X,
        MoveBase::Y,
        MoveBase::Z,
        MoveBase::Uw,
        MoveBase::Rw,
        MoveBase::Fw,
        MoveBase::Dw,
        MoveBase::Lw,
        MoveBase::Bw,
    ];

    /// The six outer face turns.
    pub const FACES: [MoveBase; 6] = [
        MoveBase::U,
        MoveBase::R,
        MoveBase::F,
        MoveBase::D,
        MoveBase::L,
        MoveBase::B,
    ];

    pub const fn index(self) -> usize {
        self as usize
    }

    pub const fn is_face(self) -> bool {
        (self as usize) < 6
    }

    pub const fn is_slice(self) -> bool {
        matches!(self, MoveBase::M | MoveBase::E | MoveBase::S)
    }

    pub const fn is_rotation(self) -> bool {
        matches!(self, MoveBase::X | MoveBase::Y | MoveBase::Z)
    }

    pub const fn is_wide(self) -> bool {
        (self as usize) >= 12
    }

    /// Canonical spelling (wide moves use lowercase: `r`, not `Rw`).
    pub const fn symbol(self) -> &'static str {
        match self {
            MoveBase::U => "U",
            MoveBase::R => "R",
            MoveBase::F => "F",
            MoveBase::D => "D",
            MoveBase::L => "L",
            MoveBase::B => "B",
            MoveBase::M => "M",
            MoveBase::E => "E",
            MoveBase::S => "S",
            MoveBase::X => "x",
            MoveBase::Y => "y",
            MoveBase::Z => "z",
            MoveBase::Uw => "u",
            MoveBase::Rw => "r",
            MoveBase::Fw => "f",
            MoveBase::Dw => "d",
            MoveBase::Lw => "l",
            MoveBase::Bw => "b",
        }
    }

    fn from_symbol(s: &str) -> Option<MoveBase> {
        Some(match s {
            "U" => MoveBase::U,
            "R" => MoveBase::R,
            "F" => MoveBase::F,
            "D" => MoveBase::D,
            "L" => MoveBase::L,
            "B" => MoveBase::B,
            "M" => MoveBase::M,
            "E" => MoveBase::E,
            "S" => MoveBase::S,
            "x" | "X" => MoveBase::X,
            "y" | "Y" => MoveBase::Y,
            "z" | "Z" => MoveBase::Z,
            "u" | "Uw" => MoveBase::Uw,
            "r" | "Rw" => MoveBase::Rw,
            "f" | "Fw" => MoveBase::Fw,
            "d" | "Dw" => MoveBase::Dw,
            "l" | "Lw" => MoveBase::Lw,
            "b" | "Bw" => MoveBase::Bw,
            _ => return None,
        })
    }
}

/// A move: a family plus a number of clockwise quarter turns (1, 2 or 3).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Move {
    base: MoveBase,
    turns: u8,
}

impl Move {
    /// Number of distinct moves (18 families x 3 powers).
    pub const COUNT: usize = 54;

    /// `turns` is taken modulo 4; returns `None` for a zero turn.
    pub const fn new(base: MoveBase, turns: u8) -> Option<Move> {
        match turns % 4 {
            0 => None,
            t => Some(Move { base, turns: t }),
        }
    }

    pub const fn base(self) -> MoveBase {
        self.base
    }

    /// Clockwise quarter turns: 1, 2 or 3 (3 = prime).
    pub const fn turns(self) -> u8 {
        self.turns
    }

    /// Dense index in `0..Move::COUNT`.
    pub const fn index(self) -> usize {
        self.base.index() * 3 + self.turns as usize - 1
    }

    pub fn from_index(index: usize) -> Option<Move> {
        if index >= Self::COUNT {
            return None;
        }
        Some(Move {
            base: MoveBase::ALL[index / 3],
            turns: (index % 3) as u8 + 1,
        })
    }

    /// All 54 moves in index order.
    pub fn all() -> impl Iterator<Item = Move> {
        (0..Self::COUNT).filter_map(Move::from_index)
    }

    pub const fn inverse(self) -> Move {
        Move {
            base: self.base,
            turns: 4 - self.turns,
        }
    }
}

impl fmt::Display for Move {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let suffix = match self.turns {
            1 => "",
            2 => "2",
            _ => "'",
        };
        write!(f, "{}{}", self.base.symbol(), suffix)
    }
}

impl std::str::FromStr for Move {
    type Err = ParseError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        parse_token(s, 0, 0)
    }
}

fn parse_token(token: &str, index: usize, offset: usize) -> Result<Move, ParseError> {
    // Longest family prefix: two chars for "Rw" style, else one char.
    let (base, rest) = [2usize, 1]
        .iter()
        .filter(|&&n| token.is_char_boundary(n.min(token.len())) && token.len() >= n)
        .find_map(|&n| MoveBase::from_symbol(&token[..n]).map(|b| (b, &token[n..])))
        .ok_or_else(|| ParseError::unknown_move(token, index, offset))?;
    let turns = match rest {
        "" | "1" => 1,
        "2" | "2'" | "2\u{2019}" => 2,
        "'" | "\u{2019}" | "3" | "1'" => 3,
        _ => return Err(ParseError::invalid_suffix(token, index, offset, rest)),
    };
    Ok(Move { base, turns })
}

/// Parse a sequence such as `"R U R' U'"`.
///
/// Tokens are separated by whitespace or commas; parentheses are ignored
/// (they only group visually, e.g. `"(R U R' U') x2"` is *not* repetition).
/// Accepted suffixes: none, `'`, `2`, `2'`, `3` (= `'`), and the typographic
/// apostrophe `’`. Wide moves may be written `r` or `Rw`.
pub fn parse_moves(text: &str) -> Result<Vec<Move>, ParseError> {
    let mut moves = Vec::new();
    let mut index = 0;
    let mut offset = 0;
    for piece in text.split_inclusive(|c: char| c.is_whitespace() || matches!(c, ',' | '(' | ')')) {
        let token =
            piece.trim_end_matches(|c: char| c.is_whitespace() || matches!(c, ',' | '(' | ')'));
        if !token.is_empty() {
            moves.push(parse_token(token, index, offset)?);
            index += 1;
        }
        offset += piece.len();
    }
    Ok(moves)
}

/// Format moves separated by single spaces. No simplification is applied.
pub fn format_moves(moves: &[Move]) -> String {
    let mut out = String::new();
    for (i, m) in moves.iter().enumerate() {
        if i > 0 {
            out.push(' ');
        }
        out.push_str(&m.to_string());
    }
    out
}

/// Inverse of a move sequence.
pub fn invert_moves(moves: &[Move]) -> Vec<Move> {
    moves.iter().rev().map(|m| m.inverse()).collect()
}
