use cube_core::{invert_moves, Cube, Move};
use proptest::prelude::*;

const CASES: u32 = 512;

fn any_move() -> impl Strategy<Value = Move> {
    (0..Move::COUNT).prop_map(|index| Move::from_index(index).expect("index < COUNT"))
}

fn move_sequence() -> impl Strategy<Value = Vec<Move>> {
    prop::collection::vec(any_move(), 1..=40)
}

proptest! {
    #![proptest_config(ProptestConfig::with_cases(CASES))]

    #[test]
    fn moves_then_inverse_restore_state(start in move_sequence(), moves in move_sequence()) {
        let before = Cube::from_moves(&start);
        let after = before.apply_moves(&moves).apply_moves(&invert_moves(&moves));
        prop_assert_eq!(after, before);
    }

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
