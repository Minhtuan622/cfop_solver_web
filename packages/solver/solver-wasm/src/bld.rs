//! 3-Style 3BLD memo tracing with Speffz letters.
//!
//! The output document and the letter scheme (including its edge
//! lettering) are kept exactly as the Studio has always used them, verified
//! against frozen fixtures (`tests/fixtures/bld_reference.json`), so the
//! BLDDB lookups in the web client keep resolving the same keys.
//!
//! The analysis is a plan, never guessed moves: the browser resolves each
//! buffer-target-target execution key against a verified catalog.

use cube_core::{Cube, CORNER_COLORS, CORNER_FACELETS, EDGE_COLORS, EDGE_FACELETS};
use serde::Serialize;

/// Speffz letter -> sticker index (URFDLB 54-sticker order).
const EDGE_LOCATION: [(char, usize); 24] = [
    ('A', 1),
    ('B', 7),
    ('C', 3),
    ('D', 5),
    ('E', 37),
    ('F', 43),
    ('G', 39),
    ('H', 41),
    ('I', 19),
    ('J', 25),
    ('K', 21),
    ('L', 23),
    ('M', 10),
    ('N', 16),
    ('O', 12),
    ('P', 14),
    ('Q', 46),
    ('R', 52),
    ('S', 48),
    ('T', 50),
    ('U', 28),
    ('V', 34),
    ('W', 30),
    ('X', 32),
];
const CORNER_LOCATION: [(char, usize); 24] = [
    ('A', 0),
    ('B', 2),
    ('C', 6),
    ('D', 8),
    ('E', 36),
    ('F', 38),
    ('G', 42),
    ('H', 44),
    ('I', 18),
    ('J', 20),
    ('K', 24),
    ('L', 26),
    ('M', 9),
    ('N', 11),
    ('O', 15),
    ('P', 17),
    ('Q', 45),
    ('R', 47),
    ('S', 51),
    ('T', 53),
    ('U', 27),
    ('V', 29),
    ('W', 33),
    ('X', 35),
];
const EDGE_BUFFER: char = 'C';
const CORNER_BUFFER: char = 'A';

const EDGE_POSITIONS: [&str; 12] = [
    "UR", "UF", "UL", "UB", "DR", "DF", "DL", "DB", "FR", "FL", "BL", "BR",
];
const CORNER_POSITIONS: [&str; 8] = ["UFR", "UFL", "UBL", "UBR", "DFR", "DFL", "DBL", "DBR"];

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct BldCycle {
    pub buffer: String,
    pub targets: Vec<String>,
    pub cycle_break: bool,
    pub memo: String,
    pub execution_keys: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct BldPieces {
    pub cycles: Vec<BldCycle>,
    pub memo: Vec<String>,
    pub execution_keys: Vec<String>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct BldBuffer {
    pub letter: String,
    pub position: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct BldBuffers {
    pub edge: BldBuffer,
    pub corner: BldBuffer,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct CornerTwist {
    pub position: String,
    /// "cw" or "ccw".
    pub direction: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct BldSpecial {
    pub parity: bool,
    pub edge_flips: Vec<String>,
    pub corner_twists: Vec<CornerTwist>,
    pub edge_orientation_sum: u32,
    pub corner_orientation_sum: u32,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
pub struct BldCatalog {
    pub provider: String,
    pub source: String,
    pub note: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, tsify_next::Tsify)]
#[tsify(into_wasm_abi)]
pub struct BldAnalysis {
    pub method: String,
    pub buffers: BldBuffers,
    pub edges: BldPieces,
    pub corners: BldPieces,
    pub special: BldSpecial,
    pub solved: bool,
    pub catalog: BldCatalog,
}

fn label_of(location: &[(char, usize); 24], sticker: usize) -> char {
    location
        .iter()
        .find(|&&(_, s)| s == sticker)
        .map(|&(l, _)| l)
        .expect("every non-center sticker has a letter")
}

/// Letter -> letter of the sticker that currently sits there (where it
/// belongs), for edges or corners.
fn sticker_map(cube: &Cube, edges: bool) -> Vec<(char, char)> {
    let stickers = cube.to_sticker_array();
    let location = if edges {
        &EDGE_LOCATION
    } else {
        &CORNER_LOCATION
    };
    location
        .iter()
        .map(|&(letter, current)| {
            let label = if edges {
                let p = EDGE_FACELETS
                    .iter()
                    .position(|f| f.contains(&current))
                    .unwrap();
                let piece = cube.edge_perm()[p] as usize;
                let k = EDGE_COLORS[piece]
                    .iter()
                    .position(|&c| c == stickers[current])
                    .unwrap();
                label_of(location, EDGE_FACELETS[piece][k])
            } else {
                let p = CORNER_FACELETS
                    .iter()
                    .position(|f| f.contains(&current))
                    .unwrap();
                let piece = cube.corner_perm()[p] as usize;
                let k = CORNER_COLORS[piece]
                    .iter()
                    .position(|&c| c == stickers[current])
                    .unwrap();
                label_of(location, CORNER_FACELETS[piece][k])
            };
            (letter, label)
        })
        .collect()
}

struct Cycle {
    buffer: char,
    targets: Vec<char>,
    cycle_break: bool,
}

impl Cycle {
    fn execution_keys(&self) -> Vec<String> {
        (0..self.targets.len().saturating_sub(1))
            .step_by(2)
            .map(|i| format!("{}{}{}", self.buffer, self.targets[i], self.targets[i + 1]))
            .collect()
    }
}

fn trace_cycles(mapping: &[(char, char)], buffer: char) -> Vec<Cycle> {
    let target = |l: char| {
        mapping
            .iter()
            .find(|&&(a, _)| a == l)
            .map(|&(_, b)| b)
            .unwrap()
    };
    let mut unsolved: Vec<char> = mapping
        .iter()
        .filter(|(a, b)| a != b)
        .map(|&(a, _)| a)
        .collect();
    let mut starts: Vec<(char, bool)> = vec![(buffer, false)];
    let mut sorted = unsolved.clone();
    sorted.sort_unstable();
    starts.extend(
        sorted
            .into_iter()
            .filter(|&l| l != buffer)
            .map(|l| (l, true)),
    );
    let mut cycles = Vec::new();
    for (start, is_break) in starts {
        if !unsolved.contains(&start) {
            continue;
        }
        let mut path = vec![start];
        let mut cursor = target(start);
        while cursor != start && !path.contains(&cursor) {
            path.push(cursor);
            cursor = target(cursor);
        }
        unsolved.retain(|l| !path.contains(l));
        if path.len() > 1 {
            cycles.push(Cycle {
                buffer,
                targets: path[1..].to_vec(),
                cycle_break: is_break,
            });
        }
    }
    cycles
}

fn pair_memo(cycles: &[Cycle]) -> Vec<String> {
    let mut stream: Vec<char> = Vec::new();
    for c in cycles {
        if c.cycle_break {
            stream.push('•');
        }
        stream.extend(&c.targets);
    }
    if stream.len() % 2 == 1 {
        stream.push('•');
    }
    stream.chunks(2).map(|p| p.iter().collect()).collect()
}

fn pieces(cycles: Vec<Cycle>) -> BldPieces {
    let memo = pair_memo(&cycles);
    let execution_keys = cycles.iter().flat_map(|c| c.execution_keys()).collect();
    BldPieces {
        cycles: cycles
            .into_iter()
            .map(|c| BldCycle {
                execution_keys: c.execution_keys(),
                memo: c.targets.iter().collect(),
                buffer: c.buffer.to_string(),
                targets: c.targets.iter().map(|t| t.to_string()).collect(),
                cycle_break: c.cycle_break,
            })
            .collect(),
        memo,
        execution_keys,
    }
}

fn odd(p: &[u8]) -> bool {
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

/// Speffz 3-Style memo and execution plan (cube must have centers home).
pub fn analyze_3style(cube: &Cube) -> BldAnalysis {
    let edges = pieces(trace_cycles(&sticker_map(cube, true), EDGE_BUFFER));
    let corners = pieces(trace_cycles(&sticker_map(cube, false), CORNER_BUFFER));
    let eo = cube.edge_ori();
    let co = cube.corner_ori();
    BldAnalysis {
        method: "3style-speffz".into(),
        buffers: BldBuffers {
            edge: BldBuffer {
                letter: EDGE_BUFFER.to_string(),
                position: "UF".into(),
            },
            corner: BldBuffer {
                letter: CORNER_BUFFER.to_string(),
                position: "UBL".into(),
            },
        },
        edges,
        corners,
        special: BldSpecial {
            parity: odd(cube.edge_perm()),
            edge_flips: (0..12)
                .filter(|&i| eo[i] != 0)
                .map(|i| EDGE_POSITIONS[i].to_string())
                .collect(),
            corner_twists: (0..8)
                .filter(|&i| co[i] != 0)
                .map(|i| CornerTwist {
                    position: CORNER_POSITIONS[i].into(),
                    direction: if co[i] == 1 { "cw" } else { "ccw" }.into(),
                })
                .collect(),
            edge_orientation_sum: eo.iter().map(|&x| x as u32).sum(),
            corner_orientation_sum: co.iter().map(|&x| x as u32).sum(),
        },
        solved: cube.is_solved(),
        catalog: BldCatalog {
            provider: "BLDDB".into(),
            source: "https://github.com/nbwzx/blddb".into(),
            note: "Execution algorithms are resolved by exact Speffz buffer-target-target key; unresolved special cases are flagged, never guessed.".into(),
        },
    }
}
