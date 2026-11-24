import fs from "fs";
import path from "path";

export type SharePreview = {
  title: string;
  description: string;
  image: string;
};

const DEFAULT_TITLE = "CFOP Solver Studio — Giải Rubik CFOP";
const DEFAULT_DESCRIPTION =
  "Giải khối Rubik 3x3 trực tuyến miễn phí theo phương pháp CFOP. Nhập scramble hoặc tô màu khối, xem hướng dẫn từng bước, bấm giờ, luyện tập và thi đấu.";

/** Đọc title/description mặc định từ client/index.html (đang dùng điểm khởi đầu cho crawler). */
export function readSharePreview(indexHtml = path.resolve(import.meta.dirname, "../../client/index.html")): SharePreview {
  const html = fs.readFileSync(indexHtml, "utf8");
  const get = (attr: "property" | "name", name: string) => {
    const match = new RegExp(`<meta[^>]+${attr}="${name}"[^>]*content="([^"]*)"[^>]*/>`).exec(html);
    return match?.[1] ?? "";
  };
  return {
    title: get("property", "og:title") || DEFAULT_TITLE,
    description: get("property", "og:description") || DEFAULT_DESCRIPTION,
    image: (get("property", "og:image") || "/og.png").replace(/^https?:\/\/[^/]+/i, ""),
  };
}

/** Inject meta cho crawler: nếu có bản override thì thay, còn giữ nguyên markup tĩnh. */
export function injectSharePreview(html: string, preview: SharePreview): string {
  return html
    .replace(/(<meta property="og:title"[^>]*content=")([^"]*)(")/, `$1${preview.title}$3`)
    .replace(/(<meta property="og:description"[^>]*content=")([^"]*)(")/, `$1${preview.description}$3`)
    .replace(/(<meta property="og:image"[^>]*content=")([^"]*)(")/, `$1${preview.image}$3`)
    .replace(/(<meta name="twitter:title"[^>]*content=")([^"]*)(")/, `$1${preview.title}$3`)
    .replace(/(<meta name="twitter:description"[^>]*content=")([^"]*)(")/, `$1${preview.description}$3`)
    .replace(/(<meta name="twitter:image"[^>]*content=")([^"]*)(")/, `$1${preview.image}$3`);
}

export function readSharePreviewHtml(): string {
  const html = fs.readFileSync(path.resolve(import.meta.dirname, "../../client/index.html"), "utf8");
  return injectSharePreview(html, readSharePreview());
}
