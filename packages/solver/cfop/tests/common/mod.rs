#![allow(dead_code)]

use cube_core::{Move, MoveBase};

/// SplitMix64 PRNG (fixed seeds -> reproducible scrambles).
pub struct Rng(u64);

impl Rng {
    pub fn new(seed: u64) -> Self {
        Rng(seed)
    }
    pub fn next_u64(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }
    pub fn below(&mut self, n: usize) -> usize {
        (self.next_u64() % n as u64) as usize
    }
    /// WCA-style random-move scramble: face turns, no face repeated twice
    /// in a row.
    pub fn scramble(&mut self, len: usize) -> Vec<Move> {
        let mut out: Vec<Move> = Vec::with_capacity(len);
        while out.len() < len {
            let face = MoveBase::FACES[self.below(6)];
            if out.last().is_some_and(|m| m.base() == face) {
                continue;
            }
            out.push(Move::new(face, 1 + self.below(3) as u8).unwrap());
        }
        out
    }
}
