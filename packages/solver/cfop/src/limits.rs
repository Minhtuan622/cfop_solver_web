//! Search limits: depth, wall-clock timeout and node budget.

use std::time::Duration;

use crate::error::Error;

/// Milliseconds from an arbitrary epoch. On native targets the default clock
/// uses `std::time::Instant`; `wasm32-unknown-unknown` has no such clock, so
/// the WASM binding passes one in (e.g. `performance.now`).
pub type ClockFn = fn() -> f64;

#[derive(Clone, Copy, Debug)]
pub struct Limits {
    /// Maximum moves for one search (one Cross, or one F2L pair).
    pub max_depth: u8,
    /// Wall-clock budget for the whole stage.
    pub timeout: Option<Duration>,
    /// Node budget for the whole stage.
    pub max_nodes: Option<u64>,
    /// Clock used for `timeout`; `None` = platform default.
    pub clock: Option<ClockFn>,
}

impl Limits {
    pub const fn new(max_depth: u8) -> Self {
        Limits {
            max_depth,
            timeout: None,
            max_nodes: None,
            clock: None,
        }
    }

    pub const fn with_timeout(mut self, timeout: Duration) -> Self {
        self.timeout = Some(timeout);
        self
    }

    pub const fn with_max_nodes(mut self, n: u64) -> Self {
        self.max_nodes = Some(n);
        self
    }
}

#[cfg(not(target_arch = "wasm32"))]
fn default_now() -> Option<f64> {
    use std::sync::OnceLock;
    use std::time::Instant;
    static START: OnceLock<Instant> = OnceLock::new();
    Some(START.get_or_init(Instant::now).elapsed().as_secs_f64() * 1000.0)
}

#[cfg(target_arch = "wasm32")]
fn default_now() -> Option<f64> {
    None
}

/// Running budget shared by all searches of one stage.
pub(crate) struct Budget {
    stage: &'static str,
    clock: Option<ClockFn>,
    deadline: Option<f64>,
    timeout_ms: u64,
    max_nodes: Option<u64>,
    pub(crate) nodes: u64,
}

impl Budget {
    pub(crate) fn new(stage: &'static str, limits: &Limits) -> Self {
        let now = match limits.clock {
            Some(c) => Some(c()),
            None => default_now(),
        };
        let deadline = match (limits.timeout, now) {
            (Some(t), Some(n)) => Some(n + t.as_secs_f64() * 1000.0),
            _ => None,
        };
        Budget {
            stage,
            clock: limits.clock,
            deadline,
            timeout_ms: limits.timeout.map_or(0, |t| t.as_millis() as u64),
            max_nodes: limits.max_nodes,
            nodes: 0,
        }
    }

    /// Count one node; check the limits on the first node and every 1024 after.
    #[inline]
    pub(crate) fn tick(&mut self) -> Result<(), Error> {
        self.nodes += 1;
        if self.nodes & 1023 != 1 {
            return Ok(());
        }
        if let Some(max) = self.max_nodes {
            if self.nodes > max {
                return Err(Error::NodeLimit {
                    stage: self.stage,
                    max_nodes: max,
                });
            }
        }
        if let Some(deadline) = self.deadline {
            let now = match self.clock {
                Some(c) => Some(c()),
                None => default_now(),
            };
            if now.is_some_and(|n| n > deadline) {
                return Err(Error::Timeout {
                    stage: self.stage,
                    timeout_ms: self.timeout_ms,
                });
            }
        }
        Ok(())
    }
}
