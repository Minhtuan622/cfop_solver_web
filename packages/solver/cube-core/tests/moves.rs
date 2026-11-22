mod common;

use common::Rng;
use cube_core::{parse_moves, Cube, Move, MoveBase};

fn seq(s: &str) -> Cube {
    Cube::from_moves(&parse_moves(s).unwrap())
}

#[test]
fn every_quarter_move_four_times_is_identity() {
    for base in MoveBase::ALL {
        let m = Move::new(base, 1).unwrap();
        let mut c = Cube::SOLVED;
        for k in 1..=4 {
            c = c.apply(m);
            assert_eq!(c.is_solved(), k == 4, "{m} applied {k} times");
        }
    }
}

#[test]
fn move_then_inverse_is_identity() {
    for m in Move::all() {
        assert!(Cube::SOLVED.apply(m).apply(m.inverse()).is_solved(), "{m}");
        assert!(Cube::SOLVED.apply(m.inverse()).apply(m).is_solved(), "{m}");
    }
}

#[test]
fn powers_are_consistent() {
    for base in MoveBase::ALL {
        let q = Move::new(base, 1).unwrap();
        let h = Move::new(base, 2).unwrap();
        let p = Move::new(base, 3).unwrap();
        assert_eq!(
            Cube::SOLVED.apply(q).apply(q),
            Cube::SOLVED.apply(h),
            "{base:?}2"
        );
        assert_eq!(
            Cube::SOLVED.apply(h).apply(q),
            Cube::SOLVED.apply(p),
            "{base:?}'"
        );
    }
}

#[test]
fn sexy_move_six_times_is_identity() {
    let s = parse_moves("R U R' U'").unwrap();
    let mut c = Cube::SOLVED;
    for k in 1..=6 {
        c = c.apply_moves(&s);
        assert_eq!(c.is_solved(), k == 6, "after {k} repetitions");
    }
}

#[test]
fn slice_definitions() {
    assert_eq!(seq("M"), seq("R L' x'"));
    assert_eq!(seq("E"), seq("U D' y'"));
    assert_eq!(seq("S"), seq("F' B z"));
    assert_eq!(seq("r"), seq("R M'"));
    assert_eq!(seq("l"), seq("L M"));
    assert_eq!(seq("u"), seq("U E'"));
    assert_eq!(seq("d"), seq("D E"));
    assert_eq!(seq("f"), seq("F S"));
    assert_eq!(seq("b"), seq("B S'"));
    assert_eq!(seq("x"), seq("R M' L'"));
    assert_eq!(seq("y"), seq("U E' D'"));
    assert_eq!(seq("z"), seq("F S B'"));
}

#[test]
fn m2_twice_is_identity() {
    for s in ["M2 M2", "E2 E2", "S2 S2"] {
        assert!(seq(s).is_solved(), "{s}");
    }
    assert!(!seq("M2").is_solved());
}

#[test]
fn slices_and_rotations_keep_a_valid_cube() {
    let mut rng = Rng::new(7);
    for _ in 0..500 {
        let c = Cube::from_moves(&rng.any_moves(30));
        c.verify().unwrap();
    }
}

#[test]
fn inverse_matches_group_inverse() {
    let mut rng = Rng::new(11);
    for _ in 0..200 {
        let moves = rng.any_moves(20);
        let c = Cube::from_moves(&moves);
        let inv = Cube::from_moves(&cube_core::invert_moves(&moves));
        assert_eq!(c.inverse(), inv);
        assert!(c.multiply(&inv).is_solved());
    }
}
