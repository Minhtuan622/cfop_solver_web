import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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

export function cubingWorkerAliasPlugin(): Plugin {
  return {
    name: "cfop-cubing-worker-alias",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const entry = Object.values(bundle).find(
          item =>
            item.type === "chunk" &&
            /^assets\/search-worker-entry-w\d+-[^/]+\.js$/.test(item.fileName)
        );
        if (!entry || entry.type !== "chunk") return;
        this.emitFile({
          type: "asset",
          fileName: "assets/search-worker-entry.js",
          source: entry.code,
        });
      },
    },
  };
}

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
const includeManusRuntime =
  process.env.NODE_ENV !== "production" ||
  process.env.MANUS_RUNTIME === "1" ||
  environment.MANUS_RUNTIME === "1";
const plugins = [
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  siteUrlPlugin(),
  cubingWorkerAliasPlugin(),
  VitePWA({
    registerType: "autoUpdate",
    injectRegister: "auto",
    includeAssets: ["icon.svg", "icon-maskable.svg", "apple-touch-icon.png"],
    manifest: {
      name: "CFOP Solver Studio",
      short_name: "CFOP Studio",
      description:
        "Giải Rubik CFOP: giải từng bước, bấm giờ, luyện tập và thi đấu",
      lang: "vi",
      start_url: "/",
      scope: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#f8f7f3",
      theme_color: "#007f6c",
      icons: [
        {
          src: "/icon.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "any",
        },
        {
          src: "/icon-maskable.svg",
          sizes: "any",
          type: "image/svg+xml",
          purpose: "maskable",
        },
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icon-maskable-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        {
          src: "/apple-touch-icon.png",
          sizes: "180x180",
          type: "image/png",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html}"],
      navigateFallback: "/index.html",
      importScripts: ["/push-sw.js"],
      navigateFallbackDenylist: [/^\/api\//],
      maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: /\/diagrams\/.*\.svg$/,
          handler: "CacheFirst",
          options: {
            cacheName: "cfop-diagrams",
            expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 180 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
        {
          urlPattern: /\/assets\/.*$/,
          handler: "CacheFirst",
          options: { cacheName: "cfop-assets" },
        },
      ],
    },
  }),
  ...(includeManusRuntime ? [vitePluginManusRuntime()] : []),
  vitePluginOptionalAnalytics(analyticsEndpoint, analyticsWebsiteId),
];

const CUBING_WORKER_CHUNK =
  /(search-worker-entry|inside-[A-Z0-9]+|search-dynamic-|twips-|chunk-[A-Z0-9]{8}|puzzle-geometry)/;

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@solver-wasm": path.resolve(
        import.meta.dirname,
        "packages",
        "solver",
        "solver-wasm",
        "pkg",
      ),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 750,
    modulePreload: {
      resolveDependencies: (filename, deps, { hostId }) =>
        CUBING_WORKER_CHUNK.test(hostId) || CUBING_WORKER_CHUNK.test(filename)
          ? []
          : deps,
    },
    rollupOptions: {
      output: {
        chunkFileNames: chunk =>
          CUBING_WORKER_CHUNK.test(chunk.name)
            ? "assets/[name]-w3-[hash].js"
            : "assets/[name]-[hash].js",
        manualChunks(id) {
          if (id.includes("solverWorker")) return "solver";
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
