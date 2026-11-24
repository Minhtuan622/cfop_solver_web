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

fn to_js<T: tsify::Tsify + serde::Serialize>(value: &T) -> Result<Ts<T>, JsValue> {
    Ts::from_rust(value).map_err(|e| throw(SolverError::new("internal", e.to_string())))
}

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

#[wasm_bindgen(js_name = scrambleToStickers)]
pub fn scramble_to_stickers(scramble: &str) -> Result<String, JsValue> {
    studio::scramble_to_stickers(scramble).map_err(throw)
}

#[wasm_bindgen(js_name = crossLengths)]
pub fn cross_lengths(stickers: &str) -> Result<Vec<u8>, JsValue> {
    let cube = studio::parse_state(stickers).map_err(throw)?;
    cfop::cross_lengths(&cube)
        .map(|lengths| lengths.to_vec())
        .map_err(|e| throw(SolverError::new("invalid_input", e.to_string())))
}

#[wasm_bindgen(js_name = analyzeBld)]
pub fn analyze_bld(stickers: &str) -> Result<Ts<BldAnalysis>, JsValue> {
    let cube = studio::parse_state(stickers).map_err(throw)?;
    to_js(&bld::analyze_3style(&cube))
}

#[wasm_bindgen(js_name = warmUp)]
pub fn warm_up() {
    cfop::warm_up();
}
