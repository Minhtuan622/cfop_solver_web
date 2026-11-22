mod common;

use std::time::Duration;

use cfop::{
    cross_solved, slot_solved, solve_cross, solve_cross_with, solve_f2l, solve_f2l_with,
    CrossOptions, Error, F2lOptions, Face, Limits, SlotOrder,
};
use common::Rng;
use cube_core::{parse_moves, Cube};

fn f2l_done(cube: &Cube, color: Face) -> bool {
    (0..4).all(|j| slot_solved(cube, color, j))
}

#[test]
fn f2l_2000_random_scrambles() {
    let mut rng = Rng::new(20_261_122);
    let mut total = 0usize;
    for i in 0..2000 {
        let cube = Cube::from_moves(&rng.scramble(25));
        let cross = solve_cross(&cube).unwrap();
        let after_cross = cube.apply_moves(&cross);
        let r = solve_f2l(&after_cross).unwrap_or_else(|e| panic!("#{i}: {e}"));
        assert_eq!(r.state, after_cross.apply_moves(&r.moves), "#{i}");
        assert!(cross_solved(&r.state, Face::D), "#{i}: cross broken");
        assert!(f2l_done(&r.state, Face::D), "#{i}: F2L incomplete");
        assert_eq!(
            r.substeps.iter().map(|s| s.moves.len()).sum::<usize>(),
            r.moves.len()
        );
        // Cross stays intact after every pair.
        for step in &r.substeps {
            assert!(cross_solved(&step.state, Face::D), "#{i}: {}", step.name);
        }
        total += r.moves.len();
    }
    println!("mean F2L length: {:.2}", total as f64 / 2000.0);
}

#[test]
fn fixed_order_and_other_colors() {
    let mut rng = Rng::new(77);
    for _ in 0..30 {
        let cube = Cube::from_moves(&rng.scramble(25));
        for color in [Face::U, Face::R, Face::B] {
            let c = solve_cross_with(
                &cube,
                &CrossOptions {
                    color,
                    ..Default::default()
                },
            )
            .unwrap()
            .state;
            let opts = F2lOptions {
                cross_color: color,
                slot_order: SlotOrder::Fixed([2, 0, 3, 1]),
                ..Default::default()
            };
            // A pair can already be solved right after the cross; only the
            // unsolved ones get a substep.
            let unsolved = (0..4).filter(|&j| !slot_solved(&c, color, j)).count();
            let r = solve_f2l_with(&c, &opts).unwrap();
            assert!(cross_solved(&r.state, color) && f2l_done(&r.state, color));
            assert_eq!(r.substeps.len(), unsolved);
        }
    }
}

#[test]
fn edge_cases() {
    let r = solve_f2l(&Cube::SOLVED).unwrap();
    assert!(r.moves.is_empty() && r.substeps.is_empty());

    // One move off: U keeps cross and pairs, R breaks two pairs.
    let r = solve_f2l(&Cube::from_moves(&parse_moves("U").unwrap())).unwrap();
    assert!(r.moves.is_empty());
    let c = Cube::from_moves(&parse_moves("R U R'").unwrap());
    let r = solve_f2l(&c).unwrap();
    assert!(r.moves.len() <= 3 && f2l_done(&r.state, Face::D));

    // Long scramble.
    let mut rng = Rng::new(8);
    let cube = Cube::from_moves(&rng.scramble(300));
    let c = cube.apply_moves(&solve_cross(&cube).unwrap());
    assert!(f2l_done(&solve_f2l(&c).unwrap().state, Face::D));
}

#[test]
fn requires_cross() {
    let c = Cube::from_moves(&parse_moves("F").unwrap());
    assert!(matches!(
        solve_f2l(&c),
        Err(Error::PreconditionFailed { .. })
    ));
}

#[test]
fn limits_are_enforced() {
    let mut rng = Rng::new(4);
    let cube = Cube::from_moves(&rng.scramble(25));
    let c = cube.apply_moves(&solve_cross(&cube).unwrap());
    let shallow = F2lOptions {
        limits: Limits::new(2),
        ..Default::default()
    };
    assert!(matches!(
        solve_f2l_with(&c, &shallow),
        Err(Error::DepthExceeded { .. })
    ));
    let tiny = F2lOptions {
        limits: Limits::new(14).with_max_nodes(2000),
        ..Default::default()
    };
    assert!(matches!(
        solve_f2l_with(&c, &tiny),
        Err(Error::NodeLimit { .. })
    ));
    let quick = F2lOptions {
        limits: Limits::new(20).with_timeout(Duration::from_nanos(1)),
        ..Default::default()
    };
    assert!(matches!(
        solve_f2l_with(&c, &quick),
        Err(Error::Timeout { .. })
    ));
}
