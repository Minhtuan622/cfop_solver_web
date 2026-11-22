//! Cross and F2L stage solvers.

use cube_core::{Cube, Move};
use serde::{Deserialize, Serialize};

use crate::error::Error;
use crate::limits::{Budget, Limits};
use crate::search::{ida_star, State};
use crate::tables::{tables, Frame, CROSS_EDGES, SLOTS};

/// A face / center color, in `URFDLB` order.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Face {
    U,
    R,
    F,
    #[default]
    D,
    L,
    B,
}

impl Face {
    pub const ALL: [Face; 6] = [Face::U, Face::R, Face::F, Face::D, Face::L, Face::B];

    pub const fn index(self) -> usize {
        self as usize
    }
}

/// Result of one stage (or sub-step, e.g. one F2L pair).
#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StageResult {
    /// "Cross", "F2L", or a pair name such as "F2L FR".
    pub name: String,
    pub moves: Vec<Move>,
    /// Cube state after this stage.
    pub state: Cube,
    /// For F2L: one entry per pair, in solving order.
    pub substeps: Vec<StageResult>,
    /// Search nodes visited.
    pub nodes: u64,
    /// Recognized case for OLL/PLL (e.g. "OLL 21", "PLL Ua", "OLL skip").
    #[serde(skip_serializing_if = "Option::is_none", default)]
    pub case: Option<String>,
}

#[derive(Clone, Copy, Debug)]
pub struct CrossOptions {
    pub color: Face,
    pub limits: Limits,
}

impl Default for CrossOptions {
    fn default() -> Self {
        CrossOptions {
            color: Face::D,
            limits: Limits::new(8),
        }
    }
}

/// Order in which F2L slots are solved.
///
/// Slots are numbered 0..4 = FR, FL, BL, BR *relative to the cross*: for a
/// D cross these are the real FR/FL/BL/BR slots; for another cross color the
/// cube is viewed after the rotation that brings that color to D
/// (U: x2, F: x', B: x, R: z, L: z'), and slot names follow that view.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Serialize, Deserialize)]
pub enum SlotOrder {
    /// At every step solve whichever remaining pair is shortest.
    #[default]
    Best,
    /// Fixed order, e.g. `[0, 1, 2, 3]`.
    Fixed([usize; 4]),
}

#[derive(Clone, Copy, Debug)]
pub struct F2lOptions {
    pub cross_color: Face,
    pub slot_order: SlotOrder,
    /// `max_depth` applies to each pair.
    pub limits: Limits,
}

impl Default for F2lOptions {
    fn default() -> Self {
        F2lOptions {
            cross_color: Face::D,
            slot_order: SlotOrder::Best,
            limits: Limits::new(14),
        }
    }
}

/// Slot names relative to the cross on D (as the Studio shows them).
pub const SLOT_NAMES: [&str; 4] = ["FR", "FL", "BL", "BR"];

/// The cube seen with `color` on D (`G^-1 * cube * G`) and its frame.
pub(crate) fn canonical_cube(cube: &Cube, color: Face) -> Result<(Cube, &'static Frame), Error> {
    cube.verify()?;
    if cube.centers() != &[0, 1, 2, 3, 4, 5] {
        return Err(Error::CentersNotHome);
    }
    let frame = &tables().frames[color.index()];
    Ok((frame.g_inv.multiply(cube).multiply(&frame.g), frame))
}

pub(crate) fn canonical(cube: &Cube, color: Face) -> Result<(State, &'static Frame), Error> {
    canonical_cube(cube, color).map(|(c, f)| (State::from_cube(&c), f))
}

pub(crate) fn cross_h(s: &State) -> u8 {
    tables().cross.get(&s.e[4..8], 0)
}

/// Lower bound for: cross solved and slot `j` solved.
pub(crate) fn slot_h(s: &State, j: usize) -> u8 {
    let t = tables();
    let conj = &t.slot_conj[j];
    let (cj, ej) = SLOTS[j];
    let mut ed = [0u8; 5];
    for q in CROSS_EDGES.into_iter().chain([ej]) {
        let (nq, nx) = conj.edge[q][s.e[q] as usize];
        ed[nq as usize - 4] = nx;
    }
    let (_, cx) = conj.corner[cj][s.c[cj] as usize];
    t.pair_edge.get(&ed, 0).max(t.pair_corner.get(&ed[..4], cx))
}

pub(crate) fn to_actual(frame: &Frame, path: &[u8]) -> Vec<Move> {
    path.iter().map(|&m| frame.to_actual[m as usize]).collect() // face moves: index < 18
}

/// True if the cross of `color` is solved.
pub fn cross_solved(cube: &Cube, color: Face) -> bool {
    canonical(cube, color).is_ok_and(|(s, _)| cross_h(&s) == 0)
}

/// True if the cross of `color` and slot `slot` (0..4, see [`SlotOrder`]) are solved.
pub fn slot_solved(cube: &Cube, color: Face, slot: usize) -> bool {
    canonical(cube, color).is_ok_and(|(s, _)| slot_h(&s, slot) == 0)
}

/// Solve the D cross with default limits (at most 8 moves).
pub fn solve_cross(cube: &Cube) -> Result<Vec<Move>, Error> {
    solve_cross_with(cube, &CrossOptions::default()).map(|r| r.moves)
}

/// Optimal cross (face turn metric) for the given color.
pub fn solve_cross_with(cube: &Cube, opts: &CrossOptions) -> Result<StageResult, Error> {
    let (s, frame) = canonical(cube, opts.color)?;
    let mut budget = Budget::new("Cross", &opts.limits);
    let path = ida_star(&s, &cross_h, opts.limits.max_depth, &mut budget)?.ok_or(
        Error::DepthExceeded {
            stage: "Cross",
            max_depth: opts.limits.max_depth,
        },
    )?;
    let moves = to_actual(frame, &path);
    Ok(StageResult {
        name: "Cross".into(),
        state: cube.apply_moves(&moves),
        moves,
        substeps: Vec::new(),
        nodes: budget.nodes,
        case: None,
    })
}

/// Solve the four F2L pairs (D cross, best slot first, default limits).
pub fn solve_f2l(cube: &Cube) -> Result<StageResult, Error> {
    solve_f2l_with(cube, &F2lOptions::default())
}

/// Solve F2L pair by pair. Requires the cross of `cross_color` to be solved;
/// every pair search keeps the cross and all already solved pairs intact.
pub fn solve_f2l_with(cube: &Cube, opts: &F2lOptions) -> Result<StageResult, Error> {
    let (mut s, frame) = canonical(cube, opts.cross_color)?;
    if cross_h(&s) != 0 {
        return Err(Error::PreconditionFailed {
            stage: "F2L",
            reason: "cross is not solved",
        });
    }
    if let SlotOrder::Fixed(order) = opts.slot_order {
        let mut sorted = order;
        sorted.sort_unstable();
        if sorted != [0, 1, 2, 3] {
            return Err(Error::PreconditionFailed {
                stage: "F2L",
                reason: "slot order must be a permutation of 0..4",
            });
        }
    }
    let max_depth = opts.limits.max_depth;
    let mut budget = Budget::new("F2L", &opts.limits);
    let mut solved: Vec<usize> = (0..4).filter(|&j| slot_h(&s, j) == 0).collect();
    let mut state = *cube;
    let mut all_moves = Vec::new();
    let mut substeps = Vec::new();

    while solved.len() < 4 {
        let candidates: Vec<usize> = match opts.slot_order {
            SlotOrder::Best => (0..4).filter(|j| !solved.contains(j)).collect(),
            SlotOrder::Fixed(order) => order
                .into_iter()
                .filter(|j| !solved.contains(j))
                .take(1)
                .collect(),
        };
        let mut best: Option<(usize, Vec<u8>)> = None;
        for &j in &candidates {
            // Only look for strictly shorter solutions than the best so far.
            let depth = best
                .as_ref()
                .map_or(max_depth, |(_, p)| (p.len() as u8).saturating_sub(1));
            if best.is_some() && depth == 0 {
                break;
            }
            let goal: Vec<usize> = solved.iter().copied().chain([j]).collect();
            let h = |st: &State| goal.iter().map(|&k| slot_h(st, k)).max().unwrap_or(0);
            if let Some(path) = ida_star(&s, &h, depth, &mut budget)? {
                best = Some((j, path));
            }
        }
        let (j, path) = best.ok_or(Error::DepthExceeded {
            stage: "F2L",
            max_depth,
        })?;
        for &m in &path {
            s = s.apply(m as usize);
        }
        let moves = to_actual(frame, &path);
        state = state.apply_moves(&moves);
        all_moves.extend_from_slice(&moves);
        solved.push(j);
        // A pair may get solved for free along the way.
        for k in 0..4 {
            if !solved.contains(&k) && slot_h(&s, k) == 0 {
                solved.push(k);
            }
        }
        substeps.push(StageResult {
            name: format!("F2L {}", SLOT_NAMES[j]),
            moves,
            state,
            substeps: Vec::new(),
            nodes: 0,
            case: None,
        });
    }

    Ok(StageResult {
        name: "F2L".into(),
        moves: all_moves,
        state,
        substeps,
        nodes: budget.nodes,
        case: None,
    })
}
