use std::fmt;

use crate::error::ParseError;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub enum MoveBase {
    U,
    R,
    F,
    D,
    L,
    B,
    M,
    E,
    S,
    X,
    Y,
    Z,
    Uw,
    Rw,
    Fw,
    Dw,
    Lw,
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

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord)]
pub struct Move {
    base: MoveBase,
    turns: u8,
}

impl Move {
    pub const COUNT: usize = 54;

    pub const fn new(base: MoveBase, turns: u8) -> Option<Move> {
        match turns % 4 {
            0 => None,
            t => Some(Move { base, turns: t }),
        }
    }

    pub const fn base(self) -> MoveBase {
        self.base
    }

    pub const fn turns(self) -> u8 {
        self.turns
    }

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

pub fn invert_moves(moves: &[Move]) -> Vec<Move> {
    moves.iter().rev().map(|m| m.inverse()).collect()
}

pub fn simplify_moves(moves: &[Move]) -> Vec<Move> {
    let mut out: Vec<Move> = Vec::with_capacity(moves.len());
    for &m in moves {
        match out.last() {
            Some(&last) if last.base == m.base => {
                out.pop();
                if let Some(merged) = Move::new(m.base, last.turns + m.turns) {
                    out.push(merged);
                }
            }
            _ => out.push(m),
        }
    }
    out
}

#[cfg(feature = "serde")]
mod serde_impl {
    use super::Move;
    use serde::{de, Deserialize, Deserializer, Serialize, Serializer};

    impl Serialize for Move {
        fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
            s.collect_str(self)
        }
    }

    impl<'de> Deserialize<'de> for Move {
        fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
            let s = String::deserialize(d)?;
            s.parse().map_err(de::Error::custom)
        }
    }
}
