import { describe, expect, it } from "vitest";
import { errorMessage, translateServerText } from "@/lib/apiError";
import { translate } from "@/lib/i18n";

const vi = (key: string, params?: Record<string, string | number>) => translate("vi", key, params);
const en = (key: string, params?: Record<string, string | number>) => translate("en", key, params);

/** A tRPC failure, shaped the way the client receives it. */
function failure(message: string, data?: { code?: string; httpStatus?: number }) {
  return Object.assign(new Error(message), { data });
}

describe("translateServerText", () => {
  it("speaks the language of the interface", () => {
    expect(translateServerText("Email này đã có tài khoản CFOP.", vi)).toBe(
      "Email này đã có tài khoản CFOP.",
    );
    expect(translateServerText("Email này đã có tài khoản CFOP.", en)).toBe(
      "This email already has a CFOP account.",
    );
  });

  it("keeps the text a person wrote after a known sentence", () => {
    expect(
      translateServerText("Bạn đã bị quản trị viên loại khỏi phòng. Lý do: spam", en),
    ).toBe("A moderator removed you from the room. Reason: spam");
  });

  it("does not pretend to know a sentence the server never sends", () => {
    expect(translateServerText("Mạng bị ngắt.", vi)).toBeNull();
  });
});

describe("errorMessage", () => {
  it("hides the internals of a server failure", () => {
    const broken = failure("Failed query: select `id` from `cfop_accounts`", { httpStatus: 500 });
    expect(errorMessage(broken, vi)).toBe(
      "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.",
    );
    expect(errorMessage(broken, en)).toBe("The server hit a problem. Please try again in a moment.");
  });

  it("translates a sentence the server sent", () => {
    const taken = failure("Email này đã có tài khoản CFOP.", { code: "CONFLICT", httpStatus: 409 });
    expect(errorMessage(taken, en)).toBe("This email already has a CFOP account.");
  });

  it("reads the wording of a validation failure instead of the raw payload", () => {
    const payload = JSON.stringify([
      { origin: "string", code: "too_small", minimum: 10, path: ["password"], message: "Mật khẩu cần ít nhất 10 ký tự." },
    ]);
    expect(errorMessage(failure(payload, { httpStatus: 400 }), en)).toBe(
      "The password needs at least 10 characters.",
    );
  });

  it("prefers the wording of a known error code", () => {
    const invalid = failure("Email không hợp lệ.", { code: "BAD_REQUEST", httpStatus: 400 });
    expect(errorMessage(invalid, vi, { BAD_REQUEST: "account.error.invalidInput" })).toBe(
      "Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
    );
  });

  it("falls back to the generic wording for anything it does not know", () => {
    expect(errorMessage(failure("Mạng bị ngắt."), vi)).toBe("Không thể hoàn tất. Hãy thử lại.");
    expect(errorMessage("not an error", vi)).toBe("Không thể hoàn tất. Hãy thử lại.");
  });
});
