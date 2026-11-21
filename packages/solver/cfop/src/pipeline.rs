//! Full CFOP pipeline: Cross -> F2L -> OLL -> PLL.

use cube_core::{format_moves, simplify_moves, Cube, Move};
use serde::{Deserialize, Serialize};

use crate::error::Error;
use crate::last_layer::{solve_oll, solve_pll};
use crate::limits::Limits;
use crate::stages::{
    solve_cross_with, solve_f2l_with, CrossOptions, F2lOptions, Face, SlotOrder, StageResult,
};

#[derive(Clone, Copy, Debug)]
pub struct CfopOptions {
    pub cross_color: Face,
    pub slot_order: SlotOrder,
    pub cross_limits: Limits,
    /// `max_depth` applies to each F2L pair.
    pub f2l_limits: Limits,
}

impl Default for CfopOptions {
    fn default() -> Self {
        CfopOptions {
            cross_color: Face::D,
            slot_order: SlotOrder::Best,
            cross_limits: CrossOptions::default().limits,
            f2l_limits: F2lOptions::default().limits,
        }
    }
}

/// A complete solution, serializable for the WASM boundary.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CfopSolution {
    /// The input state.
    pub scrambled: Cube,
    /// Cross, F2L, OLL, PLL, in order.
    pub stages: Vec<StageResult>,
    /// All stage moves concatenated, with adjacent same-face turns merged.
    pub moves: Vec<Move>,
    /// `moves` as notation text.
    pub text: String,
}

impl CfopSolution {
    pub fn move_count(&self) -> usize {
        self.moves.len()
    }

    pub fn stage(&self, name: &str) -> Option<&StageResult> {
        self.stages.iter().find(|s| s.name == name)
    }
}

/// CFOP solver with configurable options.
#[derive(Clone, Copy, Debug, Default)]
pub struct Cfop {
    pub options: CfopOptions,
}

impl Cfop {
    pub fn new(options: CfopOptions) -> Self {
        Cfop { options }
    }

    /// Solve with default options (D cross, best slot order).
    pub fn solve(cube: &Cube) -> Result<CfopSolution, Error> {
        Cfop::default().run(cube)
    }

    /// Solve with this solver's options.
    pub fn run(&self, cube: &Cube) -> Result<CfopSolution, Error> {
        let o = &self.options;
        let cross = solve_cross_with(
            cube,
            &CrossOptions {
                color: o.cross_color,
                limits: o.cross_limits,
            },
        )?;
        let f2l = solve_f2l_with(
            &cross.state,
            &F2lOptions {
                cross_color: o.cross_color,
                slot_order: o.slot_order,
                limits: o.f2l_limits,
            },
        )?;
        let oll = solve_oll(&f2l.state, o.cross_color)?;
        let pll = solve_pll(&oll.state, o.cross_color)?;
        if !pll.state.is_solved() {
            return Err(Error::PreconditionFailed {
                stage: "CFOP",
                reason: "internal error: final state is not solved",
            });
        }
        let stages = vec![cross, f2l, oll, pll];
        let all: Vec<Move> = stages
            .iter()
            .flat_map(|s| s.moves.iter().copied())
            .collect();
        let moves = simplify_moves(&all);
        Ok(CfopSolution {
            scrambled: *cube,
            text: format_moves(&moves),
            moves,
            stages,
        })
    }
}
