/**
 * Logic kiểm tra ngưỡng thời gian cho bộ đo bộ giải.
 *
 * Tách riêng khỏi `scripts/bench-solver.mjs` để phần "quyết định đạt hay
 * không" là hàm thuần: nhận dữ liệu giả lập thì kiểm tra được ngay, không
 * cần nạp bộ giải. `scripts/bench-solver.mjs` chỉ lo phần đo và gọi vào đây.
 *
 * Ba điều kiện làm chế độ kiểm tra FAIL:
 * (a) có đề giải sai (hoặc lỗi) — không bao giờ thử lại;
 * (b) có đề chậm hơn `PER_SCRAMBLE_LIMIT_SEC` — chạy lại đề đó **một lần**,
 *     chỉ tính là lỗi khi lần chạy lại vẫn vượt ngưỡng (đo nhiễu);
 * (c) tổng thời gian vượt `TOTAL_LIMIT_SEC` — chỉ tính **lần chạy chính**.
 *
 * Ngưỡng truyền vào `evaluateRun` là **ngưỡng của một kịch bản**; bộ đo chạy
 * hai kịch bản (`cross` và `auto`) với hai bộ ngưỡng khác nhau.
 *
 * Ngoài chỉ số kiểm tra, báo cáo còn có `totals.wallClockSeconds`: tổng lần
 * chạy chính **cộng** thời gian các lần chạy lại. Số này chỉ để đối chiếu
 * ngân sách thời gian của job, không tham gia quyết định PASS/FAIL.
 */

/**
 * Ngưỡng mặc định cho từng kịch bản.
 *
 * - `cross`: kịch bản mặc định của app (`opening: "cross"`), tức chỉ tìm
 *   cross. Rẻ nhất.
 * - `auto`: kịch bản `opening: "auto"` — bộ giải thử **bậc cao nhất trước**
 *   (XXXXCross → XXXCross → XXCross → XCross) nên đắt hơn nhiều: đo được
 *   chậm nhất ~21s cho một đề, tổng ~69s cho 11 đề. Ngưỡng riêng vì cùng một
 *   bộ ngưỡng sẽ đỏ ngay với kịch bản này.
 */
export const DEFAULT_LIMITS = {
  cross: { perScrambleLimitSec: 20, totalLimitSec: 80 },
  auto: { perScrambleLimitSec: 60, totalLimitSec: 200 },
};

/**
 * Đọc một ngưỡng từ biến môi trường.
 *
 * Giá trị phải là số dương hữu hạn. Sai thì ném lỗi thay vì âm thầm lùi về
 * mặc định — một biến môi trường gõ sai không được làm tắt ngưỡng âm thầm.
 */
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

/**
 * Ngưỡng dùng cho lần chạy hiện tại, theo từng kịch bản.
 *
 * Ghi đè bằng biến môi trường:
 * - `PER_SCRAMBLE_LIMIT_SEC`, `TOTAL_LIMIT_SEC` — kịch bản `cross`;
 * - `AUTO_PER_SCRAMBLE_LIMIT_SEC`, `AUTO_TOTAL_LIMIT_SEC` — kịch bản `auto`.
 */
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

/**
 * Chấm một lần chạy của bộ đo.
 *
 * @param {object} input
 * @param {Array<{scramble: string, seconds: number, solved: boolean}>} input.results
 *   Kết quả của lần chạy chính (một phần tử cho mỗi đề).
 * @param {Array<{scramble: string, seconds: number, solved: boolean}>} [input.retries]
 *   Kết quả chạy lại của những đề lần đầu đã vượt ngưỡng thời gian.
 * @param {{perScrambleLimitSec: number, totalLimitSec: number}} input.limits
 * @returns {{
 *   ok: boolean, exitCode: 0 | 1, limits: object,
 *   totals: {
 *     count: number, solvedCount: number, totalSeconds: number,
 *     wallClockSeconds: number, slowest: object | null
 *   },
 *   failures: Array<object>, noisy: Array<object>,
 * }}
 */
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

    // (a) giải sai — không thử lại, luôn là lỗi.
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

    // (b) quá ngưỡng thời gian — chạy lại một lần để loại nhiễu.
    if (result.seconds > limits.perScrambleLimitSec) {
      const retry = retries.find(item => item.scramble === result.scramble);
      if (retry && retry.seconds <= limits.perScrambleLimitSec) {
        // Lần đầu chậm nhưng chạy lại nhanh: đo nhiễu, không tính là lỗi.
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

  // Thời gian chạy lại không tham gia ngưỡng tổng, nhưng phải được cộng vào
  // wall-clock để phản ánh thời gian thực của tiến trình.
  for (const retry of retries) {
    wallClockSeconds += retry.seconds;
  }

  // (c) tổng thời gian.
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
