/**
 * Ngân sách của bộ giải trong trình duyệt.
 *
 * Cả worker lẫn runtime đều dùng hai hằng số này, nên giới hạn thời gian
 * của solver luôn nhỏ hơn giới hạn của client: khi solver hết ngân sách nó
 * kịp báo lỗi có cấu trúc, thay vì bị client ngắt giữa chừng.
 */

/** Ngân sách thời gian của bộ giải (giây). */
export const SOLVER_TIME_BUDGET_SEC = 40;

/**
 * Ngân sách node cho mỗi lần tìm kiếm F2L.
 *
 * Tìm kiếm F2L là bước có thể mất hàng triệu node; giới hạn node giữ cho
 * một cặp khó không nuốt hết thời gian của cả lần giải.
 */
export const SOLVER_NODE_BUDGET = 400_000;
