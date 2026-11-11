import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

/**
 * Regression test cho D1 (hygiene dependency / package manager).
 *
 * Lỗi thật: một lần merge PR của Dependabot (nhánh được tạo từ `main` cũ,
 * trước khi D1 được commit) đã khôi phục lại toàn bộ dependency không dùng,
 * devDependency `pnpm` trùng với trường `packageManager`, và đường dẫn
 * Chromium hệ thống cứng trong script `test:e2e`.
 *
 * Test này chặn việc các dependency chết quay lại và bảo đảm dự án chỉ dùng
 * một package manager (pnpm) với một lockfile duy nhất.
 */

const root = path.resolve(import.meta.dirname, "..");

type PackageJson = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  packageManager?: string;
};

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")) as PackageJson;
}

/** Dependency đã bị gỡ ở D1 — không được quay lại. */
const REMOVED_DEPENDENCIES = [
  "jspdf",
  "@aws-sdk/client-s3",
  "@aws-sdk/s3-request-presigner",
  "framer-motion",
  "cmdk",
  "vaul",
  "embla-carousel-react",
  "input-otp",
  "react-day-picker",
  "react-hook-form",
  "@hookform/resolvers",
  "date-fns",
  "react-resizable-panels",
];

const REMOVED_DEV_DEPENDENCIES = ["add", "pnpm"];

const pkg = readPackageJson();

describe("dependency không dùng đã được gỡ", () => {
  it("không còn dependency chết trong `dependencies`", () => {
    const declared = Object.keys(pkg.dependencies ?? {});
    const back = REMOVED_DEPENDENCIES.filter((dep) => declared.includes(dep));
    expect(back).toEqual([]);
  });

  it("không còn devDependency chết trong `devDependencies`", () => {
    const declared = Object.keys(pkg.devDependencies ?? {});
    const back = REMOVED_DEV_DEPENDENCIES.filter((dep) => declared.includes(dep));
    expect(back).toEqual([]);
  });
});

describe("package manager", () => {
  it("dùng pnpm qua trường `packageManager`", () => {
    expect(pkg.packageManager).toBe("pnpm@10.34.5");
  });

  it("không khai báo pnpm như một devDependency", () => {
    expect(pkg.devDependencies?.["pnpm"]).toBeUndefined();
  });

  it("chỉ có một lockfile (pnpm-lock.yaml), không có package-lock.json", () => {
    expect(existsSync(path.join(root, "pnpm-lock.yaml"))).toBe(true);
    expect(existsSync(path.join(root, "package-lock.json"))).toBe(false);
  });
});

/** Thu thập mọi file mã nguồn để kiểm tra dependency có thực sự được dùng. */
function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  const skipDirs = new Set(["node_modules", "dist", ".git", "coverage", ".manus-logs"]);
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(full, acc);
      continue;
    }
    if ([".ts", ".tsx", ".js", ".mjs", ".jsx", ".py", ".css"].includes(path.extname(entry.name))) {
      acc.push(full);
    }
  }
  return acc;
}

describe("mọi dependency runtime đều được dùng", () => {
  const sources = collectSourceFiles(root);
  const blob = sources.map((file) => readFileSync(file, "utf8")).join("\n");

  it("quét được mã nguồn của repo", () => {
    expect(sources.length).toBeGreaterThan(50);
  });

  it("không có dependency runtime nào bị bỏ sót không dùng", () => {
    const unused = Object.keys(pkg.dependencies ?? {}).filter((dep) => {
      if (dep.startsWith("@types/")) return false;
      const bare = dep.startsWith("@") ? (dep.split("/")[1] ?? dep) : dep;
      return !blob.includes(dep) && !blob.includes(bare);
    });
    expect(unused).toEqual([]);
  });
});

describe("mã nguồn còn tồn tại sau khi gỡ dependency", () => {
  it("không còn import nào trỏ tới package đã gỡ", () => {
    const removed = [...REMOVED_DEPENDENCIES, ...REMOVED_DEV_DEPENDENCIES];
    const offenders: string[] = [];
    for (const file of collectSourceFiles(root)) {
      const content = readFileSync(file, "utf8");
      for (const dep of removed) {
        if (content.includes(`from "${dep}"`) || content.includes(`from '${dep}'`)) {
          offenders.push(`${path.relative(root, file)} -> ${dep}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("không còn thư mục Manus trong static assets (nguồn của build artifact)", () => {
    expect(existsSync(path.join(root, "client", "public", "__manus__"))).toBe(false);
    expect(existsSync(path.join(root, "client", "public", "manus-routes.json"))).toBe(false);
    expect(existsSync(path.join(root, "template.json"))).toBe(false);
  });
});
