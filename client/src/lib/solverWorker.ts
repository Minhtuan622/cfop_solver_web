/** Xưởng Cơ Khí Tốc Độ — worker isolates computational CFOP searches from UI. */
import { PYTHON_SOLVER_FILES } from "@/lib/embeddedSolver";

type PyodideLike = {
  FS: { mkdirTree(path: string): void; writeFile(path: string, content: string): void };
  runPythonAsync(code: string): Promise<unknown>;
};

let pyodidePromise: Promise<PyodideLike> | null = null;

async function getPyodide() {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      const source = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs";
      const module = (await import(/* @vite-ignore */ source)) as { loadPyodide: (options: { indexURL: string }) => Promise<PyodideLike> };
      const runtime = await module.loadPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/" });
      runtime.FS.mkdirTree("/home/pyodide/cfop_solver");
      for (const [name, content] of Object.entries(PYTHON_SOLVER_FILES) as [string, string][]) {
        runtime.FS.writeFile(`/home/pyodide/cfop_solver/${name}`, content);
      }
      await runtime.runPythonAsync("import sys; sys.path.insert(0, '/home/pyodide')");
      return runtime;
    })();
  }
  return pyodidePromise;
}

self.onmessage = async (event: MessageEvent<{ id: number; command?: "solve" | "case"; kind?: string; value: string }>) => {
  const { id, command = "solve", kind, value } = event.data;
  try {
    const runtime = await getPyodide();
    const request = JSON.stringify({ kind, value });
    if (command === "case") {
      const output = await runtime.runPythonAsync(`
import json
from cfop_solver import Cube, parse_moves
request = json.loads(${JSON.stringify(request)})
case_state = Cube().apply_many(parse_moves(request["value"]))
json.dumps({"state": case_state.stickers})
`);
      self.postMessage({ id, ok: true, output: String(output) });
      return;
    }
    const output = await runtime.runPythonAsync(`
import json
from cfop_solver import Cube, parse_moves, solve
request = json.loads(${JSON.stringify(request)})
initial = Cube(request["value"]) if request["kind"] == "state" else Cube().apply_many(parse_moves(request["value"]))
solution = solve(initial, last_layer="full")
current = initial
trace, phases = [], []
for record in solution.phases:
    start = len(trace)
    for move in record.moves:
        current = current.apply(move)
        trace.append({"index": len(trace) + 1, "phase": record.name, "move": move, "state": current.stickers})
    phases.append({"name": record.name, "algorithm": record.algorithm, "moves": list(record.moves), "state_after": record.state_after, "valid_after": record.valid_after, "predicate_after": record.predicate_after, "case_id": record.case_id, "start": start, "end": len(trace)})
json.dumps({"initial_state": initial.stickers, "final_state": solution.final_state, "algorithm": solution.algorithm, "phases": phases, "trace": trace})
`);
    self.postMessage({ id, ok: true, output: String(output) });
  } catch (error) {
    self.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  }
};
