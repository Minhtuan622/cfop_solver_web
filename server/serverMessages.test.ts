import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { serverMessageKeys } from "@shared/serverMessages";

const serverRoot = path.resolve(import.meta.dirname);

const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừừửữựỳýỷỹịđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

const NOT_INTERFACE_TEXT = [
  "Đặt lại mật khẩu CFOP Solver Studio",
  "Chào ${",
  "${source.name}",
  // Meta chia sẻ mặc định (og:title/og:description) cho crawler, không phải lỗi gửi cho client.
  "CFOP Solver Studio — Giải Rubik CFOP",
  "Giải khối Rubik 3x3 trực tuyến miễn phí",
  // Trang 404 khi chưa build, chỉ người phát triển thấy.
  "Chưa xây dựng ứng dụng",
];

function serverFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return serverFiles(full);
    if (!entry.name.endsWith(".ts")) return [];
    if (/\.(test|spec)\.ts$/.test(entry.name)) return [];
    return [full];
  });
}

function sentences(source: string): string[] {
  const found: string[] = [];
  const pattern = /(["'`])([^"'`\n]*?)\1/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    if (VIETNAMESE.test(match[2])) found.push(match[2]);
  }
  return found;
}

describe("the server wording catalogue", () => {
  it("lists every Vietnamese sentence the server can send", () => {
    const missing: string[] = [];

    for (const file of serverFiles(serverRoot)) {
      for (const sentence of sentences(readFileSync(file, "utf8"))) {
        if (NOT_INTERFACE_TEXT.some(marker => sentence.startsWith(marker))) continue;
        if (Object.prototype.hasOwnProperty.call(serverMessageKeys, sentence)) continue;
        const prefix = sentence.split("${")[0].trim();
        if (prefix && Object.prototype.hasOwnProperty.call(serverMessageKeys, prefix)) continue;
        missing.push(`${path.relative(serverRoot, file)}: ${sentence}`);
      }
    }

    expect(missing).toEqual([]);
  });

  it("does not list a sentence the server never sends", () => {
    const sources = serverFiles(serverRoot)
      .map(file => readFileSync(file, "utf8"))
      .join("\n");
    const known = Object.keys(serverMessageKeys);
    const orphans = known.filter(sentence => !sources.includes(sentence));

    expect(orphans).toEqual([]);
  });
});
