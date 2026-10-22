import { describe, expect, it } from "vitest";
import { comparisonMessage, formatWcaTime, initials, rankSummary, wcaEventName } from "@/features/profile/lib/profilePresentation";
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

  it("keeps rank and Timer/WCA comparison messages", () => {
    expect(rankSummary({ world: 10, continental: null, country: 1234 }, "vi")).toBe("TG #10 · QG #1.234");
    expect(comparisonMessage(-500, t)).toBe("Timer nhanh hơn 00:00.50");
    expect(comparisonMessage(null, t)).toContain("cả hai nguồn");
  });
});
