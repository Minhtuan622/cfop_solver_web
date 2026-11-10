import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
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
