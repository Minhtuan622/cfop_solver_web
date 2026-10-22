/**
 * Keeps the shared catalogue in step with the sentences the server writes.
 *
 * The server answers in Vietnamese, so every sentence it can send has to be
 * listed in `shared/serverMessages.ts`; a sentence that is missing would reach
 * an English visitor as untranslatable Vietnamese, or as raw internals. This
 * test reads the server sources and fails when a sentence is missing, so the
 * two never drift apart.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { serverMessageKeys } from "@shared/serverMessages";

const serverRoot = path.resolve(import.meta.dirname);

/** Vietnamese letters, the mark that tells interface wording from code. */
const VIETNAMESE = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừừửữựỳýỷỹịđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;

/**
 * Text the server writes that is not wording of the interface: the subject and
 * the body of the reset email, and the name of a rematch room. None of them
 * reaches a button, a banner or an error.
 */
const NOT_INTERFACE_TEXT = ["Đặt lại mật khẩu CFOP Solver Studio", "Chào ${", "${source.name}"];

function serverFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return serverFiles(full);
    if (!entry.name.endsWith(".ts")) return [];
    if (/\.(test|spec)\.ts$/.test(entry.name)) return [];
    return [full];
  });
}

/** Every quoted sentence of a source file that carries a Vietnamese letter. */
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
        // A sentence with a dynamic tail keeps the known prefix and adds the
        // text a person wrote, so the prefix is what the catalogue holds.
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
