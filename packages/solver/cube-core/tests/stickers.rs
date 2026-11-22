mod common;

use common::Rng;
use cube_core::{Cube, StateError, SOLVED_STICKERS};

#[test]
fn solved_round_trip() {
    assert_eq!(Cube::SOLVED.to_stickers(), SOLVED_STICKERS);
    assert_eq!(Cube::from_stickers(SOLVED_STICKERS).unwrap(), Cube::SOLVED);
}

#[test]
fn round_trip_1000_random_scrambles() {
    let mut rng = Rng::new(0x5EED);
    for i in 0..1000 {
        let len = 10 + rng.below(30);
        let moves = rng.any_moves(len);
        let c = Cube::from_moves(&moves);
        let s = c.to_stickers();
        let back = Cube::from_stickers(&s).unwrap_or_else(|e| panic!("#{i} {s}: {e}"));
        assert_eq!(back, c, "#{i}");
        assert_eq!(back.to_stickers(), s);
    }
}

fn swap(s: &str, a: usize, b: usize) -> String {
    let mut v: Vec<char> = s.chars().collect();
    v.swap(a, b);
    v.into_iter().collect()
}

fn scrambled() -> String {
    Cube::from_moves(&cube_core::parse_moves("R U2 F' L D B2 R' U").unwrap()).to_stickers()
}

#[test]
fn rejects_bad_length_and_colors() {
    assert_eq!(
        Cube::from_stickers("UUU"),
        Err(StateError::InvalidLength(3))
    );
    let bad = format!("X{}", &SOLVED_STICKERS[1..]);
    assert_eq!(
        Cube::from_stickers(&bad),
        Err(StateError::InvalidColor {
            index: 0,
            found: 'X'
        })
    );
    let bad = format!("R{}", &SOLVED_STICKERS[1..]);
    assert!(matches!(
        Cube::from_stickers(&bad),
        Err(StateError::ColorCount { .. })
    ));
}

#[test]
fn rejects_twisted_corner() {
    // Rotate the three stickers of the URF corner (8, 9, 20).
    let s = scrambled();
    let mut v: Vec<char> = s.chars().collect();
    let t = v[8];
    v[8] = v[20];
    v[20] = v[9];
    v[9] = t;
    let s: String = v.into_iter().collect();
    assert!(matches!(
        Cube::from_stickers(&s),
        Err(StateError::CornerTwist { .. })
    ));
}

#[test]
fn rejects_flipped_edge() {
    let s = swap(&scrambled(), 5, 10); // UR edge
    assert!(matches!(
        Cube::from_stickers(&s),
        Err(StateError::EdgeFlip { .. })
    ));
}

#[test]
fn rejects_parity() {
    // Swap the UR and UF edges completely (both stickers).
    let s = swap(&swap(SOLVED_STICKERS, 5, 7), 10, 19);
    assert_eq!(Cube::from_stickers(&s), Err(StateError::Parity));
}

#[test]
fn rejects_mirrored_centers() {
    // Swapping two opposite centers gives a mirror image: not a rotation.
    let s = swap(SOLVED_STICKERS, 4, 31);
    assert!(Cube::from_stickers(&s).is_err());
    let s = swap(SOLVED_STICKERS, 13, 40);
    assert!(Cube::from_stickers(&s).is_err());
}

#[test]
fn rejects_impossible_pieces() {
    // Put an R sticker where the U sticker of URF is and vice versa on an edge
    // so that a corner shows two opposite colors.
    let s = swap(SOLVED_STICKERS, 8, 27); // U(corner) <-> D(corner) -> URF now D R F..
    assert!(Cube::from_stickers(&s).is_err());
}

#[test]
fn accepts_rotated_cubes() {
    for s in ["x", "y", "z", "x y", "z2 y'", "M E S"] {
        let c = Cube::from_moves(&cube_core::parse_moves(s).unwrap());
        assert_eq!(Cube::from_stickers(&c.to_stickers()).unwrap(), c, "{s}");
    }
    assert!(Cube::from_moves(&cube_core::parse_moves("x y").unwrap()).is_solved_any_orientation());
}
