/**
 * Khai báo kiểu cho `scripts/bench-check.mjs`.
 *
 * Script nằm ngoài `tsconfig.json` (được chạy trực tiếp bằng `node`), nhưng
 * `server/benchSolver.test.ts` import hàm thuần ở đây để kiểm thử bằng dữ
 * liệu giả lập — file khai báo này giúp TypeScript biết kiểu của hàm.
 */

/** Ngưỡng mặc định cho từng đề (giây). */
export declare const DEFAULT_PER_SCRAMBLE_LIMIT_SEC: number;

/** Ngưỡng mặc định cho tổng thời gian (giây). */
export declare const DEFAULT_TOTAL_LIMIT_SEC: number;

export declare type BenchLimits = {
  perScrambleLimitSec: number;
  totalLimitSec: number;
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
    slowest: BenchRow | null;
  };
  failures: BenchFailure[];
  noisy: BenchNoisy[];
};

export declare function resolveLimits(
  env?: Record<string, string | undefined>
): BenchLimits;

export declare function evaluateRun(input: {
  results: BenchRow[];
  retries?: BenchRow[];
  limits: BenchLimits;
}): BenchReport;
