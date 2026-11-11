import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  BldCatalogUnavailableError,
  BLDDB_COMMITS,
  BLDDB_FILES,
  clearBldCatalogMemory,
  fetchBldCatalogFile,
} from "./bldCatalogSource";

/**
 * Regression test cho C3 (BLDDB: pin commit SHA + cache offline).
 *
 * Lỗi thật: catalog thuật toán được tải từ nhánh `main`/`v2` của BLDDB —
 * một nhánh chuyển động. Một lần cập nhật upstream có thể đổi hoặc xoá
 * thuật toán mà app đã phân giải, và mỗi lần mở app lại tải lại ~13 MB.
 */

/** Cache API giả đủ dùng cho test. */
class FakeCache {
  readonly store = new Map<string, unknown>();

  async put(request: RequestInfo | URL, response: Response) {
    this.store.set(String(request), await response.clone().json());
  }

  async match(request: RequestInfo | URL) {
    const data = this.store.get(String(request));
    if (data === undefined) return undefined;
    return new Response(JSON.stringify(data), {
      headers: { "content-type": "application/json" },
    });
  }
}

const repoRoot = path.resolve(import.meta.dirname, "../../../../..");

function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  const skipDirs = new Set(["node_modules", "dist", ".git", "coverage"]);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectSourceFiles(full, acc);
    else if (/\.(ts|tsx)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

describe("BLDDB catalog is pinned to a commit SHA", () => {
  it("không dùng tên nhánh (main/v2) trong bất kỳ URL nào", () => {
    for (const [file, url] of Object.entries(BLDDB_FILES)) {
      expect(url, file).not.toMatch(/blddb\/(main|v2|master)\//);
      expect(url, file).toContain("raw.githubusercontent.com/nbwzx/blddb/");
    }
  });

  it("mọi URL chứa một commit SHA đầy đủ 40 ký tự hex", () => {
    for (const [file, url] of Object.entries(BLDDB_FILES)) {
      expect(url, file).toMatch(/blddb\/[0-9a-f]{40}\//);
    }
  });

  it("commit SHA khai báo khớp với SHA nằm trong URL", () => {
    expect(BLDDB_FILES.edge).toContain(BLDDB_COMMITS.v2);
    expect(BLDDB_FILES.parity).toContain(BLDDB_COMMITS.main);
  });

  it("chỉ module nguồn mới chứa URL trực tiếp tới BLDDB", () => {
    const offenders: string[] = [];
    for (const file of collectSourceFiles(
      path.join(repoRoot, "client", "src")
    )) {
      if (path.basename(file).startsWith("bldCatalogSource")) continue;
      const content = readFileSync(file, "utf8");
      if (content.includes("raw.githubusercontent.com/nbwzx/blddb")) {
        offenders.push(path.relative(repoRoot, file));
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("BLDDB catalog cache", () => {
  let cache: FakeCache;

  beforeEach(() => {
    clearBldCatalogMemory();
    cache = new FakeCache();
    vi.stubGlobal("caches", {
      open: vi.fn(async () => cache),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearBldCatalogMemory();
  });

  it("lưu response vào Cache API để dùng lại offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ACE: "R U" })))
    );

    const data = await fetchBldCatalogFile<Record<string, string>>("edge");

    expect(data).toEqual({ ACE: "R U" });
    expect(cache.store.has(BLDDB_FILES.edge)).toBe(true);
  });

  it("dùng bản cache khi mạng lỗi (offline)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ACE: "R U" })))
    );
    await fetchBldCatalogFile("edge");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );
    clearBldCatalogMemory();

    const data = await fetchBldCatalogFile<Record<string, string>>("edge");
    expect(data).toEqual({ ACE: "R U" });
  });

  it("báo lỗi rõ ràng khi không tải được và không có cache", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      })
    );

    await expect(fetchBldCatalogFile("edge")).rejects.toBeInstanceOf(
      BldCatalogUnavailableError
    );
  });

  it("không tải lại cùng một file khi có nhiều lời gọi đồng thời", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ ACE: "R U" }))
    );
    vi.stubGlobal("fetch", fetchMock);

    const [first, second] = await Promise.all([
      fetchBldCatalogFile("edge"),
      fetchBldCatalogFile("edge"),
    ]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("giữ nguyên hành vi khi Cache API không khả dụng", async () => {
    vi.stubGlobal("caches", undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ACE: "R U" })))
    );

    const data = await fetchBldCatalogFile<Record<string, string>>("edge");
    expect(data).toEqual({ ACE: "R U" });
  });
});
