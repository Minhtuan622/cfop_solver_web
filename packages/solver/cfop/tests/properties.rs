//! Property test (proptest): the full CFOP pipeline solves any random
//! face-turn scramble. Failing cases shrink to a short scramble.

use cfop::Cfop;
use cube_core::{Cube, Move, MoveBase};
use proptest::prelude::*;

/// Cases per run. `full_solve_5000_scrambles` already covers volume with a
/// fixed seed; this test adds fresh random scrambles and shrinking.
const CASES: u32 = 256;

/// One face turn: U R F D L B with amount 1, 2 or 3 (quarter, half, prime).
fn face_turn() -> impl Strategy<Value = Move> {
    (0..MoveBase::FACES.len(), 1u8..=3)
        .prop_map(|(face, amount)| Move::new(MoveBase::FACES[face], amount).expect("face turn"))
}

/// A random face-turn scramble of 1..=40 moves.
fn scramble() -> impl Strategy<Value = Vec<Move>> {
    prop::collection::vec(face_turn(), 1..=40)
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(CASES))]

    #[test]
    fn cfop_solves_random_scramble(moves in scramble()) {
        let cube = Cube::from_moves(&moves);
        let solution = Cfop::solve(&cube)
            .map_err(|error| TestCaseError::fail(format!("solve failed: {error}")))?;
        prop_assert!(
            cube.apply_moves(&solution.moves).is_solved(),
            "solution {} does not solve the scramble",
            solution.text
        );
    }
}
