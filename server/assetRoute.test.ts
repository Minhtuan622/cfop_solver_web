import express from "express";
import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isAssetPath, serveStatic } from "./_core/vite";

/**
 * Đường dẫn /assets/ không có file phải trả 404 chứ không rơi vào
 * index.html của SPA.
 *
 * Worker và file `.wasm` của bộ giải nằm dưới /assets/. Nếu một URL cũ (tab
 * mở từ bản deploy trước) nhận HTML với HTTP 200, trình duyệt sẽ cố chạy
 * HTML như module JavaScript/WebAssembly và báo lỗi khó hiểu thay vì
 * "không tìm thấy".
 */

const root = path.resolve(import.meta.dirname, "..");

describe("đường dẫn /assets", () => {
  it("nhận diện đúng các đường dẫn asset", () => {
    expect(isAssetPath("/assets")).toBe(true);
    expect(isAssetPath("/assets/")).toBe(true);
    expect(isAssetPath("/assets/solver_wasm_bg-abc.wasm")).toBe(true);
    expect(isAssetPath("/assets/nested/file.js")).toBe(true);
  });

  it("không nhận nhầm các đường dẫn khác", () => {
    expect(isAssetPath("/")).toBe(false);
    expect(isAssetPath("/profile")).toBe(false);
    expect(isAssetPath("/diagrams/cfop/F2L-01.svg")).toBe(false);
    expect(isAssetPath("/assets-other/file.js")).toBe(false);
  });

  it("cả hai đường gọi trả về index.html đều chặn /assets", () => {
    // serveStatic (production) và setupVite (development) đều có phần fallback
    // về index.html; cả hai phải trả 404 cho /assets.
    const source = readFileSync(path.join(root, "server", "_core", "vite.ts"), "utf8");
    const guards = source.match(/isAssetPath\(req\.originalUrl\.split\("\?"\)\[0\]\)/g) ?? [];
    expect(guards.length).toBe(2);
  });
});

describe("serveStatic với một asset không tồn tại", () => {
  let server: Server;
  let port = 0;

  beforeAll(() => {
    const app = express();
    serveStatic(app);
    server = createServer(app);
    server.listen(0);
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
  });

  it("trả 404 JSON, không trả index.html", async () => {
    const response = await fetch(
      `http://127.0.0.1:${port}/assets/solver_wasm_bg-old.wasm?v=1`
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
