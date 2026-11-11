/** Trình tải Pyodide, giữ một bản cache riêng cho mỗi web worker.
 *
 * Mỗi worker nên gọi `createPyodideLoader()` một lần để có một bản
 * `pyodidePromise` riêng: việc tải Pyodide của một worker không ảnh hưởng
 * đến worker khác. Khi tải thất bại, cache bị xóa (không được sưu lại lỗi)
 * để lần gọi sau có thể thử lại.
 *
 * Pyodide được ưu tiên lấy từ **bản cục bộ** trong `client/public/pyodide`
 * (do `pnpm fetch-pyodide` tải về lúc build). Nhờ vậy bộ giải chạy được khi
 * offline. CDN chỉ là dự phòng cho trường hợp bản cục bộ chưa có — ví dụ
 * khi chạy dev mà chưa chạy script tải.
 */
import { PYTHON_SOLVER_FILES } from "@/lib/embeddedSolver";

export type PyodideLike = {
  FS: {
    mkdirTree(path: string): void;
    writeFile(path: string, content: string): void;
  };
  runPythonAsync(code: string): Promise<unknown>;
};

export type PyodideModule = {
  loadPyodide: (options: { indexURL: string }) => Promise<PyodideLike>;
};

/** Phiên bản Pyodide được ghim — đổi thì phải tải lại bản cục bộ. */
export const PYODIDE_VERSION = "0.27.7";

/** Bản cài cục bộ, phục vụ từ `client/public/pyodide`. */
export const PYODIDE_LOCAL_BASE = "/pyodide/";
export const PYODIDE_LOCAL_SOURCE = `${PYODIDE_LOCAL_BASE}pyodide.mjs`;
export const PYODIDE_LOCAL_INDEX_URL = PYODIDE_LOCAL_BASE;

/** CDN dự phòng khi chưa có bản cục bộ. */
export const PYODIDE_CDN_SOURCE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;
export const PYODIDE_CDN_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

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
  loadPyodide: () => Promise<PyodideLike> = loadPyodideFromLocalOrCdn
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
        "Không thể tải Pyodide. Hãy kiểm tra kết nối mạng rồi thử lại."
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

/**
 * Chọn nguồn Pyodide: bản cục bộ trước, CDN làm dự phòng.
 *
 * Hàm nhận hai hàm import để test được: nếu bản cục bộ không tồn tại thì
 * import đó ném lỗi và CDN được dùng thay.
 */
export async function resolvePyodideSource(
  importLocal: () => Promise<PyodideModule>,
  importRemote: () => Promise<PyodideModule>
): Promise<{ module: PyodideModule; indexURL: string }> {
  try {
    const module = await importLocal();
    return { module, indexURL: PYODIDE_LOCAL_INDEX_URL };
  } catch {
    const module = await importRemote();
    return { module, indexURL: PYODIDE_CDN_INDEX_URL };
  }
}

/**
 * URL của module Pyodide cục bộ.
 *
 * URL được trả về từ một hàm, không phải hằng số: Vite phân tích được
 * `import("/pyodide/pyodide.mjs")` và thêm `?import` vào URL, khiến dev
 * server trả về index.html thay vì module. Khi không phân tích tĩnh được,
 * `@vite-ignore` giữ nguyên URL và file trong `public/` được nạp như một
 * module bình thường.
 */
function localModuleUrl(): string {
  return `${PYODIDE_LOCAL_BASE}pyodide.mjs`;
}

/** URL của module Pyodide trên CDN, cũng phải qua hàm để không bị Vite ghi lại. */
function remoteModuleUrl(): string {
  return `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.mjs`;
}

async function importLocalModule(): Promise<PyodideModule> {
  return (await import(/* @vite-ignore */ localModuleUrl())) as PyodideModule;
}

async function importRemoteModule(): Promise<PyodideModule> {
  return (await import(/* @vite-ignore */ remoteModuleUrl())) as PyodideModule;
}

async function loadPyodideFromLocalOrCdn(): Promise<PyodideLike> {
  const { module, indexURL } = await resolvePyodideSource(
    importLocalModule,
    importRemoteModule
  );
  return module.loadPyodide({ indexURL });
}
