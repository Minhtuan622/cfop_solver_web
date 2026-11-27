import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import type { InlineConfig, ViteDevServer } from "vite";
import { cacheControlForFile } from "./staticCache";
import { injectSharePreview, readSharePreview } from "../services/sharePreview";

export function isAssetPath(requestPath: string): boolean {
  return requestPath === "/assets" || requestPath.startsWith("/assets/");
}

export async function setupVite(app: Express, server: Server) {
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

    if (isAssetPath(req.originalUrl.split("?")[0])) {
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

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = injectSharePreview(template, readSharePreview(clientTemplate));
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

  app.use(
    express.static(distPath, {
      setHeaders(res, filePath) {
        const cacheControl = cacheControlForFile(filePath);
        if (cacheControl) {
          res.setHeader("Cache-Control", cacheControl);
        }
      },
    }),
  );

  const indexHtmlPath = path.resolve(distPath, "index.html");
  const indexHtml = fs.existsSync(indexHtmlPath)
    ? injectSharePreview(
        fs.readFileSync(indexHtmlPath, "utf8"),
        readSharePreview(indexHtmlPath)
      )
    : undefined;

  app.use("/{*splat}", (req, res) => {
    if (isAssetPath(req.originalUrl.split("?")[0])) {
      res.status(404).json({ message: "Không tìm thấy." });
      return;
    }
    if (indexHtml === undefined) {
      res.status(404).send("Chưa xây dựng ứng dụng, chạy pnpm build.");
      return;
    }
    res.status(200).type("text/html").send(indexHtml);
  });
}
