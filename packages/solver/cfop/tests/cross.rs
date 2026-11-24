mod common;

use cfop::{cross_solved, solve_cross, solve_cross_with, CrossOptions, Error, Face, Limits};
use common::Rng;
use cube_core::{parse_moves, Cube};

#[test]
fn cross_2000_random_scrambles() {
    let mut rng = Rng::new(20_261_121);
    let mut max_len = 0;
    for i in 0..2000 {
        let scramble = rng.scramble(25);
        let cube = Cube::from_moves(&scramble);
        let moves = solve_cross(&cube).unwrap_or_else(|e| panic!("#{i}: {e}"));
        assert!(moves.len() <= 8, "#{i}: {} moves", moves.len());
        assert!(moves.iter().all(|m| m.base().is_face()));
        assert!(cross_solved(&cube.apply_moves(&moves), Face::D), "#{i}");
        max_len = max_len.max(moves.len());
    }
    println!("longest cross: {max_len}");
}

#[test]
fn every_cross_color() {
    let mut rng = Rng::new(99);
    for _ in 0..100 {
        let cube = Cube::from_moves(&rng.scramble(25));
        for color in Face::ALL {
            let opts = CrossOptions {
                color,
                ..Default::default()
            };
            let r = solve_cross_with(&cube, &opts).unwrap();
            assert!(r.moves.len() <= 8);
            assert!(cross_solved(&r.state, color), "{color:?}");
            assert_eq!(r.state, cube.apply_moves(&r.moves));
        }
    }
}

#[test]
fn edge_cases() {
    assert!(solve_cross(&Cube::SOLVED).unwrap().is_empty());
    for m in cube_core::Move::all().filter(|m| m.base().is_face()) {
        let moves = solve_cross(&Cube::SOLVED.apply(m)).unwrap();
        assert!(moves.len() <= 1, "{m}: {moves:?}");
    }
    let mut rng = Rng::new(5);
    let cube = Cube::from_moves(&rng.scramble(200));
    let moves = solve_cross(&cube).unwrap();
    assert!(moves.len() <= 8 && cross_solved(&cube.apply_moves(&moves), Face::D));
}

#[test]
fn optimality_known_case() {
    let cube = Cube::from_moves(&parse_moves("R F D").unwrap());
    assert_eq!(solve_cross(&cube).unwrap().len(), 3);
}

#[test]
fn limits_are_enforced() {
    let mut rng = Rng::new(3);
    let cube = Cube::from_moves(&rng.scramble(25));
    let opts = CrossOptions {
        limits: Limits::new(1),
        ..Default::default()
    };
    assert!(matches!(
        solve_cross_with(&cube, &opts),
        Err(Error::DepthExceeded { max_depth: 1, .. })
    ));
}

#[test]
fn rejects_rotated_cube() {
    let cube = Cube::from_moves(&parse_moves("x").unwrap());
    assert_eq!(solve_cross(&cube), Err(Error::CentersNotHome));
}

#[test]
fn cross_lengths_match_optimal_solves() {
    let mut rng = Rng::new(2026);
    for _ in 0..200 {
        let cube = Cube::from_moves(&rng.scramble(25));
        let lengths = cfop::cross_lengths(&cube).unwrap();
        for color in Face::ALL {
            let opts = CrossOptions {
                color,
                ..Default::default()
            };
            let optimal = solve_cross_with(&cube, &opts).unwrap().moves.len();
            assert_eq!(lengths[color.index()] as usize, optimal, "{color:?}");
        }
    }
}

#[test]
fn cross_lengths_of_solved_and_one_move() {
    assert_eq!(cfop::cross_lengths(&Cube::default()).unwrap(), [0; 6]);
    let cube = Cube::from_moves(&parse_moves("R").unwrap());
    assert_eq!(cfop::cross_lengths(&cube).unwrap(), [1, 1, 1, 1, 0, 1]);
}
