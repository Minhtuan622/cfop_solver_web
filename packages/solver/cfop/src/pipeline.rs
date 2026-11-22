//! Full CFOP pipeline: opening (Cross or XCross..XXXXCross) -> F2L ->
//! last layer (OLL+PLL, ZBLL or 1LLL), with fallback telemetry.

use cube_core::{format_moves, simplify_moves, Cube, Move};
use serde::{Deserialize, Serialize};

use crate::error::Error;
use crate::last_layer::{solve_1lll, solve_oll, solve_pll, solve_zbll};
use crate::limits::Limits;
use crate::opening::{solve_opening, Opening, OpeningAttempt, OpeningOptions};
use crate::stages::{
    solve_cross_with, solve_f2l_with, CrossOptions, F2lOptions, Face, SlotOrder, StageResult,
};

/// Requested opening. `Auto` tries XXXXCross, XXXCross, XXCross, XCross, then Cross.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum OpeningMode {
    #[default]
    Cross,
    XCross,
    XXCross,
    XXXCross,
    XXXXCross,
    Auto,
}

impl OpeningMode {
    pub const fn id(self) -> &'static str {
        match self {
            OpeningMode::Cross => "cross",
            OpeningMode::XCross => "xcross",
            OpeningMode::XXCross => "xxcross",
            OpeningMode::XXXCross => "xxxcross",
            OpeningMode::XXXXCross => "xxxxcross",
            OpeningMode::Auto => "auto",
        }
    }

    /// Highest tier to try (0 = plain Cross).
    const fn top(self) -> usize {
        match self {
            OpeningMode::Cross => 0,
            OpeningMode::XCross => 1,
            OpeningMode::XXCross => 2,
            OpeningMode::XXXCross => 3,
            OpeningMode::XXXXCross | OpeningMode::Auto => 4,
        }
    }
}

/// Requested last-layer method. `Auto` tries ZBLL, then 1LLL, then OLL+PLL.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum LastLayerMode {
    #[default]
    #[serde(rename = "oll_pll")]
    OllPll,
    #[serde(rename = "zbll")]
    Zbll,
    #[serde(rename = "1lll")]
    OneLll,
    #[serde(rename = "auto")]
    Auto,
}

impl LastLayerMode {
    pub const fn id(self) -> &'static str {
        match self {
            LastLayerMode::OllPll => "oll_pll",
            LastLayerMode::Zbll => "zbll",
            LastLayerMode::OneLll => "1lll",
            LastLayerMode::Auto => "auto",
        }
    }
}

#[derive(Clone, Debug)]
pub struct CfopOptions {
    pub cross_color: Face,
    pub slot_order: SlotOrder,
    pub cross_limits: Limits,
    /// `max_depth` applies to each F2L pair.
    pub f2l_limits: Limits,
    pub opening: OpeningMode,
    /// Depth of each direct opening search.
    pub opening_depth: u8,
    /// Node budget of each direct opening attempt (one slot set).
    pub opening_node_budget: u64,
    /// Timeout / progress for the opening searches.
    pub opening_limits: Limits,
    pub preferred_slot: Option<usize>,
    pub excluded_slots: Vec<usize>,
    /// When a requested XCross-tier opening is not found, report it as
    /// "none"/"unavailable" instead of silently falling back.
    pub opening_find_result: bool,
    pub last_layer: LastLayerMode,
}

impl Default for CfopOptions {
    fn default() -> Self {
        CfopOptions {
            cross_color: Face::D,
            slot_order: SlotOrder::Best,
            cross_limits: CrossOptions::default().limits,
            f2l_limits: F2lOptions::default().limits,
            opening: OpeningMode::Cross,
            opening_depth: 8,
            opening_node_budget: 5_000,
            opening_limits: Limits::new(8),
            preferred_slot: None,
            excluded_slots: Vec::new(),
            opening_find_result: false,
            last_layer: LastLayerMode::OllPll,
        }
    }
}

/// What the opening search tried and achieved.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct OpeningTelemetry {
    pub requested: String,
    pub target: String,
    /// "cross" .. "xxxxcross", or "none" (find-result mode, nothing found).
    pub achieved: String,
    /// Tiers tried, highest first, e.g. ["xxcross", "xcross", "cross"].
    pub attempts: Vec<String>,
    /// "direct" or "unavailable".
    pub method: String,
    pub fallback_count: usize,
    pub did_fallback: bool,
    pub node_budget: u64,
    pub direct_attempts: Vec<OpeningAttempt>,
}

/// What the last-layer step tried and achieved.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct LastLayerTelemetry {
    pub requested: String,
    pub achieved: String,
    pub attempts: Vec<String>,
    pub fallback_count: usize,
    pub did_fallback: bool,
}

/// A complete solution, serializable for the WASM boundary.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CfopSolution {
    /// The input state.
    pub scrambled: Cube,
    /// Stages in order: opening (Cross or XCross...), F2L (if any pair is
    /// left), then OLL+PLL, or a single ZBLL / 1LLL stage.
    pub stages: Vec<StageResult>,
    /// All stage moves concatenated, with adjacent same-face turns merged.
    pub moves: Vec<Move>,
    /// `moves` as notation text.
    pub text: String,
    pub opening: OpeningTelemetry,
    pub last_layer: LastLayerTelemetry,
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
#[derive(Clone, Debug, Default)]
pub struct Cfop {
    pub options: CfopOptions,
}

impl Cfop {
    pub fn new(options: CfopOptions) -> Self {
        Cfop { options }
    }

    /// Solve with default options (D cross, best slot order, OLL+PLL).
    pub fn solve(cube: &Cube) -> Result<CfopSolution, Error> {
        Cfop::default().run(cube)
    }

    /// Solve with this solver's options.
    pub fn run(&self, cube: &Cube) -> Result<CfopSolution, Error> {
        let o = &self.options;
        let mut stages = Vec::new();
        let (opening_stage, opening) = self.opening(cube)?;
        let mut state = opening_stage.state;
        stages.push(opening_stage);

        let f2l = solve_f2l_with(
            &state,
            &F2lOptions {
                cross_color: o.cross_color,
                slot_order: o.slot_order,
                limits: o.f2l_limits,
            },
        )?;
        if !f2l.substeps.is_empty() {
            state = f2l.state;
            stages.push(f2l);
        }

        let (ll_stages, last_layer) = self.last_layer(&state)?;
        if let Some(last) = ll_stages.last() {
            state = last.state;
        }
        stages.extend(ll_stages);
        if !state.is_solved() {
            return Err(Error::PreconditionFailed {
                stage: "CFOP",
                reason: "internal error: final state is not solved",
            });
        }
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
            opening,
            last_layer,
        })
    }

    fn opening(&self, cube: &Cube) -> Result<(StageResult, OpeningTelemetry), Error> {
        let o = &self.options;
        let mut tiers_tried = Vec::new();
        let mut direct_attempts = Vec::new();
        let depth = if o.opening_find_result {
            o.opening_depth.clamp(4, 8)
        } else {
            o.opening_depth
        };
        let mut found: Option<StageResult> = None;
        let mut achieved = "cross";
        for k in (1..=o.opening.top()).rev() {
            let tier = Opening::from_slots(k);
            tiers_tried.push(tier.id().to_string());
            if k == 4 && !o.excluded_slots.is_empty() {
                continue; // XXXXCross needs every slot.
            }
            let r = solve_opening(
                cube,
                &OpeningOptions {
                    cross_color: o.cross_color,
                    tier,
                    max_depth: depth,
                    node_budget: o.opening_node_budget,
                    preferred_slot: o.preferred_slot,
                    excluded_slots: o.excluded_slots.clone(),
                    limits: o.opening_limits,
                },
            )?;
            direct_attempts.extend(r.attempts);
            if let Some((_, stage)) = r.solution {
                found = Some(stage);
                achieved = tier.id();
                break;
            }
        }
        let mut method = "direct";
        let stage = match found {
            Some(stage) => stage,
            None => {
                if o.opening_find_result && o.opening.top() > 0 && o.opening != OpeningMode::Auto {
                    achieved = "none";
                    method = "unavailable";
                }
                tiers_tried.push("cross".into());
                solve_cross_with(
                    cube,
                    &CrossOptions {
                        color: o.cross_color,
                        limits: o.cross_limits,
                    },
                )?
            }
        };
        let target = if o.opening == OpeningMode::Auto {
            "xxxxcross"
        } else {
            o.opening.id()
        };
        let did_fallback = if o.opening == OpeningMode::Auto {
            achieved == "cross"
        } else {
            achieved != target
        };
        let telemetry = OpeningTelemetry {
            requested: o.opening.id().into(),
            target: target.into(),
            achieved: achieved.into(),
            fallback_count: tiers_tried.len().saturating_sub(1),
            attempts: tiers_tried,
            method: method.into(),
            did_fallback,
            node_budget: o.opening_node_budget,
            direct_attempts,
        };
        Ok((stage, telemetry))
    }

    fn last_layer(&self, state: &Cube) -> Result<(Vec<StageResult>, LastLayerTelemetry), Error> {
        let o = &self.options;
        let mode = o.last_layer;
        let mut attempts = Vec::new();
        let mut direct = None;
        if matches!(mode, LastLayerMode::Zbll | LastLayerMode::Auto) {
            attempts.push("zbll".to_string());
            direct = solve_zbll(state, o.cross_color)?;
        }
        if direct.is_none() && matches!(mode, LastLayerMode::OneLll | LastLayerMode::Auto) {
            attempts.push("1lll".to_string());
            direct = solve_1lll(state, o.cross_color)?;
        }
        let (stages, achieved) = match direct {
            Some(stage) => {
                let achieved = attempts.last().cloned().unwrap_or_default();
                (vec![stage], achieved)
            }
            None => {
                attempts.push("oll_pll".to_string());
                let oll = solve_oll(state, o.cross_color)?;
                let pll = solve_pll(&oll.state, o.cross_color)?;
                (vec![oll, pll], "oll_pll".to_string())
            }
        };
        let did_fallback = mode != LastLayerMode::OllPll && achieved == "oll_pll";
        Ok((
            stages,
            LastLayerTelemetry {
                requested: mode.id().into(),
                achieved,
                attempts,
                fallback_count: usize::from(did_fallback),
                did_fallback,
            },
        ))
    }
}
