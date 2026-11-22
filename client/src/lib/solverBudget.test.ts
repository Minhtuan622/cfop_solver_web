import { describe, expect, it } from "vitest";
import { SOLVER_NODE_BUDGET, SOLVER_TIME_BUDGET_SEC } from "@/lib/solverBudget";
import { SOLVER_TIMEOUT_MS } from "@/lib/solverRuntime";
import { handleWasmRequest, type SolverWasmModule } from "@/lib/wasmSolverCore";

/**
 * Regression test cho B2: worker phải truyền ngân sách giới hạn xuống solver.
 *
 * Lỗi thật: worker chỉ truyền ngân sách của tìm kiếm opening nên bước ghép
 * cặp F2L không bị giới hạn; khi cặp đó rơi vào trạng thái khó, bộ tìm kiếm
 * chạy hàng triệu node và người dùng chỉ thấy thông báo hết giờ chung chung.
 */

/** Module WASM giả: ghi lại tham số solve() nhận được. */
function fakeWasm(onSolve: (options: Record<string, unknown>) => unknown): SolverWasmModule {
  return {
    solve: (_stickers, options) => onSolve(options ?? {}),
    scrambleToStickers: () => "U".repeat(54),
    analyzeBld: () => ({}),
    warmUp: () => undefined,
  };
}

describe("B2: worker truyền ngân sách giới hạn cho solver", () => {
  it("truyền ngân sách thời gian và node từ module dùng chung xuống solve()", () => {
    let received: Record<string, unknown> = {};
    handleWasmRequest(
      fakeWasm(options => {
        received = options;
        return {};
      }),
      { id: 1, command: "solve", kind: "scramble", value: "R U" },
      () => undefined
    );
    expect(received.timeBudgetSec).toBe(SOLVER_TIME_BUDGET_SEC);
    expect(received.nodeBudget).toBe(SOLVER_NODE_BUDGET);
  });

  it("ngân sách của solver nhỏ hơn giới hạn của client", () => {
    // Client ngắt worker sau SOLVER_TIMEOUT_MS. Solver phải hết ngân sách
    // trước đó để báo lỗi có cấu trúc thay vì bị ngắt giữa chừng.
    expect(SOLVER_TIME_BUDGET_SEC).toBeLessThan(SOLVER_TIMEOUT_MS / 1000);
    expect(SOLVER_NODE_BUDGET).toBeGreaterThan(0);
  });

  it("giữ mã lỗi có cấu trúc của solver để giao diện hiển thị đúng", () => {
    const reply = handleWasmRequest(
      fakeWasm(() => {
        throw { code: "search_limit", message: "F2L: search exceeded 1600000 nodes" };
      }),
      { id: 2, command: "solve", kind: "scramble", value: "R U" },
      () => undefined
    );
    expect(reply).toEqual({
      id: 2,
      ok: false,
      code: "search_limit",
      error: "F2L: search exceeded 1600000 nodes",
    });
  });
});
