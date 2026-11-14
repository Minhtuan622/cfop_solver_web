/**
 * Cache-Control cho file trong bản build tĩnh.
 *
 * `express.static` truyền `filePath` theo dấu phân cách của hệ điều hành:
 * POSIX dùng `/`, Windows dùng `\`. Vì vậy phép so khớp phải chuẩn hoá về `/`
 * trước khi tìm thư mục `assets/`, nếu không file có hash trên Windows sẽ rơi
 * về `public, max-age=0` và trình duyệt tải lại toàn bộ bundle mỗi lần.
 */
export function cacheControlForFile(filePath: string): string | undefined {
  const normalized = filePath.replace(/\\/g, "/");
  if (/(^|\/)assets\//.test(normalized)) {
    return "public, max-age=31536000, immutable";
  }
  if (normalized.endsWith("index.html")) {
    return "no-cache";
  }
  return undefined;
}
