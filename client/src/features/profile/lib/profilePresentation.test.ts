import { describe, expect, it } from "vitest";
import { comparisonMessage, formatWcaTime, initials, rankSummary, wcaEventName } from "@/features/profile/lib/profilePresentation";

describe("profilePresentation", () => {
  it("formats stable account and WCA labels", () => {
    expect(initials("Nguyễn Văn A")).toBe("NV");
    expect(initials("  ")).toBe("CF");
    expect(formatWcaTime(1_234)).toBe("00:12.33");
    expect(wcaEventName("333bf")).toBe("3×3 bịt mắt");
    expect(wcaEventName("fto")).toBe("FTO");
  });

  it("keeps rank and Timer/WCA comparison messages", () => {
    expect(rankSummary({ world: 10, continental: null, country: 1234 })).toBe("TG #10 · QG #1.234");
    expect(comparisonMessage(-500)).toBe("Timer nhanh hơn 00:00.50");
    expect(comparisonMessage(null)).toContain("cả hai nguồn");
  });
});
