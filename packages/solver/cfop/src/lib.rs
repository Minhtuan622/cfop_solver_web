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
mod pipeline;
mod search;
mod stages;
mod tables;

pub use error::Error;
pub use last_layer::{oll_cases, pll_cases, solve_oll, solve_pll, LlCase};
pub use limits::{ClockFn, Limits};
pub use pipeline::{Cfop, CfopOptions, CfopSolution};
pub use stages::{
    cross_solved, slot_solved, solve_cross, solve_cross_with, solve_f2l, solve_f2l_with,
    CrossOptions, F2lOptions, Face, SlotOrder, StageResult,
};
pub use tables::{table_stats, TableStats};

/// Build every lookup table now instead of on the first solve.
pub fn warm_up() {
    last_layer::warm_up();
}
