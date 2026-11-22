//! Cross-check against frozen vectors recorded from the project's earlier,
//! independent facelet-model engine (before this crate replaced it). Covers
//! faces, slices, rotations, wide moves and random mixed sequences.

include!("reference_vectors.in");

use cube_core::{parse_moves, Cube};

#[test]
fn matches_reference_vectors() {
    assert!(VECTORS.len() >= 50);
    for (scramble, expected) in VECTORS {
        let c = Cube::from_moves(&parse_moves(scramble).unwrap());
        assert_eq!(c.to_stickers(), *expected, "scramble: {scramble}");
        assert_eq!(
            Cube::from_stickers(expected).unwrap(),
            c,
            "parse: {scramble}"
        );
    }
}
