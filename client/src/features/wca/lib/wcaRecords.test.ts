import { describe, expect, it } from "vitest";
import {
  decodeWcaMultiBlind,
  formatWcaCentiseconds,
  formatWcaMultiBlind,
  formatWcaMultiBlindTime,
  formatWcaRecordValue,
} from "@/features/wca/lib/wcaRecords";

describe("WCA world record formatting", () => {
  it("writes timed results the way the WCA does", () => {
    expect(formatWcaCentiseconds(39)).toBe("0.39");
    expect(formatWcaCentiseconds(251)).toBe("2.51");
    expect(formatWcaCentiseconds(1_156)).toBe("11.56");
    expect(formatWcaCentiseconds(8_747)).toBe("1:27.47");
    expect(formatWcaCentiseconds(14_763)).toBe("2:27.63");
    expect(formatWcaCentiseconds(360_000)).toBe("1:00:00.00");
  });

  it("counts moves for fewest moves and centi-moves for its average", () => {
    expect(formatWcaRecordValue("333fm", "single", 16)).toBe("16");
    expect(formatWcaRecordValue("333fm", "average", 1_900)).toBe("19.00");
  });

  it("unpacks a Multi-Blind attempt result", () => {
    expect(decodeWcaMultiBlind(380_350_302)).toEqual({ solved: 63, attempted: 65, timeSeconds: 3_503 });
    expect(formatWcaMultiBlind(380_350_302)).toBe("63/65 58:23");
    expect(formatWcaMultiBlindTime(59)).toBe("0:59");
    expect(formatWcaMultiBlindTime(3_723)).toBe("1:02:03");
  });

  it("keeps a missing record visible as a dash", () => {
    expect(formatWcaRecordValue("333", "single", null)).toBe("—");
    expect(formatWcaRecordValue("333mbf", "average", null)).toBe("—");
  });
});
