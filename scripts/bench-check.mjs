export const DEFAULT_LIMITS = {
  cross: { perScrambleLimitSec: 20, totalLimitSec: 80 },
  auto: { perScrambleLimitSec: 60, totalLimitSec: 200 },
};

function readLimit(raw, fallback, name) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(
      `[bench] ${name} phải là số giây dương, nhận được "${raw}".`,
    );
  }
  return value;
}

export function resolveLimits(env = {}) {
  return {
    cross: {
      perScrambleLimitSec: readLimit(
        env.PER_SCRAMBLE_LIMIT_SEC,
        DEFAULT_LIMITS.cross.perScrambleLimitSec,
        "PER_SCRAMBLE_LIMIT_SEC",
      ),
      totalLimitSec: readLimit(
        env.TOTAL_LIMIT_SEC,
        DEFAULT_LIMITS.cross.totalLimitSec,
        "TOTAL_LIMIT_SEC",
      ),
    },
    auto: {
      perScrambleLimitSec: readLimit(
        env.AUTO_PER_SCRAMBLE_LIMIT_SEC,
        DEFAULT_LIMITS.auto.perScrambleLimitSec,
        "AUTO_PER_SCRAMBLE_LIMIT_SEC",
      ),
      totalLimitSec: readLimit(
        env.AUTO_TOTAL_LIMIT_SEC,
        DEFAULT_LIMITS.auto.totalLimitSec,
        "AUTO_TOTAL_LIMIT_SEC",
      ),
    },
  };
}

export function evaluateRun({ results, retries = [], limits }) {
  const failures = [];
  const noisy = [];

  let totalSeconds = 0;
  let wallClockSeconds = 0;
  let solvedCount = 0;
  let slowest = null;

  for (const result of results) {
    totalSeconds += result.seconds;
    wallClockSeconds += result.seconds;
    if (result.solved) solvedCount += 1;
    if (!slowest || result.seconds > slowest.seconds) slowest = result;

    if (!result.solved) {
      failures.push({
        kind: "wrong",
        scramble: result.scramble,
        seconds: result.seconds,
        limit: null,
        message: `đề giải sai: ${result.scramble}`,
      });
      continue;
    }

    if (result.seconds > limits.perScrambleLimitSec) {
      const retry = retries.find(item => item.scramble === result.scramble);
      if (retry && retry.seconds <= limits.perScrambleLimitSec) {
        noisy.push({
          scramble: result.scramble,
          firstSeconds: result.seconds,
          retrySeconds: retry.seconds,
        });
        continue;
      }
      const seconds = retry ? retry.seconds : result.seconds;
      failures.push({
        kind: "slow",
        scramble: result.scramble,
        seconds,
        firstSeconds: result.seconds,
        limit: limits.perScrambleLimitSec,
        message:
          `đề quá ngưỡng ${limits.perScrambleLimitSec}s: ` +
          `${seconds.toFixed(2)}s · ${result.scramble}`,
      });
    }
  }

  for (const retry of retries) {
    wallClockSeconds += retry.seconds;
  }

  if (totalSeconds > limits.totalLimitSec) {
    failures.push({
      kind: "total",
      scramble: null,
      seconds: totalSeconds,
      limit: limits.totalLimitSec,
      message:
        `tổng thời gian vượt ngưỡng ${limits.totalLimitSec}s: ` +
        `${totalSeconds.toFixed(2)}s`,
    });
  }

  const ok = failures.length === 0;
  return {
    ok,
    exitCode: ok ? 0 : 1,
    limits,
    totals: {
      count: results.length,
      solvedCount,
      totalSeconds,
      wallClockSeconds,
      slowest,
    },
    failures,
    noisy,
  };
}
