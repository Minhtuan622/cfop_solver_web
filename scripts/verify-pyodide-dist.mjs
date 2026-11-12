/**
 * Kiểm tra bản Pyodide cục bộ sau khi build.
 *
 * Khi `REQUIRE_LOCAL_PYODIDE=1`, bản phát hành phải chứa đủ năm file
 * Pyodide trong `dist/public/pyodide`; thiếu bất kỳ file nào thì bộ giải sẽ
 * lặng lẽ gọi CDN, đúng thứ mà biến môi trường này cấm.
 *
 *   node scripts/verify-pyodide-dist.mjs
 */
import { stat } from "node:fs/promises";
import path from "node:path";

const FILES = [
  "pyodide.mjs",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

const REQUIRED = process.env.REQUIRE_LOCAL_PYODIDE === "1";
const target = path.resolve(
  import.meta.dirname,
  "..",
  "dist",
  "public",
  "pyodide",
);

const missing = [];
for (const file of FILES) {
  try {
    const info = await stat(path.join(target, file));
    if (!info.isFile() || info.size === 0) missing.push(file);
  } catch {
    missing.push(file);
  }
}

if (missing.length === 0) {
  console.log(`[pyodide] dist/public/pyodide đủ ${FILES.length} file.`);
} else if (REQUIRED) {
  console.error(
    `[pyodide] dist/public/pyodide thiếu: ${missing.join(", ")}. ` +
      "Bản phát hành phải có bản Pyodide cục bộ."
  );
  process.exitCode = 1;
} else {
  console.warn(
    `[pyodide] dist/public/pyodide thiếu: ${missing.join(", ")}. ` +
      "Bộ giải sẽ dùng CDN dự phòng."
  );
}
