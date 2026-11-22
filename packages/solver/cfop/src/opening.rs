//! Direct openings: Cross plus 1..=4 F2L pairs (XCross .. XXXXCross).
//!
//! Invariant: an opening is reported only when ONE direct sequence from the
//! input state reaches the Cross and every target slot at the same time;
//! it is never assembled from a Cross followed by separate pairs. Each slot
//! set is a bounded IDA* search whose heuristic is the maximum, over the
//! target slots, of the Cross+edge and Cross+corner pruning tables.

use cube_core::Cube;
use serde::{Deserialize, Serialize};

use crate::error::Error;
use crate::limits::{Budget, Limits};
use crate::search::{ida_star, State};
use crate::stages::{canonical, slot_h, to_actual, Face, StageResult, SLOT_NAMES};

/// Opening tier.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Opening {
    Cross,
    XCross,
    XXCross,
    XXXCross,
    XXXXCross,
}

impl Opening {
    /// Number of F2L pairs solved together with the Cross.
    pub const fn slots(self) -> usize {
        match self {
            Opening::Cross => 0,
            Opening::XCross => 1,
            Opening::XXCross => 2,
            Opening::XXXCross => 3,
            Opening::XXXXCross => 4,
        }
    }

    pub const fn from_slots(k: usize) -> Opening {
        match k {
            0 => Opening::Cross,
            1 => Opening::XCross,
            2 => Opening::XXCross,
            3 => Opening::XXXCross,
            _ => Opening::XXXXCross,
        }
    }

    /// Lowercase identifier ("xcross", ...).
    pub const fn id(self) -> &'static str {
        match self {
            Opening::Cross => "cross",
            Opening::XCross => "xcross",
            Opening::XXCross => "xxcross",
            Opening::XXXCross => "xxxcross",
            Opening::XXXXCross => "xxxxcross",
        }
    }
}

#[derive(Clone, Debug)]
pub struct OpeningOptions {
    pub cross_color: Face,
    /// XCross .. XXXXCross (Cross is handled by `solve_cross`).
    pub tier: Opening,
    pub max_depth: u8,
    /// Node budget for each slot-set attempt.
    pub node_budget: u64,
    /// Slot (0..4) that must be part of the result.
    pub preferred_slot: Option<usize>,
    /// Slots (0..4) that must not be used.
    pub excluded_slots: Vec<usize>,
    /// Timeout / clock / progress for the whole opening.
    pub limits: Limits,
}

/// One bounded search over a slot set.
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct OpeningAttempt {
    pub slots: Vec<String>,
    pub nodes: u64,
    pub budget: u64,
    pub depth: u8,
    /// "solved", "budget" (node budget ran out) or "no_solution".
    pub status: String,
}

#[derive(Clone, Debug)]
pub struct OpeningResult {
    /// The solved slots (0..4) and the stage, if a solution was found.
    pub solution: Option<(Vec<usize>, StageResult)>,
    pub attempts: Vec<OpeningAttempt>,
}

fn combinations(items: &[usize], k: usize) -> Vec<Vec<usize>> {
    if k == 0 {
        return vec![Vec::new()];
    }
    let mut out = Vec::new();
    for (i, &x) in items.iter().enumerate() {
        for mut rest in combinations(&items[i + 1..], k - 1) {
            rest.insert(0, x);
            out.push(rest);
        }
    }
    out
}

/// Search a direct opening of the requested tier. Hard errors (invalid
/// cube, timeout, cancellation) are returned as `Err`; an exhausted node
/// budget or depth only yields `solution: None` plus the attempt log.
pub fn solve_opening(cube: &Cube, opts: &OpeningOptions) -> Result<OpeningResult, Error> {
    let (s, frame) = canonical(cube, opts.cross_color)?;
    let k = opts.tier.slots();
    let mut attempts = Vec::new();
    if k == 0 || opts.preferred_slot.is_some_and(|p| p >= 4) {
        return Err(Error::PreconditionFailed {
            stage: "Opening",
            reason: "tier must be XCross..XXXXCross and slots must be 0..4",
        });
    }
    let allowed: Vec<usize> = (0..4)
        .filter(|j| !opts.excluded_slots.contains(j))
        .collect();
    let mut sets = combinations(&allowed, k);
    if let Some(p) = opts.preferred_slot {
        if k == 1 {
            // XCross: try the preferred slot first and keep it if it works.
            sets.sort_by_key(|set| set[0] != p);
        } else {
            sets.retain(|set| set.contains(&p));
        }
    }
    let mut budget = Budget::new("Opening", &opts.limits);
    let mut best: Option<(Vec<usize>, Vec<u8>)> = None;
    for set in sets {
        let depth = match (&best, opts.preferred_slot) {
            (Some((slots, _)), Some(p)) if k == 1 && slots[0] == p => break,
            (Some((_, path)), _) => (path.len() as u8).saturating_sub(1),
            (None, _) => opts.max_depth,
        };
        let h = |st: &State| set.iter().map(|&j| slot_h(st, j)).max().unwrap_or(0);
        budget.start_attempt(Some(opts.node_budget));
        let status = match ida_star(&s, &h, depth, &mut budget) {
            Ok(Some(path)) => {
                best = Some((set.clone(), path));
                "solved"
            }
            Ok(None) => "no_solution",
            Err(Error::NodeLimit { .. }) => "budget",
            Err(e) => return Err(e),
        };
        attempts.push(OpeningAttempt {
            slots: set.iter().map(|&j| SLOT_NAMES[j].to_string()).collect(),
            nodes: budget.attempt_nodes(),
            budget: opts.node_budget,
            depth,
            status: status.into(),
        });
    }
    let solution = best.map(|(slots, path)| {
        let moves = to_actual(frame, &path);
        let name = format!(
            "{} {}",
            match opts.tier {
                Opening::XCross => "XCross",
                Opening::XXCross => "XXCross",
                Opening::XXXCross => "XXXCross",
                _ => "XXXXCross",
            },
            slots
                .iter()
                .map(|&j| SLOT_NAMES[j])
                .collect::<Vec<_>>()
                .join(" ")
        );
        let stage = StageResult {
            name,
            state: cube.apply_moves(&moves),
            moves,
            substeps: Vec::new(),
            nodes: budget.nodes,
            case: None,
        };
        (slots, stage)
    });
    Ok(OpeningResult { solution, attempts })
}
