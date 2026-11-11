import { afterEach, describe, expect, it, vi } from "vitest";
import { PYTHON_SOLVER_FILES } from "@/lib/embeddedSolver";
import {
  createPyodideLoader,
  PYODIDE_CDN_INDEX_URL,
  PYODIDE_CDN_SOURCE,
  PYODIDE_LOCAL_INDEX_URL,
  PYODIDE_LOCAL_SOURCE,
  PYODIDE_VERSION,
  resolvePyodideSource,
  SOLVER_PACKAGE_DIR,
  type PyodideModule,
} from "@/lib/pyodideLoader";

describe("pyodideLoader: nguồn Pyodide", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ưu tiên bản cục bộ để chạy được khi offline", async () => {
    const local = { loadPyodide: vi.fn() } as unknown as PyodideModule;
    const remote = { loadPyodide: vi.fn() } as unknown as PyodideModule;
    const importRemote = vi.fn(async () => remote);

    const source = await resolvePyodideSource(async () => local, importRemote);

    expect(source.module).toBe(local);
    expect(source.indexURL).toBe(PYODIDE_LOCAL_INDEX_URL);
    expect(importRemote).not.toHaveBeenCalled();
  });

  it("dùng CDN làm dự phòng khi không có bản cục bộ", async () => {
    const remote = { loadPyodide: vi.fn() } as unknown as PyodideModule;
    const importRemote = vi.fn(async () => remote);

    const source = await resolvePyodideSource(async () => {
      throw new Error("404");
    }, importRemote);

    expect(source.module).toBe(remote);
    expect(source.indexURL).toBe(PYODIDE_CDN_INDEX_URL);
    expect(importRemote).toHaveBeenCalledTimes(1);
  });

  it("ghim phiên bản Pyodide, không dùng 'latest'", () => {
    expect(PYODIDE_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(PYODIDE_CDN_SOURCE).toContain(`/pyodide/v${PYODIDE_VERSION}/`);
    expect(PYODIDE_LOCAL_SOURCE).toBe("/pyodide/pyodide.mjs");
    expect(PYODIDE_LOCAL_SOURCE).not.toContain("http");
  });
});

describe("pyodideLoader: ghi file solver vào filesystem", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ghi mọi file Python của solver trước khi chạy lệnh Python", async () => {
    // Thiếu bước này thì `from cfop_solver import Cube` ném
    // "ImportError: cannot import name 'Cube'" và bộ giải hỏng hoàn toàn.
    const writeFile = vi.fn();
    const mkdirTree = vi.fn();
    const runtime = {
      FS: { mkdirTree, writeFile },
      runPythonAsync: vi.fn().mockResolvedValue("ok"),
    };
    const { getPyodide, resetCache } = createPyodideLoader(async () => runtime);
    resetCache();

    await getPyodide();

    expect(mkdirTree).toHaveBeenCalledWith(SOLVER_PACKAGE_DIR);
    const written = writeFile.mock.calls.map(call => call[0]);
    for (const name of Object.keys(PYTHON_SOLVER_FILES)) {
      expect(written, name).toContain(`${SOLVER_PACKAGE_DIR}/${name}`);
    }
    expect(written.length).toBe(Object.keys(PYTHON_SOLVER_FILES).length);
  });

  it("ghi file solver đúng một lần dù gọi nhiều lần", async () => {
    const writeFile = vi.fn();
    const runtime = {
      FS: { mkdirTree: vi.fn(), writeFile },
      runPythonAsync: vi.fn().mockResolvedValue("ok"),
    };
    const { getPyodide, resetCache } = createPyodideLoader(async () => runtime);
    resetCache();

    await getPyodide();
    await getPyodide();

    expect(writeFile.mock.calls.length).toBe(
      Object.keys(PYTHON_SOLVER_FILES).length
    );
  });
});

describe("pyodideLoader: load failure then retry", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries after a load failure and succeeds", async () => {
    let attempts = 0;
    const failingThenSucceeding = async () => {
      attempts += 1;
      console.log("attempt:", attempts);
      if (attempts === 1) throw new Error("network down");
      return {
        FS: { mkdirTree: vi.fn(), writeFile: vi.fn() },
        runPythonAsync: vi.fn().resolvedTo(undefined),
      } as any;
    };

    const { getPyodide, resetCache } = createPyodideLoader(
      failingThenSucceeding
    );
    resetCache();
    console.log("call 1:");
    try {
      await getPyodide();
      console.log("call 1: RESOLVED (unexpected)");
    } catch (e) {
      console.log("call 1: REJECTED:", (e as Error).message);
    }
    console.log("attempts after call 1:", attempts);
    console.log("call 2:");
    try {
      await getPyodide();
      console.log("call 2: RESOLVED");
    } catch (e) {
      console.log("call 2: REJECTED:", (e as Error).message);
    }
    console.log("attempts after call 2:", attempts);
    expect(attempts).toBe(2);
  });
});
