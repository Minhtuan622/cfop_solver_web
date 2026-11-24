import { describe, expect, it } from "vitest";
import { buildShareUrl, parseShareParams } from "./shareLink";

const FACELETS = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

describe("link chia sẻ trang Giải", () => {
  it("đi vòng scramble qua URL không mất ký tự", () => {
    const scramble = "R U R' U' F2 Rw' 3Uw";
    const url = buildShareUrl("https://x.test", { kind: "cfop", scramble });
    expect(parseShareParams(new URL(url).search)).toEqual({ kind: "cfop", scramble });
  });

  it("đi vòng ký hiệu của Megaminx và Clock", () => {
    for (const [kind, scramble] of [
      ["minx", "R++ D-- U'"],
      ["clock", "UR3+ DR2- y2 ALL1+"],
    ] as const) {
      const url = buildShareUrl("https://x.test", { kind, scramble });
      expect(parseShareParams(new URL(url).search)).toEqual({ kind, scramble });
    }
  });

  it("đi vòng trạng thái 3×3", () => {
    const url = buildShareUrl("https://x.test", { kind: "bld", facelets: FACELETS });
    expect(parseShareParams(new URL(url).search)).toEqual({ kind: "bld", facelets: FACELETS });
  });

  it("từ chối khối lạ, ký tự lạ, scramble quá dài, trạng thái sai", () => {
    expect(parseShareParams("?k=nope&s=R")).toBeNull();
    expect(parseShareParams("?k=cfop&s=" + encodeURIComponent("R <script>"))).toBeNull();
    expect(parseShareParams("?k=cfop&s=" + "R ".repeat(300))).toBeNull();
    expect(parseShareParams("?k=cfop&f=UUU")).toBeNull();
    expect(parseShareParams("?k=222&f=" + FACELETS)).toBeNull();
    expect(parseShareParams("?k=cfop")).toBeNull();
    expect(parseShareParams("")).toBeNull();
  });
});
