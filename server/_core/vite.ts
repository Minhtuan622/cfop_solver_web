import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import type { InlineConfig, ViteDevServer } from "vite";

/**
 * Đường dẫn của bản Pyodide cục bộ.
 *
 * Một đường dẫn /pyodide/ không có file phải trả 404 chứ không rơi vào
 * index.html của SPA: nếu không, trình duyệt nhận HTML (HTTP 200) rồi cố
 * chạy nó như một module JavaScript và báo lỗi khó hiểu.
 */
export function isPyodidePath(requestPath: string): boolean {
  return requestPath === "/pyodide" || requestPath.startsWith("/pyodide/");
}

export async function setupVite(app: Express, server: Server) {
  // The dev server and its config load inside this function, so the
  // production bundle never has to resolve the vite package it does not ship.
  const [{ createServer: createViteServer }, devConfig] = await Promise.all([
    import("vite"),
    import("../../vite.config"),
  ]);
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite: ViteDevServer = await createViteServer({
    ...(devConfig.default satisfies InlineConfig as InlineConfig),
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("/{*splat}", async (req, res, next) => {
    const url = req.originalUrl;

    if (isPyodidePath(req.originalUrl.split("?")[0])) {
      res.status(404).json({ message: "Không tìm thấy." });
      return;
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // Hashed files under /assets/ stay in the browser cache for a year; the
  // entry page must be revalidated on every visit.
  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        if (filePath.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    }),
  );

  // fall through to index.html if the file doesn't exist
  app.use("/{*splat}", (req, res) => {
    // `req.path` bị cắt theo điểm gắn ("/{*splat}"), nên phải dùng
    // `originalUrl` để thấy được tiền tố /pyodide.
    if (isPyodidePath(req.originalUrl.split("?")[0])) {
      res.status(404).json({ message: "Không tìm thấy." });
      return;
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
