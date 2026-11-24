use std::time::{Duration, Instant};

use cfop::{solve_cross, solve_f2l, table_stats};
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
    let i = ((v.len() as f64 - 1.0) * p).round() as usize;
    v[i].as_secs_f64() * 1000.0
}

fn main() {
    let n: usize = std::env::args()
        .nth(1)
        .and_then(|s| s.parse().ok())
        .unwrap_or(1000);
    let t0 = Instant::now();
    let stats = table_stats();
    let init = t0.elapsed();
    println!(
        "tables: build {:.1} ms (first call {:.1} ms)",
        stats.build_time.unwrap_or_default().as_secs_f64() * 1e3,
        init.as_secs_f64() * 1e3
    );
    println!(
        "  cross       : {:>9} entries, {:>9} bytes, max distance {}",
        stats.cross_entries, stats.cross_bytes, stats.cross_max_distance
    );
    println!(
        "  cross+edge  : {:>9} entries, {:>9} bytes, max distance {}",
        stats.pair_edge_entries, stats.pair_edge_bytes, stats.pair_edge_max_distance
    );
    println!(
        "  cross+corner: {:>9} entries, {:>9} bytes, max distance {}",
        stats.pair_corner_entries, stats.pair_corner_bytes, stats.pair_corner_max_distance
    );
    println!(
        "  total       : {:.2} MiB",
        stats.total_bytes as f64 / 1048576.0
    );

    let mut seed = 0xBE7C_u64;
    let (mut tc, mut tf) = (Vec::new(), Vec::new());
    let (mut lc, mut lf, mut nodes) = (0usize, 0usize, 0u64);
    for _ in 0..n {
        let cube = Cube::from_moves(&scramble(&mut seed, 25));
        let t = Instant::now();
        let cross = solve_cross(&cube).unwrap();
        tc.push(t.elapsed());
        let after = cube.apply_moves(&cross);
        let t = Instant::now();
        let f2l = solve_f2l(&after).unwrap();
        tf.push(t.elapsed());
        lc += cross.len();
        lf += f2l.moves.len();
        nodes += f2l.nodes;
    }
    println!("{n} scrambles (25 random face turns):");
    println!(
        "  Cross: p50 {:.3} ms, p95 {:.3} ms, max {:.3} ms, mean length {:.2}",
        pct(&mut tc, 0.5),
        pct(&mut tc, 0.95),
        pct(&mut tc, 1.0),
        lc as f64 / n as f64
    );
    println!(
        "  F2L  : p50 {:.2} ms, p95 {:.2} ms, max {:.2} ms, mean length {:.2}, mean nodes {:.0}",
        pct(&mut tf, 0.5),
        pct(&mut tf, 0.95),
        pct(&mut tf, 1.0),
        lf as f64 / n as f64,
        nodes as f64 / n as f64
    );
}
