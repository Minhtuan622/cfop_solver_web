export declare type BenchLimits = {
  perScrambleLimitSec: number;
  totalLimitSec: number;
};

export declare const DEFAULT_LIMITS: {
  cross: BenchLimits;
  auto: BenchLimits;
};

export declare type BenchScenarioLimits = {
  cross: BenchLimits;
  auto: BenchLimits;
};

export declare type BenchRow = {
  scramble: string;
  seconds: number;
  solved: boolean;
};

export declare type BenchFailure = {
  kind: "wrong" | "slow" | "total";
  scramble: string | null;
  seconds: number;
  firstSeconds?: number;
  limit: number | null;
  message: string;
};

export declare type BenchNoisy = {
  scramble: string;
  firstSeconds: number;
  retrySeconds: number;
};

export declare type BenchReport = {
  ok: boolean;
  exitCode: 0 | 1;
  limits: BenchLimits;
  totals: {
    count: number;
    solvedCount: number;
    totalSeconds: number;
    wallClockSeconds: number;
    slowest: BenchRow | null;
  };
  failures: BenchFailure[];
  noisy: BenchNoisy[];
};

export declare function resolveLimits(
  env?: Record<string, string | undefined>
): BenchScenarioLimits;

export declare function evaluateRun(input: {
  results: BenchRow[];
  retries?: BenchRow[];
  limits: BenchLimits;
}): BenchReport;
