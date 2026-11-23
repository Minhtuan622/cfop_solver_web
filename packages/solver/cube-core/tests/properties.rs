//! Property tests (proptest): random move sequences over all 54 moves
//! (faces, slices, rotations, wide). Failing cases shrink to a short sequence.

use cube_core::{invert_moves, Cube, Move};
use proptest::prelude::*;

/// Cases per property. Each case applies at most ~80 moves, so this stays
/// well under a second.
const CASES: u32 = 512;

fn any_move() -> impl Strategy<Value = Move> {
    (0..Move::COUNT).prop_map(|index| Move::from_index(index).expect("index < COUNT"))
}

/// A random sequence of 1..=40 moves.
fn move_sequence() -> impl Strategy<Value = Vec<Move>> {
    prop::collection::vec(any_move(), 1..=40)
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(CASES))]

    /// Applying a sequence then its inverse returns to the starting state,
    /// from any reachable start (not only the solved cube).
    #[test]
    fn moves_then_inverse_restore_state(start in move_sequence(), moves in move_sequence()) {
        let before = Cube::from_moves(&start);
        let after = before.apply_moves(&moves).apply_moves(&invert_moves(&moves));
        prop_assert_eq!(after, before);
    }

    /// 54-sticker export then import gives back the same cube and the same
    /// sticker string.
    #[test]
    fn stickers_round_trip(moves in move_sequence()) {
        let cube = Cube::from_moves(&moves);
        let stickers = cube.to_stickers();
        let back = Cube::from_stickers(&stickers)
            .map_err(|error| TestCaseError::fail(format!("{stickers}: {error}")))?;
        prop_assert_eq!(back, cube);
        prop_assert_eq!(back.to_stickers(), stickers);
    }
}
