/** Xưởng Cơ Khí Tốc Độ — worker isolates computational CFOP searches from UI.
 *
 * Chịu sức các tác vụ NẰNG (solve, bld, warmup) dùng Pyodide. Mỗi worker
 * có một bản cache Pyodide riêng qua `createPyodideLoader`, nên việc tải
 * Pyodide của worker này không ảnh hưởng đến worker xử lý tác vụ nhẹ
 * (validate/catalog) và ngược lại.
 */
import { PYTHON_SOLVER_FILES } from "@/lib/embeddedSolver";
import { createPyodideLoader } from "@/lib/pyodideLoader";

const { getPyodide } = createPyodideLoader();

type PyodideLike = {
  FS: { writeFile(path: string, content: string): void };
  runPythonAsync(code: string): Promise<unknown>;
};

self.onmessage = async (
  event: MessageEvent<{
    id: number;
    command?: "solve" | "bld" | "warmup";
    kind?: string;
    value: string;
    crossColor?: string;
    opening?: "cross" | "auto" | "xxcross" | "xxxcross" | "xxxxcross";
    lastLayer?: "oll_pll" | "zbll" | "1lll" | "auto";
    openingDepth?: number;
    openingFindResult?: boolean;
    directNodeBudget?: number;
    preferredSlot?: string;
    excludedSlots?: string[];
  }>,
) => {
  const {
    id,
    command = "solve",
    kind,
    value,
    crossColor = "U",
    opening = "cross",
    lastLayer = "auto",
    openingDepth = 8,
    openingFindResult = false,
    directNodeBudget = 5000,
    preferredSlot,
    excludedSlots = [],
  } = event.data;
  try {
    const runtime: PyodideLike = await getPyodide();
    const request = JSON.stringify({
      kind,
      value,
      crossColor,
      opening,
      lastLayer,
      openingDepth,
      openingFindResult,
      directNodeBudget,
      preferredSlot,
      excludedSlots,
    });
    if (command === "warmup") {
      await runtime.runPythonAsync(
        "from cfop_solver.search import cross_pruning_table; cross_pruning_table()",
      );
      self.postMessage({ id, ok: true, output: JSON.stringify({ ready: true }) });
      return;
    }
    const output = await runtime.runPythonAsync(`
import json
from cfop_solver import Cube, parse_moves, solve
request = json.loads(${JSON.stringify(request)})
initial = Cube(request["value"]) if request["kind"] == "state" else Cube().apply_many(parse_moves(request["value"]))
preferred = request.get("preferredSlot")
excluded = tuple(slot for slot in request.get("excludedSlots", []) if slot in ("FR", "FL", "BL", "BR"))
opening_depth = max(4, min(10, int(request.get("openingDepth", 8))))
node_budget = max(500, min(50000, int(request.get("directNodeBudget", 5000))))
solution = solve(initial, last_layer=request.get("lastLayer", "auto"), cross_color=request.get("crossColor", "U"), opening=request.get("opening", "cross"), xcross_depth=opening_depth, xxcross_depth=opening_depth, xxxcross_depth=opening_depth, xxxxcross_depth=opening_depth, xcross_preferred_slot=preferred, xcross_excluded_slots=excluded, opening_find_result=bool(request.get("openingFindResult", False)), direct_node_budget=node_budget)
current = initial
trace, phases = [], []
for record in solution.phases:
    start = len(trace)
    for move in record.moves:
        current = current.apply(move)
        trace.append({"index": len(trace) + 1, "phase": record.name, "move": move, "state": current.stickers})
    phases.append({"name": record.name, "algorithm": record.algorithm, "moves": list(record.moves), "state_after": record.state_after, "valid_after": record.valid_after, "predicate_after": record.predicate_after, "case_id": record.case_id, "start": start, "end": len(trace)})
json.dumps({"initial_state": initial.stickers, "final_state": solution.final_state, "algorithm": solution.algorithm, "opening": solution.opening_summary, "last_layer": solution.last_layer_summary, "phases": phases, "trace": trace})
`);
    self.postMessage({ id, ok: true, output: String(output) });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
