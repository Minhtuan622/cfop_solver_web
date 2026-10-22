import { describe, expect, it } from "vitest";
import { comparisonMessage, errorMessage, formatWcaTime, initials, rankSummary, wcaEventName } from "@/features/profile/lib/profilePresentation";
import { translate } from "@/lib/i18n";

const t = (key: string, params?: Record<string, string | number>) => translate("vi", key, params);

describe("profilePresentation", () => {
  it("formats stable account and WCA labels", () => {
    expect(initials("Nguyễn Văn A")).toBe("NV");
    expect(initials("  ")).toBe("CF");
    expect(formatWcaTime(1_234)).toBe("00:12.33");
    expect(wcaEventName("333bf", "vi")).toBe("3×3 bịt mắt");
    expect(wcaEventName("333bf", "en")).toBe("3×3 blindfolded");
    expect(wcaEventName("fto", "vi")).toBe("FTO");
  });

  it("never shows the internals of a server failure to the visitor", () => {
    const serverError = Object.assign(new Error("Failed query: select `id` from `cfop_accounts`"), {
      data: { httpStatus: 500 },
    });
    expect(errorMessage(serverError, t)).toBe("Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.");

    const rejected = Object.assign(new Error("Email này đã có tài khoản CFOP."), {
      data: { httpStatus: 400 },
    });
    expect(errorMessage(rejected, t)).toBe("Email này đã có tài khoản CFOP.");

    expect(errorMessage(new Error("Mạng bị ngắt."), t)).toBe("Không thể hoàn tất. Hãy thử lại.");
    expect(errorMessage("not an error", t)).toBe("Không thể hoàn tất. Hãy thử lại.");
  });

  it("translates a known error code into the wording of the current language", () => {
    const taken = Object.assign(new Error("Email này đã có tài khoản CFOP."), {
      data: { code: "CONFLICT", httpStatus: 409 },
    });
    expect(errorMessage(taken, t, { CONFLICT: "account.error.emailTaken" })).toBe(
      "Email này đã có tài khoản CFOP.",
    );
    expect(
      errorMessage(taken, (key, params) => translate("en", key, params), {
        CONFLICT: "account.error.emailTaken",
      }),
    ).toBe("This email already has a CFOP account.");

    const unknown = Object.assign(new Error("Email hoặc mật khẩu không đúng."), {
      data: { code: "UNAUTHORIZED", httpStatus: 401 },
    });
    expect(errorMessage(unknown, t, { CONFLICT: "account.error.emailTaken" })).toBe(
      "Email hoặc mật khẩu không đúng.",
    );
  });

  it("đọc câu chữ của lỗi kiểm tra dữ liệu thay vì để lộ JSON", () => {
    const payload = JSON.stringify([
      { origin: "string", code: "too_small", minimum: 10, path: ["password"], message: "Mật khẩu cần ít nhất 10 ký tự." },
    ]);
    expect(errorMessage(new Error(payload), t)).toBe("Mật khẩu cần ít nhất 10 ký tự.");
  });

  it("dùng câu chữ dịch khi nơi gọi biết mã lỗi", () => {
    const invalid = Object.assign(new Error("Email không hợp lệ."), {
      data: { code: "BAD_REQUEST", httpStatus: 400 },
    });
    expect(errorMessage(invalid, t, { BAD_REQUEST: "account.error.invalidInput" })).toBe(
      "Thông tin bạn nhập chưa hợp lệ. Vui lòng kiểm tra lại.",
    );
  });

  it("keeps rank and Timer/WCA comparison messages", () => {
    expect(rankSummary({ world: 10, continental: null, country: 1234 }, "vi")).toBe("TG #10 · QG #1.234");
    expect(comparisonMessage(-500, t)).toBe("Timer nhanh hơn 00:00.50");
    expect(comparisonMessage(null, t)).toContain("cả hai nguồn");
  });
});
