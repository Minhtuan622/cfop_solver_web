//! Benchmark for openings and one-look last layer:
//! `cargo run --release -p cfop --example bench_extensions [N]`.
//!
//! Uses the browser limits of the Studio: depth 8 (UI range 4..=10) and a
//! node budget per slot-set attempt of 5 000 (UI range 500..=50 000).

use std::time::{Duration, Instant};

use cfop::{
    one_lll_cases, solve_opening, table_stats, warm_up, zbll_cases, Cfop, CfopOptions, Face,
    LastLayerMode, Limits, Opening, OpeningMode, OpeningOptions,
};
use cube_core::{Cube, Move, MoveBase};

fn scramble(state: &mut u64, len: usize) -> Vec<Move> {
    let mut next = || {
        *state = state.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = *state;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    };
    let mut out: Vec<Move> = Vec::new();
    while out.len() < len {
        let face = MoveBase::FACES[(next() % 6) as usize];
        if out.last().is_some_and(|m| m.base() == face) {
            continue;
        }
        out.push(Move::new(face, 1 + (next() % 3) as u8).unwrap());
    }
    out
}

fn pct(v: &mut [Duration], p: f64) -> f64 {
    v.sort();
    v[((v.len() as f64 - 1.0) * p).round() as usize].as_secs_f64() * 1000.0
}

fn main() {
    let n: usize = std::env::args()
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(300);
    let t = Instant::now();
    let stats = table_stats();
    let pruning = t.elapsed();
    let t = Instant::now();
    warm_up();
    let ll = t.elapsed();
    let ll_algs: usize = zbll_cases()
        .iter()
        .chain(one_lll_cases())
        .map(|c| c.algorithm.len())
        .sum();
    println!(
        "pruning tables: {:.2} MiB, built in {:.0} ms",
        stats.total_bytes as f64 / 1048576.0,
        pruning.as_secs_f64() * 1e3
    );
    println!(
        "one-look tables: {} ZBLL + {} 1LLL cases ({} moves), indexed in {:.0} ms",
        zbll_cases().len(),
        one_lll_cases().len(),
        ll_algs,
        ll.as_secs_f64() * 1e3
    );

    for (depth, budget) in [(8u8, 5_000u64), (10, 50_000)] {
        println!("\nopenings, depth {depth}, {budget} nodes per attempt, {n} scrambles:");
        for tier in [
            Opening::XCross,
            Opening::XXCross,
            Opening::XXXCross,
            Opening::XXXXCross,
        ] {
            let mut seed = 0xB0B0 + tier.slots() as u64;
            let mut times = Vec::new();
            let (mut found, mut nodes) = (0, 0u64);
            for _ in 0..n {
                let cube = Cube::from_moves(&scramble(&mut seed, 25));
                let opts = OpeningOptions {
                    cross_color: Face::D,
                    tier,
                    max_depth: depth,
                    node_budget: budget,
                    preferred_slot: None,
                    excluded_slots: Vec::new(),
                    limits: Limits::new(depth),
                };
                let t = Instant::now();
                let r = solve_opening(&cube, &opts).unwrap();
                times.push(t.elapsed());
                nodes += r.attempts.iter().map(|a| a.nodes).sum::<u64>();
                found += usize::from(r.solution.is_some());
            }
            println!(
                "  {:<9} found {:>3}/{n}  p50 {:>7.2} ms  p95 {:>7.2} ms  max {:>7.2} ms  mean nodes {:.0}",
                tier.id(),
                found,
                pct(&mut times, 0.5),
                pct(&mut times, 0.95),
                pct(&mut times, 1.0),
                nodes as f64 / n as f64
            );
        }
    }

    println!("\nfull solve (Studio defaults: opening, last layer auto), {n} scrambles:");
    for opening in [OpeningMode::Cross, OpeningMode::XCross, OpeningMode::Auto] {
        let solver = Cfop::new(CfopOptions {
            opening,
            last_layer: LastLayerMode::Auto,
            ..Default::default()
        });
        let mut seed = 0xC0FFEE;
        let mut times = Vec::new();
        let mut len = 0;
        for _ in 0..n {
            let cube = Cube::from_moves(&scramble(&mut seed, 25));
            let t = Instant::now();
            let s = solver.run(&cube).unwrap();
            times.push(t.elapsed());
            len += s.move_count();
        }
        println!(
            "  {:<9} p50 {:>7.2} ms  p95 {:>7.2} ms  max {:>7.2} ms  mean length {:.2}",
            opening.id(),
            pct(&mut times, 0.5),
            pct(&mut times, 0.95),
            pct(&mut times, 1.0),
            len as f64 / n as f64
        );
    }
}
