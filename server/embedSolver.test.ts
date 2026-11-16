import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regression test cho việc nhúng solver Python vào bundle của client.
 *
 * `client/src/lib/embeddedSolver.ts` là **output** của
 * `scripts/embed-solver.mjs`, được commit vào repo để build production không
 * cần Python. CI kiểm tra bằng cách sinh lại rồi `git diff --exit-code` — nên
 * bundle phải **giống hệt nhau trên mọi OS**.
 *
 * Trước đây script nhúng file `.py` thô, nên bundle mang theo line ending của
 * checkout: Windows (`core.autocrlf`) cho CRLF, Linux cho LF. Hệ quả: bundle
 * commit trên Windows khác bản CI sinh trên Linux → bước "Embed solver and
 * verify no drift" đỏ liên tục.
 *
 * Bài này chốt invariant đó một cách **độc lập với OS**: bundle đã commit
 * phải bằng đúng bundle sinh từ nguồn `.py` đã chuẩn hoá LF.
 */

const root = path.resolve(import.meta.dirname, "..");
const solverDir = path.join(root, "solver-python", "cfop_solver");
const bundlePath = path.join(root, "client", "src", "lib", "embeddedSolver.ts");

/**
 * Payload đã nhúng, đọc ra từ file bundle.
 *
 * File bundle có dạng `export const PYTHON_SOLVER_FILES = {…} as const;` nên
 * phần JSON nằm giữa dấu `{` đầu và dấu `}` cuối.
 */
function embeddedPayload(): Record<string, string> {
  const source = readFileSync(bundlePath, "utf8");
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  return JSON.parse(source.slice(start, end + 1)) as Record<string, string>;
}

/** Nội dung module Python, đã chuẩn hoá LF — giống hệt cách script nhúng. */
function normalizedSource(name: string): string {
  return readFileSync(path.join(solverDir, name), "utf8").replace(/\r\n/g, "\n");
}

describe("bundle solver Python được nhúng", () => {
  it("mọi module đã nhúng khớp với nguồn đã chuẩn hoá LF", () => {
    const payload = embeddedPayload();
    for (const [name, content] of Object.entries(payload)) {
      expect(content, name).toBe(normalizedSource(name));
    }
  });

  it("không bỏ sót module Python nào trong thư mục solver", () => {
    const onDisk = readdirSync(solverDir)
      .filter(name => name.endsWith(".py"))
      .sort();
    expect(Object.keys(embeddedPayload()).sort()).toEqual(onDisk);
  });

  it("bundle không chứa escape CRLF (dấu hiệu sinh từ checkout Windows)", () => {
    // Một bundle sinh trên Windows sẽ chứa `\r\n` bên trong chuỗi JSON.
    // Đây chính là dấu hiệu khiến CI đỏ trước đây.
    const source = readFileSync(bundlePath, "utf8");
    expect(source).not.toContain("\\r\\n");
  });

  it("script embed-solver chuẩn hoá line ending trước khi nhúng", () => {
    // Chặn việc gỡ bước chuẩn hoá: bài test ở trên sẽ không bắt được lỗi
    // ngay lập tức nếu bundle còn đúng, nhưng bước CI thì có.
    const script = readFileSync(
      path.join(root, "scripts", "embed-solver.mjs"),
      "utf8"
    );
    expect(script).toContain(".replace(/\\r\\n/g, \"\\n\")");
  });
});
