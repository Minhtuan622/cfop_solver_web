import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";



function vitePluginOptionalAnalytics(
  endpoint?: string,
  websiteId?: string
): Plugin {
  return {
    name: "optional-analytics",
    transformIndexHtml(html) {
      const baseUrl = endpoint?.trim().replace(/\/$/, "");
      const id = websiteId?.trim();

      if (!baseUrl || !id) {
        return html;
      }

      return {
        html,
        tags: [
          {
            tag: "script",
            attrs: {
              defer: true,
              src: `${baseUrl}/umami`,
              "data-website-id": id,
            },
            injectTo: "body",
          },
        ],
      };
    },
  };
}

/**
 * Writes the public site address into the page so canonical links and
 * structured data are not hard-coded to cfop-solver.studio.
 *
 * `VITE_SITE_URL` comes from the build environment, from `.env`/`.env.production`,
 * or falls back to `https://cfop-solver.studio/`.
 */
export function siteUrlPlugin(): Plugin {
  const siteUrl =
    process.env.VITE_SITE_URL ?? environment.VITE_SITE_URL ?? "https://cfop-solver.studio/";
  const prefix = "https://cfop-solver.studio/";
  return {
    name: "cfop-site-url",
    transformIndexHtml(html: string) {
      return html.split(prefix).join(siteUrl);
    },
  };
}

/**
 * Serves the local Pyodide distribution during development.
 *
 * The Pyodide files live in `client/public/pyodide` and are copied verbatim by
 * the build — they must not go through Vite's transform pipeline. In dev,
 * however, Vite appends `?import` to every dynamic import, and the transform
 * middleware then refuses the request with "This file is in /public and will
 * be copied as-is during build". The solver would silently fall back to the
 * CDN, so the dev server serves those files itself.
 */
export function localPyodidePlugin(): Plugin {
  const pyodideDir = path.resolve(
    import.meta.dirname,
    "client",
    "public",
    "pyodide",
  );
  const contentTypes: Record<string, string> = {
    ".mjs": "text/javascript",
    ".js": "text/javascript",
    ".wasm": "application/wasm",
    ".json": "application/json",
    ".zip": "application/zip",
  };

  return {
    name: "cfop-local-pyodide",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? "";
        if (!url.startsWith("/pyodide/")) return next();
        const name = decodeURIComponent(url.slice("/pyodide/".length).split("?")[0]);
        if (!name || name.includes("/") || name.includes("..")) return next();
        const file = path.join(pyodideDir, name);
        try {
          const body = readFileSync(file);
          res.setHeader(
            "Content-Type",
            contentTypes[path.extname(name)] ?? "application/octet-stream",
          );
          res.setHeader("Cache-Control", "no-cache");
          res.end(body);
        } catch {
          next();
        }
      });
    },
  };
}

const projectRoot = import.meta.dirname;
const environment = loadEnv(
  process.env.NODE_ENV === "production" ? "production" : "development",
  projectRoot,
  ""
);
const analyticsEndpoint =
  process.env.VITE_ANALYTICS_ENDPOINT ?? environment.VITE_ANALYTICS_ENDPOINT;
const analyticsWebsiteId =
  process.env.VITE_ANALYTICS_WEBSITE_ID ??
  environment.VITE_ANALYTICS_WEBSITE_ID;
// The Manus runtime is an iframe bridge for the Manus preview host. It inlines
// a ~360 kB script into index.html, so keep it out of standalone production
// builds. Set MANUS_RUNTIME=1 for a build hosted inside Manus.
const includeManusRuntime =
  process.env.NODE_ENV !== "production" ||
  process.env.MANUS_RUNTIME === "1" ||
  environment.MANUS_RUNTIME === "1";
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  siteUrlPlugin(),
  localPyodidePlugin(),
  ...(includeManusRuntime ? [vitePluginManusRuntime()] : []),
  vitePluginOptionalAnalytics(analyticsEndpoint, analyticsWebsiteId),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Three.js/Twisty are loaded only by Puzzle3DCanvas via dynamic import().
    // Their raw chunks are intentionally larger than Vite's generic 500 kB
    // advisory, while their gzip sizes remain suitable for an on-demand view.
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Do not force recharts into a manual chunk: Rollup would then pull
          // its React dependency into that chunk, and the entry would have to
          // preload the whole charting library just to get React. Let the lazy
          // route imports create the shared chart chunk instead.
          if (id.includes("embeddedSolver") || id.includes("solverWorker"))
            return "solver";
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["cubing", "cubing/scramble", "cubing/twisty"],
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
