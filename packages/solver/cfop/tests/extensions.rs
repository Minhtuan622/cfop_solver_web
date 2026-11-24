mod common;

use cfop::{
    cross_solved, one_lll_cases, slot_solved, solve_1lll, solve_opening, solve_zbll, zbll_cases,
    Cfop, CfopOptions, Face, LastLayerMode, Limits, Opening, OpeningMode, OpeningOptions,
};
use common::Rng;
use cube_core::{invert_moves, Cube};

fn options(tier: Opening, depth: u8, budget: u64) -> OpeningOptions {
    OpeningOptions {
        cross_color: Face::D,
        tier,
        max_depth: depth,
        node_budget: budget,
        preferred_slot: None,
        excluded_slots: Vec::new(),
        limits: Limits::new(depth),
    }
}

#[test]
fn openings_1000_scrambles_per_tier() {
    let tiers = [
        (Opening::XCross, 9, 200_000),
        (Opening::XXCross, 10, 200_000),
        (Opening::XXXCross, 10, 200_000),
        (Opening::XXXXCross, 10, 200_000),
    ];
    for (tier, depth, budget) in tiers {
        let mut rng = Rng::new(0x0E0 + tier.slots() as u64);
        let mut found = 0;
        for i in 0..1000 {
            let cube = Cube::from_moves(&rng.scramble(25));
            let r = solve_opening(&cube, &options(tier, depth, budget)).unwrap();
            assert!(!r.attempts.is_empty());
            if let Some((slots, stage)) = r.solution {
                found += 1;
                assert_eq!(slots.len(), tier.slots(), "#{i}");
                assert!(stage.moves.len() <= depth as usize, "#{i}");
                let after = cube.apply_moves(&stage.moves);
                assert_eq!(after, stage.state);
                assert!(cross_solved(&after, Face::D), "#{i}: cross");
                for &j in &slots {
                    assert!(slot_solved(&after, Face::D, j), "#{i}: slot {j}");
                }
                assert!(r.attempts.iter().any(|a| a.status == "solved"));
            } else {
                assert!(r.attempts.iter().all(|a| a.status != "solved"));
            }
        }
        println!(
            "{:?}: {found}/1000 found (depth {depth}, budget {budget}/attempt)",
            tier
        );
        if tier == Opening::XCross {
            assert!(
                found > 900,
                "XCross should almost always exist within 9 moves"
            );
        }
    }
}

#[test]
fn xxxcross_at_depth_12_is_usually_found() {
    let mut rng = Rng::new(0x0E0 + 3);
    let mut found = 0;
    for i in 0..20 {
        let cube = Cube::from_moves(&rng.scramble(25));
        let r = solve_opening(&cube, &options(Opening::XXXCross, 12, 2_000_000)).unwrap();
        if let Some((slots, stage)) = r.solution {
            found += 1;
            assert_eq!(slots.len(), 3, "#{i}");
            assert!(stage.moves.len() <= 12, "#{i}");
            let after = cube.apply_moves(&stage.moves);
            assert!(cross_solved(&after, Face::D), "#{i}: cross");
            for &j in &slots {
                assert!(slot_solved(&after, Face::D, j), "#{i}: slot {j}");
            }
        }
    }
    println!("XXXCross depth 12: {found}/20 found");
    assert!(found >= 16, "XXXCross depth 12: only {found}/20 found");
}

#[test]
fn opening_slot_preferences() {
    let mut rng = Rng::new(42);
    for _ in 0..50 {
        let cube = Cube::from_moves(&rng.scramble(25));
        let mut o = options(Opening::XCross, 9, 200_000);
        o.preferred_slot = Some(2);
        if let Some((slots, _)) = solve_opening(&cube, &o).unwrap().solution {
            let mut only = options(Opening::XCross, 9, 200_000);
            only.excluded_slots = vec![0, 1, 3];
            let has_bl = solve_opening(&cube, &only).unwrap().solution.is_some();
            assert_eq!(slots == vec![2], has_bl);
        }
        let mut o = options(Opening::XXCross, 9, 50_000);
        o.excluded_slots = vec![0];
        if let Some((slots, _)) = solve_opening(&cube, &o).unwrap().solution {
            assert!(!slots.contains(&0));
        }
    }
}

#[test]
fn every_zbll_and_1lll_case_replays() {
    assert_eq!(zbll_cases().len(), 519);
    assert_eq!(one_lll_cases().len(), 1163);
    for (cases, zbll) in [(zbll_cases(), true), (one_lll_cases(), false)] {
        for case in cases {
            let after = Cube::SOLVED.apply_moves(&case.algorithm);
            assert_eq!(after.centers(), &[0, 1, 2, 3, 4, 5], "{}", case.name);
            let setup = Cube::from_moves(&invert_moves(&case.algorithm));
            let r = if zbll {
                solve_zbll(&setup, Face::D)
            } else {
                solve_1lll(&setup, Face::D)
            }
            .unwrap()
            .unwrap_or_else(|| panic!("{} not recognized", case.name));
            assert!(r.state.is_solved(), "{}", case.name);
            assert!(r.moves.len() <= case.algorithm.len() + 1, "{}", case.name);
        }
    }
}

#[test]
fn full_pipeline_modes_1000_scrambles() {
    let modes = [
        (OpeningMode::Cross, LastLayerMode::Auto),
        (OpeningMode::XCross, LastLayerMode::Zbll),
        (OpeningMode::Auto, LastLayerMode::OneLll),
        (OpeningMode::XXCross, LastLayerMode::OllPll),
    ];
    for (opening, last_layer) in modes {
        let mut rng = Rng::new(7 + opening as u64);
        let solver = Cfop::new(CfopOptions {
            opening,
            last_layer,
            ..Default::default()
        });
        let (mut direct, mut opened) = (0, 0);
        for i in 0..1000 {
            let cube = Cube::from_moves(&rng.scramble(25));
            let s = solver.run(&cube).unwrap_or_else(|e| panic!("#{i}: {e}"));
            assert!(
                cube.apply_moves(&s.moves).is_solved(),
                "{opening:?} {last_layer:?} #{i}"
            );
            if s.last_layer.achieved != "oll_pll" {
                direct += 1;
            }
            if s.opening.achieved != "cross" {
                opened += 1;
            }
            assert_eq!(s.opening.requested, opening.id());
            assert_eq!(s.last_layer.requested, last_layer.id());
        }
        println!("{opening:?}/{last_layer:?}: opening above cross {opened}/1000, one-look LL {direct}/1000");
    }
}
