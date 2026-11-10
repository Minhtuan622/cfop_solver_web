/** Xưởng Cơ Khí Tốc Độ — worker xử lý các tác vụ NHẸ (validate, catalog) dùng Pyodide.
 *
 * Có một bản cache Pyodide riêng biệt so với worker solve (`solverWorker.ts`)
 * nên việc tải/tải lại Pyodide của một bên không làm hủy tác vụ đang chạy
 * của bên khác. Một timeout của validate không thể hủy một lần giải đang chạy.
 */
import { createPyodideLoader } from "@/lib/pyodideLoader";

const { getPyodide } = createPyodideLoader();

type PyodideLike = {
  runPythonAsync(code: string): Promise<unknown>;
};

self.onmessage = async (
  event: MessageEvent<{
    id: number;
    command?: "validate" | "catalog";
    kind?: string;
    value: string;
    family?: string;
    group?: string;
    query?: string;
    limit?: number;
  }>,
) => {
  const { id, command = "validate", kind, value, family = "all", group = "all", query = "", limit = 120 } =
    event.data;
  try {
    const runtime: PyodideLike = await getPyodide();
    const request = JSON.stringify({ kind, value, family, group, query, limit });
    if (command === "catalog") {
      const output = await runtime.runPythonAsync(`
import json
from cfop_solver.full_last_layer import list_direct_one_look_cases
request = json.loads(${JSON.stringify(request)})
json.dumps({"cases": list_direct_one_look_cases(request.get("family", "all"), request.get("query", ""), request.get("group", "all"), request.get("limit", 120))})
`);
      self.postMessage({ id, ok: true, output: String(output) });
      return;
    }
    if (command === "validate") {
      const output = await runtime.runPythonAsync(`
import json
from cfop_solver import Cube, validate_cube
request = json.loads(${JSON.stringify(request)})
try:
    validate_cube(Cube(request["value"]))
    result = {"valid": True, "message": "Trạng thái hợp lệ · 54 sticker · 9 mỗi màu"}
except Exception as error:
    result = {"valid": False, "message": str(error)}
json.dumps(result)
`);
      self.postMessage({ id, ok: true, output: String(output) });
      return;
    }
    self.postMessage({ id, ok: false, error: `Unknown command: ${command}` });
  } catch (error) {
    self.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
