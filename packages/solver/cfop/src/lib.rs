//! CFOP stages on top of `cube-core`: Cross and F2L.
//!
//! Both stages use IDA* over the 18 outer face turns with exact pruning
//! tables built lazily on first use (see [`table_stats`]).

#![forbid(unsafe_code)]

mod error;
mod limits;
mod search;
mod stages;
mod tables;

pub use error::Error;
pub use limits::{ClockFn, Limits};
pub use stages::{
    cross_solved, slot_solved, solve_cross, solve_cross_with, solve_f2l, solve_f2l_with,
    CrossOptions, F2lOptions, Face, SlotOrder, StageResult,
};
pub use tables::{table_stats, TableStats};
