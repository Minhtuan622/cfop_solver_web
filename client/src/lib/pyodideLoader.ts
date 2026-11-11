/** Trình tải Pyodide, giữ một bản cache riêng cho mỗi web worker.
 *
 * Mỗi worker nên gọi `createPyodideLoader()` một lần để có một bản
 * `pyodidePromise` riêng: việc tải Pyodide của một worker không ảnh hưởng
 * đến worker khác. Khi tải thất bại, cache bị xóa (không được sưu lại lỗi)
 * để lần gọi sau có thể thử lại.
 */
import { PYTHON_SOLVER_FILES } from "@/lib/embeddedSolver";

export type PyodideLike = {
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, content: string): void;
  };
  runPythonAsync(code: string): Promise<unknown>;
};

const PYODIDE_SOURCE =
  "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/pyodide.mjs";
const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.27.7/full/";

/** Thư mục chứa package Python của solver trong filesystem của Pyodide. */
export const SOLVER_PACKAGE_DIR = "/home/pyodide/cfop_solver";

/**
 * Ghi các file Python của solver vào filesystem của Pyodide.
 *
 * Không có bước này thì `from cfop_solver import Cube` sẽ ném
 * `ImportError: cannot import name 'Cube' from 'cfop_solver'` và bộ giải
 * không chạy được. Việc ghi nằm ở loader (dùng chung cho cả worker solve
 * và worker validate) nên không worker nào phải tự lo.
 */
export function writeSolverFiles(runtime: PyodideLike): void {
  runtime.FS.mkdirTree(SOLVER_PACKAGE_DIR);
  for (const [name, content] of Object.entries(PYTHON_SOLVER_FILES) as [
    string,
    string,
  ][]) {
    runtime.FS.writeFile(`${SOLVER_PACKAGE_DIR}/${name}`, content);
  }
}

/** Tạo một bộ tải Pyodide có cache riêng. */
export function createPyodideLoader(
  loadPyodide: () => Promise<PyodideLike> = loadPyodideFromCDN,
) {
  let pyodidePromise: Promise<PyodideLike> | null = null;

  async function getPyodide(): Promise<PyodideLike> {
    if (pyodidePromise) return pyodidePromise;
    let runtime: PyodideLike;
    try {
      runtime = await loadPyodide();
      // Solver Python phải có mặt trong filesystem trước khi chạy bất kỳ
      // lệnh Python nào.
      writeSolverFiles(runtime);
    } catch (error) {
      // Không cache lỗi: xóa promise để lần gọi sau có thể thử lại.
      pyodidePromise = null;
      throw new Error(
        "Không thể tải Pyodide từ CDN. Hãy kiểm tra kết nối mạng rồi thử lại.",
      );
    }
    pyodidePromise = Promise.resolve(runtime);
    return runtime;
  }

  function resetCache(): void {
    pyodidePromise = null;
  }

  return { getPyodide, resetCache };
}

async function loadPyodideFromCDN(): Promise<PyodideLike> {
  const module = (await import(/* @vite-ignore */ PYODIDE_SOURCE)) as {
    loadPyodide: (options: { indexURL: string }) => Promise<PyodideLike>;
  };
  return module.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
}
