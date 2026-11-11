/**
 * Tải bản phân phối Pyodide về `client/public/pyodide` để bộ giải chạy được
 * khi offline, không phụ thuộc CDN.
 *
 * Chạy tự động qua `pnpm dev` và `pnpm build`. Script là idempotent: nếu bản
 * cục bộ đã đúng phiên bản thì bỏ qua, không tải lại.
 *
 *   pnpm fetch-pyodide            # tải nếu thiếu
 *   pnpm fetch-pyodide --force    # tải lại từ đầu
 *
 * Thư mục đích bị gitignore, nên repo không phình; bản build trên CI sẽ có
 * nó vì script chạy trước khi build.
 */
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import process from "node:process";

/** Phiên bản Pyodide — phải khớp với PYODIDE_VERSION trong pyodideLoader.ts. */
const PYODIDE_VERSION = "0.27.7";
const CDN_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const TARGET_DIR = path.resolve(
  import.meta.dirname,
  "..",
  "client",
  "public",
  "pyodide"
);

/**
 * Năm file Pyodide thực sự được nạp lúc chạy:
 * - pyodide.mjs: module loader mà worker import
 * - pyodide.asm.js: phần nối JavaScript của runtime
 * - pyodide.asm.wasm: bản dịch WebAssembly
 * - python_stdlib.zip: thư viện chuẩn Python
 * - pyodide-lock.json: danh mục package
 */
const FILES = [
  "pyodide.mjs",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

const MARKER = ".pyodide-version";

async function isUpToDate() {
  try {
    const marker = await import("node:fs/promises").then(fs =>
      fs.readFile(path.join(TARGET_DIR, MARKER), "utf8")
    );
    if (marker.trim() !== PYODIDE_VERSION) return false;
    for (const file of FILES) {
      const info = await stat(path.join(TARGET_DIR, file));
      if (!info.isFile() || info.size === 0) return false;
    }
    return true;
  } catch {
    return false;
  }
}

async function download(file) {
  const url = `${CDN_BASE}/${file}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} -> HTTP ${response.status}`);
  }
  const temporary = path.join(TARGET_DIR, `${file}.part`);
  await pipeline(response.body, createWriteStream(temporary));
  await rename(temporary, path.join(TARGET_DIR, file));
}

async function main() {
  const force = process.argv.includes("--force");
  if (!force && (await isUpToDate())) {
    console.log(`[pyodide] bản cục bộ ${PYODIDE_VERSION} đã có, bỏ qua.`);
    return;
  }

  await rm(TARGET_DIR, { recursive: true, force: true });
  await mkdir(TARGET_DIR, { recursive: true });

  console.log(`[pyodide] tải Pyodide ${PYODIDE_VERSION} về ${TARGET_DIR}`);
  for (const file of FILES) {
    await download(file);
    const info = await stat(path.join(TARGET_DIR, file));
    console.log(
      `[pyodide]   ${file} (${(info.size / 1024 / 1024).toFixed(2)} MB)`
    );
  }
  await writeFile(
    path.join(TARGET_DIR, MARKER),
    `${PYODIDE_VERSION}\n`,
    "utf8"
  );
  console.log("[pyodide] xong.");
}

main().catch(error => {
  // Bộ giải vẫn chạy được nhờ CDN dự phòng, nên lỗi tải không được chặn
  // cả quá trình build hay dev.
  console.warn(
    `[pyodide] KHÔNG tải được bản cục bộ: ${error.message}. ` +
      "Bộ giải sẽ dùng CDN dự phòng."
  );
  process.exitCode = 0;
});
