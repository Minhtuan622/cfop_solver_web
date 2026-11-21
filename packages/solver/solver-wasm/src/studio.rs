//! The Studio contract: request options and the result document consumed by
//! the web client (`SolverResult` in `client/src/lib/solverRuntime.ts`).
//!
//! Field names, phase names (`cross`, `xcross_FR`, `f2l_BL`, `oll`, `pll`,
//! `zbll`, `1lll`) and case ids (`"21"`, `"Ua"`, `"solved"`,
//! `"ZBLLAS-001"`) match the previous Python engine, so the UI renders both
//! engines identically.

use cfop::{
    now_ms, Cfop, CfopOptions, CfopSolution, ClockFn, Face, LastLayerMode, Limits, OpeningMode,
    ProgressFn, SlotOrder, SLOT_NAMES,
};
use cube_core::{format_moves, parse_moves, simplify_moves, Cube, Move};
use serde::{Deserialize, Serialize};
use tsify_next::Tsify;

/// Options of one solve request. Every field is optional; defaults match the
/// Studio worker (cross color U, opening cross, last layer auto).
#[derive(Clone, Debug, Default, Serialize, Deserialize, Tsify)]
#[serde(rename_all = "camelCase", default)]
#[tsify(from_wasm_abi)]
pub struct SolveOptions {
    /// "U" | "R" | "F" | "D" | "L" | "B".
    pub cross_color: Option<String>,
    /// "cross" | "auto" | "xcross" | "xxcross" | "xxxcross" | "xxxxcross".
    pub opening: Option<String>,
    /// "oll_pll" | "zbll" | "1lll" | "auto".
    pub last_layer: Option<String>,
    /// Direct opening search depth (clamped to 4..=10, default 8).
    pub opening_depth: Option<u32>,
    pub opening_find_result: Option<bool>,
    /// Node budget per direct opening attempt (clamped to 500..=50000).
    pub direct_node_budget: Option<u32>,
    /// "FR" | "FL" | "BL" | "BR".
    pub preferred_slot: Option<String>,
    pub excluded_slots: Option<Vec<String>>,
    /// Whole-solve time budget in seconds (default 40).
    pub time_budget_sec: Option<f64>,
    /// Node budget per F2L pair (default 400000).
    pub node_budget: Option<u32>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
pub struct TraceStep {
    pub index: usize,
    pub phase: String,
    #[serde(rename = "move")]
    pub mv: String,
    pub state: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
pub struct PhaseResult {
    pub name: String,
    pub algorithm: String,
    pub moves: Vec<String>,
    pub state_after: String,
    pub valid_after: bool,
    pub predicate_after: bool,
    pub case_id: Option<String>,
    pub start: usize,
    pub end: usize,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
pub struct DirectAttempt {
    pub slots: Vec<String>,
    pub nodes: u64,
    pub budget: u64,
    pub depth: u8,
    pub status: String,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
pub struct DirectSearch {
    pub node_budget: u64,
    pub attempts: Vec<DirectAttempt>,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
pub struct OpeningTelemetry {
    pub requested: String,
    pub target: String,
    pub achieved: String,
    pub attempts: Vec<String>,
    pub method: String,
    pub fallback_count: usize,
    pub did_fallback: bool,
    pub direct_search: DirectSearch,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
pub struct LastLayerTelemetry {
    pub requested: String,
    pub achieved: String,
    pub attempts: Vec<String>,
    pub case_id: Option<String>,
    pub fallback_count: usize,
    pub did_fallback: bool,
}

/// The solve result document.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct SolverResult {
    pub initial_state: String,
    pub final_state: String,
    pub algorithm: String,
    pub phases: Vec<PhaseResult>,
    pub trace: Vec<TraceStep>,
    pub opening: OpeningTelemetry,
    pub last_layer: LastLayerTelemetry,
}

/// Structured error: a stable machine code plus a human-readable message.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize, Tsify)]
#[tsify(into_wasm_abi)]
pub struct SolverError {
    /// "invalid_input" | "invalid_option" | "search_limit" | "cancelled" | "internal".
    pub code: String,
    pub message: String,
}

impl SolverError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        SolverError {
            code: code.into(),
            message: message.into(),
        }
    }
}

impl From<cfop::Error> for SolverError {
    fn from(e: cfop::Error) -> Self {
        use cfop::Error::*;
        let code = match &e {
            InvalidState(_) | CentersNotHome => "invalid_input",
            DepthExceeded { .. } | Timeout { .. } | NodeLimit { .. } => "search_limit",
            Cancelled { .. } => "cancelled",
            PreconditionFailed { .. } => "internal",
        };
        SolverError::new(code, e.to_string())
    }
}

fn face(s: &str) -> Result<Face, SolverError> {
    Ok(match s {
        "U" => Face::U,
        "R" => Face::R,
        "F" => Face::F,
        "D" => Face::D,
        "L" => Face::L,
        "B" => Face::B,
        _ => {
            return Err(SolverError::new(
                "invalid_option",
                format!("unsupported cross color: {s}"),
            ))
        }
    })
}

fn slot(s: &str) -> Result<usize, SolverError> {
    SLOT_NAMES
        .iter()
        .position(|&n| n == s)
        .ok_or_else(|| SolverError::new("invalid_option", format!("unknown F2L slot: {s}")))
}

/// Parse a scramble and return the 54-sticker state it produces.
pub fn scramble_to_stickers(scramble: &str) -> Result<String, SolverError> {
    let moves =
        parse_moves(scramble).map_err(|e| SolverError::new("invalid_input", e.to_string()))?;
    Ok(Cube::from_moves(&moves).to_stickers())
}

/// Parse and validate a 54-sticker state (centers must be home).
pub fn parse_state(stickers: &str) -> Result<Cube, SolverError> {
    let cube = Cube::from_stickers(stickers)
        .map_err(|e| SolverError::new("invalid_input", e.to_string()))?;
    if cube.centers() != &[0, 1, 2, 3, 4, 5] {
        return Err(SolverError::new(
            "invalid_input",
            "input must use U R F D L B center order",
        ));
    }
    Ok(cube)
}

/// Translate request options into solver options.
pub fn cfop_options(
    o: &SolveOptions,
    clock: Option<ClockFn>,
    progress: Option<ProgressFn>,
) -> Result<CfopOptions, SolverError> {
    let opening = match o.opening.as_deref().unwrap_or("cross") {
        "cross" => OpeningMode::Cross,
        "xcross" => OpeningMode::XCross,
        "xxcross" => OpeningMode::XXCross,
        "xxxcross" => OpeningMode::XXXCross,
        "xxxxcross" => OpeningMode::XXXXCross,
        "auto" => OpeningMode::Auto,
        other => {
            return Err(SolverError::new(
                "invalid_option",
                format!("unknown opening mode: {other}"),
            ))
        }
    };
    let last_layer = match o.last_layer.as_deref().unwrap_or("auto") {
        "oll_pll" | "full" => LastLayerMode::OllPll,
        "zbll" => LastLayerMode::Zbll,
        "1lll" => LastLayerMode::OneLll,
        "auto" => LastLayerMode::Auto,
        other => {
            return Err(SolverError::new(
                "invalid_option",
                format!("unknown last layer mode: {other}"),
            ))
        }
    };
    let preferred_slot = o.preferred_slot.as_deref().map(slot).transpose()?;
    // Unknown excluded slots are ignored, as before.
    let excluded_slots = o
        .excluded_slots
        .iter()
        .flatten()
        .filter_map(|s| slot(s).ok())
        .collect();
    let budget_sec = o.time_budget_sec.unwrap_or(40.0).max(0.0);
    let deadline_ms = now_ms(clock).map(|n| n + budget_sec * 1000.0);
    let shared = |depth: u8| Limits {
        max_depth: depth,
        timeout: None,
        max_nodes: None,
        clock,
        progress,
        deadline_ms,
    };
    let pair_nodes = u64::from(o.node_budget.unwrap_or(400_000).max(1));
    Ok(CfopOptions {
        cross_color: face(o.cross_color.as_deref().unwrap_or("U"))?,
        slot_order: SlotOrder::Best,
        cross_limits: shared(8),
        // One budget for the four pairs together.
        f2l_limits: Limits {
            max_nodes: Some(pair_nodes * 4),
            ..shared(14)
        },
        opening,
        opening_depth: o.opening_depth.unwrap_or(8).clamp(4, 10) as u8,
        opening_node_budget: u64::from(o.direct_node_budget.unwrap_or(5_000).clamp(500, 50_000)),
        opening_limits: shared(10),
        preferred_slot,
        excluded_slots,
        opening_find_result: o.opening_find_result.unwrap_or(false),
        last_layer,
    })
}

fn phase_name(stage: &str) -> String {
    let mut words = stage.split(' ');
    let head = words.next().unwrap_or_default().to_lowercase();
    let rest: Vec<&str> = words.collect();
    if rest.is_empty() {
        head
    } else {
        format!("{head}_{}", rest.join("_"))
    }
}

fn case_id(name: &str, case: Option<&str>) -> Option<String> {
    let case = case?;
    Some(match name {
        "OLL" | "PLL" => {
            if case.ends_with(" skip") {
                "solved".into()
            } else {
                case.trim_start_matches("OLL ")
                    .trim_start_matches("PLL ")
                    .into()
            }
        }
        _ => case.into(),
    })
}

/// Convert a `CfopSolution` into the Studio document.
pub fn to_result(solution: &CfopSolution) -> SolverResult {
    let mut phases = Vec::new();
    let mut trace = Vec::new();
    let mut current = solution.scrambled;
    // F2L is reported pair by pair, like every other phase.
    let flat = solution.stages.iter().flat_map(|s| {
        if s.substeps.is_empty() {
            vec![s]
        } else {
            s.substeps.iter().collect()
        }
    });
    let mut oll_pll: Vec<String> = Vec::new();
    for stage in flat {
        let name = phase_name(&stage.name);
        let start = trace.len();
        for &m in &stage.moves {
            current = current.apply(m);
            trace.push(TraceStep {
                index: trace.len() + 1,
                phase: name.clone(),
                mv: m.to_string(),
                state: current.to_stickers(),
            });
        }
        let id = case_id(&stage.name, stage.case.as_deref());
        if matches!(stage.name.as_str(), "OLL" | "PLL") {
            oll_pll.extend(id.clone());
        }
        phases.push(PhaseResult {
            name,
            algorithm: format_moves(&simplify_moves(&stage.moves)),
            moves: stage.moves.iter().map(Move::to_string).collect(),
            state_after: current.to_stickers(),
            valid_after: current.verify().is_ok(),
            predicate_after: true,
            case_id: id,
            start,
            end: trace.len(),
        });
    }
    let ll = &solution.last_layer;
    let ll_case = if ll.achieved == "oll_pll" {
        Some(oll_pll.join("/"))
    } else {
        solution.stages.last().and_then(|s| s.case.clone())
    };
    let op = &solution.opening;
    SolverResult {
        initial_state: solution.scrambled.to_stickers(),
        final_state: current.to_stickers(),
        algorithm: solution.text.clone(),
        phases,
        trace,
        opening: OpeningTelemetry {
            requested: op.requested.clone(),
            target: op.target.clone(),
            achieved: op.achieved.clone(),
            attempts: op.attempts.clone(),
            method: op.method.clone(),
            fallback_count: op.fallback_count,
            did_fallback: op.did_fallback,
            direct_search: DirectSearch {
                node_budget: op.node_budget,
                attempts: op
                    .direct_attempts
                    .iter()
                    .map(|a| DirectAttempt {
                        slots: a.slots.clone(),
                        nodes: a.nodes,
                        budget: a.budget,
                        depth: a.depth,
                        status: a.status.clone(),
                    })
                    .collect(),
            },
        },
        last_layer: LastLayerTelemetry {
            requested: ll.requested.clone(),
            achieved: ll.achieved.clone(),
            attempts: ll.attempts.clone(),
            case_id: ll_case,
            fallback_count: ll.fallback_count,
            did_fallback: ll.did_fallback,
        },
    }
}

/// Validate, solve and convert in one step.
pub fn solve_stickers(
    stickers: &str,
    options: &SolveOptions,
    clock: Option<ClockFn>,
    progress: Option<ProgressFn>,
) -> Result<SolverResult, SolverError> {
    let cube = parse_state(stickers)?;
    let solver = Cfop::new(cfop_options(options, clock, progress)?);
    let solution = solver.run(&cube)?;
    let result = to_result(&solution);
    if result.final_state != cube_core::SOLVED_STICKERS {
        return Err(SolverError::new(
            "internal",
            "solution does not solve the cube",
        ));
    }
    Ok(result)
}
