mod common;

use std::collections::BTreeMap;

use cfop::{oll_cases, pll_cases, solve_oll, solve_pll, Cfop, CfopSolution, Face};
use common::Rng;
use cube_core::{invert_moves, Cube};

fn ll_state(cp4: [u8; 4], co4: [u8; 4], ep4: [u8; 4], eo4: [u8; 4]) -> Cube {
    let mut cp = [0, 1, 2, 3, 4, 5, 6, 7];
    let mut co = [0; 8];
    let mut ep = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    let mut eo = [0; 12];
    cp[..4].copy_from_slice(&cp4);
    co[..4].copy_from_slice(&co4);
    ep[..4].copy_from_slice(&ep4);
    eo[..4].copy_from_slice(&eo4);
    Cube::from_parts(cp, co, ep, eo, [0, 1, 2, 3, 4, 5]).unwrap()
}

fn oriented(c: &Cube) -> bool {
    c.corner_ori().iter().all(|&o| o == 0) && c.edge_ori().iter().all(|&o| o == 0)
}

fn f2l_intact(c: &Cube) -> bool {
    (4..8).all(|i| c.corner_perm()[i] as usize == i && c.corner_ori()[i] == 0)
        && (4..12).all(|i| c.edge_perm()[i] as usize == i && c.edge_ori()[i] == 0)
}

fn permutations4() -> Vec<[u8; 4]> {
    let mut out = Vec::new();
    for a in 0..4u8 {
        for b in 0..4u8 {
            for c in 0..4u8 {
                for d in 0..4u8 {
                    let p = [a, b, c, d];
                    let mut s = p;
                    s.sort_unstable();
                    if s == [0, 1, 2, 3] {
                        out.push(p);
                    }
                }
            }
        }
    }
    out
}

fn odd(p: &[u8; 4]) -> bool {
    let mut inv = 0;
    for i in 0..4 {
        for j in i + 1..4 {
            if p[i] > p[j] {
                inv += 1;
            }
        }
    }
    inv % 2 == 1
}

#[test]
fn database_sizes() {
    assert_eq!(oll_cases().len(), 57);
    assert_eq!(pll_cases().len(), 21);
}

#[test]
fn all_216_orientation_states() {
    let mut count = 0;
    let mut seen_cases = std::collections::BTreeSet::new();
    for c in 0..81u32 {
        let co = [
            (c % 3) as u8,
            (c / 3 % 3) as u8,
            (c / 9 % 3) as u8,
            (c / 27 % 3) as u8,
        ];
        if co.iter().map(|&x| x as u32).sum::<u32>() % 3 != 0 {
            continue;
        }
        for e in 0..16u8 {
            let eo = [e & 1, e >> 1 & 1, e >> 2 & 1, e >> 3 & 1];
            if eo.iter().sum::<u8>() % 2 != 0 {
                continue;
            }
            let cube = ll_state([0, 1, 2, 3], co, [0, 1, 2, 3], eo);
            let r =
                solve_oll(&cube, Face::D).unwrap_or_else(|e| panic!("co {co:?} eo {eo:?}: {e}"));
            assert!(
                oriented(&r.state) && f2l_intact(&r.state),
                "co {co:?} eo {eo:?}"
            );
            assert_eq!(r.state, cube.apply_moves(&r.moves));
            seen_cases.insert(r.case.unwrap());
            count += 1;
        }
    }
    assert_eq!(count, 216);
    // 57 cases + skip.
    assert_eq!(seen_cases.len(), 58, "{seen_cases:?}");
}

#[test]
fn all_288_permutation_states() {
    let mut count = 0;
    let mut seen_cases = std::collections::BTreeSet::new();
    for cp in permutations4() {
        for ep in permutations4() {
            if odd(&cp) != odd(&ep) {
                continue;
            }
            let cube = ll_state(cp, [0; 4], ep, [0; 4]);
            let r =
                solve_pll(&cube, Face::D).unwrap_or_else(|e| panic!("cp {cp:?} ep {ep:?}: {e}"));
            assert!(r.state.is_solved(), "cp {cp:?} ep {ep:?}");
            seen_cases.insert(r.case.unwrap());
            count += 1;
        }
    }
    assert_eq!(count, 288);
    assert_eq!(seen_cases.len(), 22, "{seen_cases:?}");
}

#[test]
fn every_algorithm_produces_its_case() {
    for (cases, is_oll) in [(oll_cases(), true), (pll_cases(), false)] {
        for case in cases {
            // The algorithm keeps F2L and the cube orientation.
            let after = Cube::SOLVED.apply_moves(&case.algorithm);
            assert_eq!(
                after.centers(),
                &[0, 1, 2, 3, 4, 5],
                "{} rotates the cube",
                case.name
            );
            assert!(f2l_intact(&after), "{} breaks F2L", case.name);
            if !is_oll {
                assert!(oriented(&after), "{} changes orientation", case.name);
            }
            // Its inverse sets up exactly this case, which it then solves.
            let setup = Cube::from_moves(&invert_moves(&case.algorithm));
            let r = if is_oll {
                solve_oll(&setup, Face::D)
            } else {
                solve_pll(&setup, Face::D)
            }
            .unwrap();
            assert_eq!(r.case.as_deref(), Some(case.name.as_str()));
            if is_oll {
                assert!(oriented(&r.state));
            } else {
                assert!(r.state.is_solved());
            }
        }
    }
}

#[test]
fn full_solve_5000_scrambles() {
    let mut rng = Rng::new(20_261_123);
    let mut oll: BTreeMap<String, usize> = BTreeMap::new();
    let mut pll: BTreeMap<String, usize> = BTreeMap::new();
    let mut total = 0;
    for i in 0..5000 {
        let cube = Cube::from_moves(&rng.scramble(25));
        let s = Cfop::solve(&cube).unwrap_or_else(|e| panic!("#{i}: {e}"));
        assert!(cube.apply_moves(&s.moves).is_solved(), "#{i}");
        let names: Vec<&str> = s.stages.iter().map(|st| st.name.as_str()).collect();
        assert_eq!(names, ["Cross", "F2L", "OLL", "PLL"]);
        *oll.entry(s.stages[2].case.clone().unwrap()).or_default() += 1;
        *pll.entry(s.stages[3].case.clone().unwrap()).or_default() += 1;
        total += s.move_count();
    }
    println!("mean solution length: {:.2}", total as f64 / 5000.0);
    println!("OLL cases seen: {} / 58 (incl. skip)", oll.len());
    for (k, v) in &oll {
        println!("  {k}: {v}");
    }
    println!("PLL cases seen: {} / 22 (incl. skip)", pll.len());
    for (k, v) in &pll {
        println!("  {k}: {v}");
    }
}

#[test]
fn other_cross_colors_full_solve() {
    let mut rng = Rng::new(31);
    for color in Face::ALL {
        for _ in 0..20 {
            let cube = Cube::from_moves(&rng.scramble(25));
            let solver = Cfop::new(cfop::CfopOptions {
                cross_color: color,
                ..Default::default()
            });
            let s = solver.run(&cube).unwrap();
            assert!(cube.apply_moves(&s.moves).is_solved(), "{color:?}");
        }
    }
}

#[test]
fn solution_serializes() {
    let cube = Cube::from_moves(&Rng::new(1).scramble(25));
    let s = Cfop::solve(&cube).unwrap();
    let json = serde_json::to_string(&s).unwrap();
    assert!(json.contains("\"stages\"") && json.contains("\"case\""));
    let back: CfopSolution = serde_json::from_str(&json).unwrap();
    assert_eq!(back, s);
}
