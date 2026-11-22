//! CFOP solver on top of `cube-core`: Cross, F2L, OLL (57), PLL (21).
//!
//! Cross and F2L use IDA* over the 18 outer face turns with exact pruning
//! tables built lazily on first use (see [`table_stats`]). OLL/PLL are
//! one-look, recognized from the cube state, with AUF.

#![forbid(unsafe_code)]

mod error;
mod last_layer;
mod limits;
mod ll_data;
mod one_look_data;
mod opening;
mod pipeline;
mod search;
mod stages;
mod tables;

pub use error::Error;
pub use last_layer::{
    oll_cases, one_lll_cases, pll_cases, solve_1lll, solve_oll, solve_pll, solve_zbll, zbll_cases,
    LlCase,
};
pub use limits::{now_ms, ClockFn, Limits, ProgressFn};
pub use opening::{solve_opening, Opening, OpeningAttempt, OpeningOptions, OpeningResult};
pub use pipeline::{
    Cfop, CfopOptions, CfopSolution, LastLayerMode, LastLayerTelemetry, OpeningMode,
    OpeningTelemetry,
};
pub use stages::{
    cross_lengths, cross_solved, slot_solved, solve_cross, solve_cross_with, solve_f2l, solve_f2l_with,
    CrossOptions, F2lOptions, Face, SlotOrder, StageResult, SLOT_NAMES,
};
pub use tables::{table_stats, TableStats};

/// Build every lookup table now instead of on the first solve.
pub fn warm_up() {
    last_layer::warm_up();
}
