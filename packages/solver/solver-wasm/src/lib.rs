//! WebAssembly entry points for the CFOP solver.
//!
//! ```js
//! import init, { solve, scrambleToStickers } from "solver-wasm";
//! await init();
//! const result = solve(scrambleToStickers("R U R' U'"), { crossColor: "D" });
//! ```
//!
//! Errors are thrown as `{ code, message }` objects (`SolverError`).

#![forbid(unsafe_code)]

pub mod bld;
pub mod studio;

use std::cell::RefCell;

use tsify::Ts;
use wasm_bindgen::prelude::*;

pub use bld::{analyze_3style, BldAnalysis};
pub use studio::{SolveOptions, SolverError, SolverResult};

thread_local! {
    static PROGRESS: RefCell<Option<js_sys::Function>> = const { RefCell::new(None) };
}

fn js_now() -> f64 {
    js_sys::Date::now()
}

/// Bridges the search hook to the JS callback: `onProgress(stage, nodes)`;
/// returning `false` from the callback cancels the search.
fn js_progress(stage: &'static str, nodes: u64) -> bool {
    PROGRESS.with(|p| match p.borrow().as_ref() {
        Some(f) => f
            .call2(
                &JsValue::NULL,
                &JsValue::from_str(stage),
                &JsValue::from_f64(nodes as f64),
            )
            .map(|v| v.as_bool() != Some(false))
            .unwrap_or(true),
        None => true,
    })
}

fn throw(e: SolverError) -> JsValue {
    serde_wasm_bindgen::to_value(&e).unwrap_or_else(|_| JsValue::from_str(&e.message))
}

/// Rust value -> JS object (`Ts<T>` keeps the TypeScript type in the .d.ts).
fn to_js<T: tsify::Tsify + serde::Serialize>(value: &T) -> Result<Ts<T>, JsValue> {
    Ts::from_rust(value).map_err(|e| throw(SolverError::new("internal", e.to_string())))
}

/// Solve a 54-sticker URFDLB state.
///
/// `onProgress(stage, nodes)` (optional) is called periodically during
/// search; return `false` from it to cancel (the call then throws
/// `{ code: "cancelled" }`).
#[wasm_bindgen]
pub fn solve(
    stickers: &str,
    options: Option<Ts<SolveOptions>>,
    #[wasm_bindgen(js_name = onProgress)] on_progress: Option<js_sys::Function>,
) -> Result<Ts<SolverResult>, JsValue> {
    let options = match options {
        Some(options) => options
            .to_rust()
            .map_err(|e| throw(SolverError::new("invalid_option", e.to_string())))?,
        None => SolveOptions::default(),
    };
    let has_progress = on_progress.is_some();
    PROGRESS.with(|p| *p.borrow_mut() = on_progress);
    let progress: Option<cfop::ProgressFn> = if has_progress {
        Some(js_progress)
    } else {
        None
    };
    let result = studio::solve_stickers(stickers, &options, Some(js_now), progress);
    PROGRESS.with(|p| *p.borrow_mut() = None);
    to_js(&result.map_err(throw)?)
}

/// The 54-sticker state produced by a scramble from solved.
#[wasm_bindgen(js_name = scrambleToStickers)]
pub fn scramble_to_stickers(scramble: &str) -> Result<String, JsValue> {
    studio::scramble_to_stickers(scramble).map_err(throw)
}

/// Optimal cross length for each center color of a 54-sticker state, in
/// `URFDLB` order.
#[wasm_bindgen(js_name = crossLengths)]
pub fn cross_lengths(stickers: &str) -> Result<Vec<u8>, JsValue> {
    let cube = studio::parse_state(stickers).map_err(throw)?;
    cfop::cross_lengths(&cube)
        .map(|lengths| lengths.to_vec())
        .map_err(|e| throw(SolverError::new("invalid_input", e.to_string())))
}

/// 3-Style (Speffz) memo for a 54-sticker state.
#[wasm_bindgen(js_name = analyzeBld)]
pub fn analyze_bld(stickers: &str) -> Result<Ts<BldAnalysis>, JsValue> {
    let cube = studio::parse_state(stickers).map_err(throw)?;
    to_js(&bld::analyze_3style(&cube))
}

/// Build every lookup table now (otherwise built on the first solve).
#[wasm_bindgen(js_name = warmUp)]
pub fn warm_up() {
    cfop::warm_up();
}
