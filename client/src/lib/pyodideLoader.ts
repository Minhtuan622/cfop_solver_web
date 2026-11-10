/** Trình tải Pyodide từ CDN, giữ một bản cache riêng cho mỗi web worker.
 *
 * Mỗi worker nên gọi `createPyodideLoader()` một lần để có một bản
 * `pyodidePromise` riêng: việc tải Pyodide của một worker không ảnh hưởng
 * đến worker khác. Khi tải thất bại, cache bị xóa (không được lưu lại lỗi)
 * để lần gọi sau có thể thử lại.
 */
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
  const runtime = await module.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
  runtime.FS.mkdirTree("/home/pyodide/cfop_solver");
  return runtime;
}
