import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    // 30 giây: một số test sinh scramble bằng Cubing.js mất vài giây, và
    // lâu hơn nhiều khi máy đang chạy song song việc khác.
    testTimeout: 30_000,
    projects: [
      {
        extends: true,
        test: {
          name: "server",
          environment: "node",
          include: ["server/**/*.test.ts", "server/**/*.spec.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "client",
          environment: "jsdom",
          include: ["client/src/**/*.test.ts", "client/src/**/*.test.tsx", "client/src/**/*.spec.ts", "client/src/**/*.spec.tsx"],
        },
      },
    ],
  },
});
