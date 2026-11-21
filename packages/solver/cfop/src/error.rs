//! Solver errors.

use std::fmt;

use cube_core::StateError;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Error {
    /// The input cube is not a reachable state.
    InvalidState(StateError),
    /// Solvers work in the fixed reference orientation (U center on top,
    /// F center in front).
    CentersNotHome,
    /// A stage needs an earlier stage to be complete (e.g. F2L needs Cross).
    PreconditionFailed {
        stage: &'static str,
        reason: &'static str,
    },
    /// No solution within `max_depth` moves.
    DepthExceeded { stage: &'static str, max_depth: u8 },
    /// The time budget ran out.
    Timeout {
        stage: &'static str,
        timeout_ms: u64,
    },
    /// The node budget ran out.
    NodeLimit { stage: &'static str, max_nodes: u64 },
}

impl Error {
    /// Stable machine-readable code (for the WASM boundary later).
    pub fn code(&self) -> &'static str {
        match self {
            Error::InvalidState(_) => "invalid_state",
            Error::CentersNotHome => "centers_not_home",
            Error::PreconditionFailed { .. } => "precondition_failed",
            Error::DepthExceeded { .. } => "depth_exceeded",
            Error::Timeout { .. } => "timeout",
            Error::NodeLimit { .. } => "node_limit",
        }
    }
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::InvalidState(e) => write!(f, "invalid cube state: {e}"),
            Error::CentersNotHome => write!(
                f,
                "cube must be in the reference orientation (U center up, F center front)"
            ),
            Error::PreconditionFailed { stage, reason } => write!(f, "{stage}: {reason}"),
            Error::DepthExceeded { stage, max_depth } => {
                write!(f, "{stage}: no solution within {max_depth} moves")
            }
            Error::Timeout { stage, timeout_ms } => {
                write!(f, "{stage}: search timed out after {timeout_ms} ms")
            }
            Error::NodeLimit { stage, max_nodes } => {
                write!(f, "{stage}: search exceeded {max_nodes} nodes")
            }
        }
    }
}

impl std::error::Error for Error {}

impl From<StateError> for Error {
    fn from(e: StateError) -> Self {
        Error::InvalidState(e)
    }
}
