//! IDA* over the 18 face turns on a piece-tracking state.

use crate::error::Error;
use crate::limits::Budget;
use crate::tables::{tables, FACE_MOVES};

/// Coordinates (see `tables.rs`) of every edge and corner piece, indexed by
/// piece. Only the pieces a search needs are kept up to date.
#[derive(Clone, Copy, PartialEq, Eq, Debug)]
pub(crate) struct State {
    pub(crate) e: [u8; 12],
    pub(crate) c: [u8; 8],
}

impl State {
    pub(crate) fn from_cube(cube: &cube_core::Cube) -> State {
        let mut s = State {
            e: [0; 12],
            c: [0; 8],
        };
        for (p, (&piece, &o)) in cube.edge_perm().iter().zip(cube.edge_ori()).enumerate() {
            s.e[piece as usize] = (p * 2) as u8 + o;
        }
        for (p, (&piece, &o)) in cube.corner_perm().iter().zip(cube.corner_ori()).enumerate() {
            s.c[piece as usize] = (p * 3) as u8 + o;
        }
        s
    }

    /// Apply face move `m` to the tracked pieces (edges 4..12, corners 4..8).
    #[inline]
    pub(crate) fn apply(&self, m: usize) -> State {
        let mv = &tables().mv;
        let mut n = *self;
        for k in 4..12 {
            n.e[k] = mv.edge[m][self.e[k] as usize];
        }
        for k in 4..8 {
            n.c[k] = mv.corner[m][self.c[k] as usize];
        }
        n
    }
}

const NO_FACE: usize = usize::MAX;

struct Ctx<'a, H: Fn(&State) -> u8> {
    h: &'a H,
    budget: &'a mut Budget,
    path: Vec<u8>,
}

impl<H: Fn(&State) -> u8> Ctx<'_, H> {
    fn dfs(&mut self, s: &State, g: u8, bound: u8, last: usize) -> Result<bool, Error> {
        self.budget.tick()?;
        let h = (self.h)(s);
        if h == 0 {
            return Ok(true);
        }
        if g + h > bound {
            return Ok(false);
        }
        for m in 0..FACE_MOVES {
            let face = m / 3;
            if last != NO_FACE && (face == last || (face == (last + 3) % 6 && face < last)) {
                continue;
            }
            let n = s.apply(m);
            self.path.push(m as u8);
            if self.dfs(&n, g + 1, bound, face)? {
                return Ok(true);
            }
            self.path.pop();
        }
        Ok(false)
    }
}

/// Shortest (for an admissible `h`) face-turn sequence reaching `h == 0`.
/// `Ok(None)` when no solution exists within `max_depth`.
pub(crate) fn ida_star<H: Fn(&State) -> u8>(
    start: &State,
    h: &H,
    max_depth: u8,
    budget: &mut Budget,
) -> Result<Option<Vec<u8>>, Error> {
    let mut ctx = Ctx {
        h,
        budget,
        path: Vec::new(),
    };
    let mut bound = h(start);
    while bound <= max_depth {
        if ctx.dfs(start, 0, bound, NO_FACE)? {
            return Ok(Some(ctx.path));
        }
        bound += 1;
    }
    Ok(None)
}
