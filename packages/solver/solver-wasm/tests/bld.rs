//! The Rust 3-Style tracer reproduces the previous Python output exactly.

use cube_core::Cube;
use solver_wasm::analyze_3style;

#[test]
fn matches_python_fixtures() {
    let raw = include_str!("fixtures/bld_python.json");
    let rows: Vec<serde_json::Value> = serde_json::from_str(raw).unwrap();
    assert!(rows.len() >= 60);
    for row in rows {
        let stickers = row["stickers"].as_str().unwrap();
        let cube = Cube::from_stickers(stickers).unwrap();
        let ours = serde_json::to_value(analyze_3style(&cube)).unwrap();
        assert_eq!(ours, row["analysis"], "state {stickers}");
    }
}
