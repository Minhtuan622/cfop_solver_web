//! One-look OLL (57 cases) and PLL (21 cases) with AUF.
//!
//! Recognition is state based: each algorithm `A` is fingerprinted by the
//! state `A^-1` produces from solved, combined with every pre-AUF (and for
//! PLL every post-AUF). A cube is solved by `pre-AUF, A, post-AUF` such that
//! `X * pre * A * post` reaches the stage goal. The result is always replayed
//! and checked before it is returned.

use std::collections::HashMap;
use std::sync::OnceLock;

use cube_core::{invert_moves, parse_moves, Cube, Move, MoveBase};

use crate::error::Error;
use crate::ll_data::{OLL_ALGORITHMS, PLL_ALGORITHMS};
use crate::stages::{canonical_cube, Face, StageResult};
use crate::tables::{tables, Frame};

/// A last-layer case and its algorithm.
#[derive(Clone, Debug)]
pub struct LlCase {
    /// "OLL 21", "PLL Ua", ...
    pub name: String,
    pub group: &'static str,
    pub algorithm: Vec<Move>,
}

#[derive(Clone, Copy)]
struct Entry {
    case: usize,
    pre: u8,
    post: u8,
}

struct LlTables {
    oll: Vec<LlCase>,
    pll: Vec<LlCase>,
    oll_index: HashMap<u16, Vec<Entry>>,
    pll_index: HashMap<u16, Vec<Entry>>,
}

/// Case index used for "nothing to do except AUF".
const SKIP: usize = usize::MAX;

fn u_turn(k: u8) -> Option<Move> {
    Move::new(MoveBase::U, k)
}

fn apply_u(c: &Cube, k: u8) -> Cube {
    match u_turn(k) {
        Some(m) => c.apply(m),
        None => *c,
    }
}

fn oll_key(c: &Cube) -> u16 {
    let co = c.corner_ori();
    let eo = c.edge_ori();
    let corners = co[0] as u16 + 3 * co[1] as u16 + 9 * co[2] as u16 + 27 * co[3] as u16;
    corners * 16 + (eo[0] | eo[1] << 1 | eo[2] << 2 | eo[3] << 3) as u16
}

fn pll_key(c: &Cube) -> u16 {
    let cp = c.corner_perm();
    let ep = c.edge_perm();
    (0..4).fold(0u16, |k, i| {
        (k << 4) | ((cp[i] as u16 & 3) << 2) | (ep[i] as u16 & 3)
    })
}

fn parse_case(name: String, group: &'static str, alg: &str) -> LlCase {
    LlCase {
        name,
        group,
        algorithm: parse_moves(alg).expect("database algorithm parses"),
    }
}

fn ll_tables() -> &'static LlTables {
    static T: OnceLock<LlTables> = OnceLock::new();
    T.get_or_init(|| {
        let oll: Vec<LlCase> = OLL_ALGORITHMS
            .iter()
            .map(|&(n, g, a)| parse_case(format!("OLL {n}"), g, a))
            .collect();
        let pll: Vec<LlCase> = PLL_ALGORITHMS
            .iter()
            .map(|&(n, g, a)| parse_case(format!("PLL {n}"), g, a))
            .collect();
        let mut oll_index: HashMap<u16, Vec<Entry>> = HashMap::new();
        for (case, c) in oll.iter().enumerate() {
            let inv = Cube::from_moves(&invert_moves(&c.algorithm));
            for pre in 0..4 {
                let x = apply_u(&inv, (4 - pre) % 4);
                oll_index
                    .entry(oll_key(&x))
                    .or_default()
                    .push(Entry { case, pre, post: 0 });
            }
        }
        let mut pll_index: HashMap<u16, Vec<Entry>> = HashMap::new();
        for post in 0..4u8 {
            let x = apply_u(&Cube::SOLVED, (4 - post) % 4);
            pll_index.entry(pll_key(&x)).or_default().push(Entry {
                case: SKIP,
                pre: 0,
                post,
            });
        }
        for (case, c) in pll.iter().enumerate() {
            for post in 0..4u8 {
                let base =
                    apply_u(&Cube::SOLVED, (4 - post) % 4).apply_moves(&invert_moves(&c.algorithm));
                for pre in 0..4u8 {
                    let x = apply_u(&base, (4 - pre) % 4);
                    pll_index
                        .entry(pll_key(&x))
                        .or_default()
                        .push(Entry { case, pre, post });
                }
            }
        }
        LlTables {
            oll,
            pll,
            oll_index,
            pll_index,
        }
    })
}

/// The 57 OLL cases, in database order.
pub fn oll_cases() -> &'static [LlCase] {
    &ll_tables().oll
}

/// The 21 PLL cases, in database order.
pub fn pll_cases() -> &'static [LlCase] {
    &ll_tables().pll
}

/// In the canonical frame (cross on D): first two layers solved.
fn f2l_done(c: &Cube) -> bool {
    (4..8).all(|i| c.corner_perm()[i] as usize == i && c.corner_ori()[i] == 0)
        && (4..12).all(|i| c.edge_perm()[i] as usize == i && c.edge_ori()[i] == 0)
        && c.centers() == &[0, 1, 2, 3, 4, 5]
}

fn ll_oriented(c: &Cube) -> bool {
    f2l_done(c) && c.corner_ori().iter().all(|&o| o == 0) && c.edge_ori().iter().all(|&o| o == 0)
}

fn sequence(pre: u8, alg: &[Move], post: u8) -> Vec<Move> {
    u_turn(pre)
        .into_iter()
        .chain(alg.iter().copied())
        .chain(u_turn(post))
        .collect()
}

struct LlStage<'a> {
    stage: &'static str,
    cases: &'a [LlCase],
    index: &'a HashMap<u16, Vec<Entry>>,
    key: fn(&Cube) -> u16,
    precondition: fn(&Cube) -> bool,
    goal: fn(&Cube) -> bool,
}

fn solve_ll(cube: &Cube, color: Face, ll: LlStage<'_>) -> Result<StageResult, Error> {
    let LlStage {
        stage,
        cases,
        index,
        key,
        precondition,
        goal,
    } = ll;
    let (c, frame): (Cube, &Frame) = canonical_cube(cube, color)?;
    if !precondition(&c) {
        return Err(Error::PreconditionFailed {
            stage,
            reason: "previous stages are not solved",
        });
    }
    let finish = |moves: Vec<Move>, case: String| {
        let actual: Vec<Move> = moves.iter().map(|m| frame.to_actual[m.index()]).collect();
        StageResult {
            name: stage.into(),
            state: cube.apply_moves(&actual),
            moves: actual,
            substeps: Vec::new(),
            nodes: 0,
            case: Some(case),
        }
    };
    if goal(&c) {
        return Ok(finish(Vec::new(), format!("{stage} skip")));
    }
    let mut candidates: Vec<(Vec<Move>, String)> = index
        .get(&key(&c))
        .into_iter()
        .flatten()
        .map(|e| {
            if e.case == SKIP {
                (sequence(e.pre, &[], e.post), format!("{stage} skip"))
            } else {
                let case = &cases[e.case];
                (sequence(e.pre, &case.algorithm, e.post), case.name.clone())
            }
        })
        .collect();
    candidates.sort_by_key(|(m, _)| m.len());
    for (moves, name) in candidates {
        if goal(&c.apply_moves(&moves)) {
            return Ok(finish(moves, name));
        }
    }
    Err(Error::PreconditionFailed {
        stage,
        reason: "last-layer case not recognized",
    })
}

/// Orient the last layer with one algorithm (plus pre-AUF).
/// Requires Cross and F2L of `cross_color` solved.
pub fn solve_oll(cube: &Cube, cross_color: Face) -> Result<StageResult, Error> {
    let t = ll_tables();
    let ll = LlStage {
        stage: "OLL",
        cases: &t.oll,
        index: &t.oll_index,
        key: oll_key,
        precondition: f2l_done,
        goal: ll_oriented,
    };
    solve_ll(cube, cross_color, ll)
}

/// Permute the last layer with one algorithm plus pre- and post-AUF.
/// Requires everything but the last-layer permutation solved.
pub fn solve_pll(cube: &Cube, cross_color: Face) -> Result<StageResult, Error> {
    let t = ll_tables();
    let ll = LlStage {
        stage: "PLL",
        cases: &t.pll,
        index: &t.pll_index,
        key: pll_key,
        precondition: ll_oriented,
        goal: |c| c.is_solved(),
    };
    solve_ll(cube, cross_color, ll)
}

/// Touch the tables so later calls are fast.
pub(crate) fn warm_up() {
    let _ = ll_tables();
    let _ = tables();
    let _ = zbll_table();
    let _ = one_lll_table();
}

// ---------------------------------------------------------------------------
// Direct one-look last layer (ZBLL, 1LLL).
//
// A case is identified by the full last-layer state (permutation and
// orientation of the four U corners and edges) that the inverse of its
// algorithm produces from solved, combined with each pre-AUF. Solving is
// `pre-AUF^-1, algorithm`; no post-AUF (the catalog algorithms already end
// solved), and each candidate is replayed before it is accepted.

use crate::one_look_data::{ONE_LLL_CASES, ZBLL_CASES};

struct DirectTable {
    cases: Vec<LlCase>,
    index: HashMap<u32, Vec<(usize, u8)>>,
}

fn ll_state_key(c: &Cube) -> u32 {
    let (cp, co, ep, eo) = (c.corner_perm(), c.corner_ori(), c.edge_perm(), c.edge_ori());
    (0..4).fold(0u32, |k, i| {
        (k << 8)
            | ((cp[i] as u32 & 3) << 6)
            | ((co[i] as u32) << 4)
            | ((ep[i] as u32 & 3) << 2)
            | eo[i] as u32
    })
}

fn build_direct(rows: &[(&str, &str)], group: &'static str) -> DirectTable {
    let cases: Vec<LlCase> = rows
        .iter()
        .map(|&(id, alg)| parse_case(id.to_string(), group, alg))
        .collect();
    let mut index: HashMap<u32, Vec<(usize, u8)>> = HashMap::new();
    for (i, case) in cases.iter().enumerate() {
        let fixture = Cube::from_moves(&invert_moves(&case.algorithm));
        for auf in 0..4u8 {
            index
                .entry(ll_state_key(&apply_u(&fixture, auf)))
                .or_default()
                .push((i, auf));
        }
    }
    DirectTable { cases, index }
}

fn zbll_table() -> &'static DirectTable {
    static T: OnceLock<DirectTable> = OnceLock::new();
    T.get_or_init(|| build_direct(&ZBLL_CASES, "ZBLL"))
}

fn one_lll_table() -> &'static DirectTable {
    static T: OnceLock<DirectTable> = OnceLock::new();
    T.get_or_init(|| build_direct(&ONE_LLL_CASES, "1LLL"))
}

/// The shipped ZBLL cases.
pub fn zbll_cases() -> &'static [LlCase] {
    &zbll_table().cases
}

/// The shipped 1LLL cases.
pub fn one_lll_cases() -> &'static [LlCase] {
    &one_lll_table().cases
}

fn solve_direct(
    cube: &Cube,
    color: Face,
    stage: &'static str,
    table: &DirectTable,
    require_eo: bool,
) -> Result<Option<StageResult>, Error> {
    let (c, frame) = canonical_cube(cube, color)?;
    if !f2l_done(&c) {
        return Err(Error::PreconditionFailed {
            stage,
            reason: "Cross and F2L must be solved",
        });
    }
    if require_eo && c.edge_ori()[..4].iter().any(|&o| o != 0) {
        return Ok(None);
    }
    let mut candidates: Vec<(Vec<Move>, &LlCase)> = table
        .index
        .get(&ll_state_key(&c))
        .into_iter()
        .flatten()
        .map(|&(i, auf)| {
            let case = &table.cases[i];
            (sequence((4 - auf) % 4, &case.algorithm, 0), case)
        })
        .collect();
    candidates.sort_by_key(|(m, _)| m.len());
    for (moves, case) in candidates {
        if c.apply_moves(&moves).is_solved() {
            let actual: Vec<Move> = moves.iter().map(|m| frame.to_actual[m.index()]).collect();
            return Ok(Some(StageResult {
                name: stage.into(),
                state: cube.apply_moves(&actual),
                moves: actual,
                substeps: Vec::new(),
                nodes: 0,
                case: Some(case.name.clone()),
            }));
        }
    }
    Ok(None)
}

/// Solve the whole last layer with one shipped ZBLL algorithm. Returns
/// `Ok(None)` when the U edges are not oriented or the case is not shipped.
pub fn solve_zbll(cube: &Cube, cross_color: Face) -> Result<Option<StageResult>, Error> {
    solve_direct(cube, cross_color, "ZBLL", zbll_table(), true)
}

/// Solve the whole last layer with one shipped 1LLL algorithm, if covered.
pub fn solve_1lll(cube: &Cube, cross_color: Face) -> Result<Option<StageResult>, Error> {
    solve_direct(cube, cross_color, "1LLL", one_lll_table(), false)
}
