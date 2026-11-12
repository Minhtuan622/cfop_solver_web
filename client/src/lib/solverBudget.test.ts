import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SOLVER_NODE_BUDGET, SOLVER_TIME_BUDGET_SEC } from "@/lib/solverBudget";
import { SOLVER_TIMEOUT_MS } from "@/lib/solverRuntime";

/**
 * Regression test cho B2: worker phải truyền ngân sách giới hạn xuống solver.
 *
 * Lỗi thật: worker chỉ truyền `direct_node_budget` nên bước ghép cặp F2L
 * không bị giới hạn; khi cặp đó rơi vào trạng thái khó, bộ tìm kiếm chạy
 * hàng triệu node và người dùng chỉ thấy thông báo hết giờ chung chung.
 */

const root = path.resolve(import.meta.dirname, "../../..");
const workerSource = readFileSync(
  path.join(root, "client", "src", "lib", "solverWorker.ts"),
  "utf8"
);

describe("B2: worker truyền ngân sách giới hạn cho solver", () => {
  it("truyền time_budget_sec xuống solve()", () => {
    expect(workerSource).toContain("time_budget_sec=");
    expect(workerSource).toContain('request.get("timeBudgetSec"');
  });

  it("truyền node_budget xuống solve()", () => {
    expect(workerSource).toContain("node_budget=");
    expect(workerSource).toContain('request.get("nodeBudget"');
  });

  it("lấy ngân sách từ module dùng chung", () => {
    expect(workerSource).toContain("SOLVER_TIME_BUDGET_SEC");
    expect(workerSource).toContain("SOLVER_NODE_BUDGET");
  });

  it("ngân sách của solver nhỏ hơn giới hạn của client", () => {
    // Client ngắt worker sau SOLVER_TIMEOUT_MS. Solver phải hết ngân sách
    // trước đó để báo lỗi có cấu trúc thay vì bị ngắt giữa chừng.
    expect(SOLVER_TIME_BUDGET_SEC).toBeLessThan(SOLVER_TIMEOUT_MS / 1000);
    expect(SOLVER_NODE_BUDGET).toBeGreaterThan(0);
  });

  it("tách mã lỗi có cấu trúc để giao diện hiển thị đúng", () => {
    expect(workerSource).toContain("search_limit");
    const runtime = readFileSync(
      path.join(root, "client", "src", "lib", "solverRuntime.ts"),
      "utf8"
    );
    expect(runtime).toContain("SolverLimitError");
    expect(runtime).toContain('event.data.code === "search_limit"');
  });
});
