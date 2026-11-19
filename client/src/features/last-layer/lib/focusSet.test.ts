// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { clearFocusSet, readFocusSet, toggleFocusGroup, writeFocusSet } from "./focusSet";

describe("focus set (bộ tập trung)", () => {
  beforeEach(() => window.localStorage.clear());

  it("mặc định là rỗng (tất cả nhóm)", () => {
    expect(readFocusSet("cfop")).toEqual([]);
  });

  it("toggle thêm và bỏ nhóm khỏi focus set của từng lane", () => {
    expect(toggleFocusGroup("cfop", "OLL 27")).toEqual(["OLL 27"]);
    expect(toggleFocusGroup("cfop", "PLL R")).toEqual(["OLL 27", "PLL R"]);
    expect(toggleFocusGroup("cfop", "OLL 27")).toEqual(["PLL R"]);
    expect(readFocusSet("cfop")).toEqual(["PLL R"]);
    expect(readFocusSet("lastLayer")).toEqual([]);
  });

  it("xóa sạch focus set và bỏ giá trị lạ", () => {
    writeFocusSet("parity", ["OPP Parity", 42 as unknown as string, ""]);
    expect(readFocusSet("parity")).toEqual(["OPP Parity"]);
    clearFocusSet("parity");
    expect(readFocusSet("parity")).toEqual([]);
  });
});
