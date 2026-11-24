import { describe, expect, it } from "vitest";
import { SOLVER_NODE_BUDGET, SOLVER_TIME_BUDGET_SEC } from "@/lib/solverBudget";
import { SOLVER_TIMEOUT_MS } from "@/lib/solverRuntime";
import { handleWasmRequest, type SolverWasmModule } from "@/lib/wasmSolverCore";

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
