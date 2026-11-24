use std::fmt;

use cube_core::StateError;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Error {
    InvalidState(StateError),
    CentersNotHome,
    PreconditionFailed {
        stage: &'static str,
        reason: &'static str,
    },
    DepthExceeded {
        stage: &'static str,
        max_depth: u8,
    },
    Timeout {
        stage: &'static str,
        timeout_ms: u64,
    },
    NodeLimit {
        stage: &'static str,
        max_nodes: u64,
    },
    Cancelled {
        stage: &'static str,
    },
}

impl Error {
    pub fn code(&self) -> &'static str {
        match self {
            Error::InvalidState(_) => "invalid_state",
            Error::CentersNotHome => "centers_not_home",
            Error::PreconditionFailed { .. } => "precondition_failed",
            Error::DepthExceeded { .. } => "depth_exceeded",
            Error::Timeout { .. } => "timeout",
            Error::NodeLimit { .. } => "node_limit",
            Error::Cancelled { .. } => "cancelled",
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
            Error::Cancelled { stage } => write!(f, "{stage}: search cancelled"),
        }
    }
}

impl std::error::Error for Error {}

impl From<StateError> for Error {
    fn from(e: StateError) -> Self {
        Error::InvalidState(e)
    }
}
