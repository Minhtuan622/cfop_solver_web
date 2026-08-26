export type MultiBlindAttempt = { attempted: number; solved: number };

export type MultiBlindResult = MultiBlindAttempt & {
  unsolved: number;
  score: number;
  timeLimitMs: number;
  scoreValid: boolean;
  valid: boolean;
};

export function multiBlindTimeLimitMs(attempted: number) {
  return attempted < 6 ? attempted * 10 * 60_000 : 60 * 60_000;
}

export function multiBlindResult(attempt: MultiBlindAttempt, elapsedMs: number): MultiBlindResult {
  const attempted = Math.max(0, Math.floor(attempt.attempted));
  const solved = Math.min(attempted, Math.max(0, Math.floor(attempt.solved)));
  const unsolved = attempted - solved;
  const score = solved - unsolved;
  const timeLimitMs = multiBlindTimeLimitMs(attempted);
  const scoreValid = attempted >= 2 && solved > 1 && score >= 0;
  return { attempted, solved, unsolved, score, timeLimitMs, scoreValid, valid: scoreValid && elapsedMs <= timeLimitMs };
}

/** Sort valid Multi-Blind results according to WCA 9f12c: score, time, then unsolved count. */
export function compareMultiBlindResults(left: MultiBlindResult, right: MultiBlindResult, leftElapsedMs: number, rightElapsedMs: number) {
  if (left.score !== right.score) return right.score - left.score;
  if (leftElapsedMs !== rightElapsedMs) return leftElapsedMs - rightElapsedMs;
  return left.unsolved - right.unsolved;
}

export function formatMultiBlindTime(elapsedMs: number) {
  const seconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours > 0 ? `${hours}:${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}` : `${minutes}:${remainder.toString().padStart(2, "0")}`;
}
