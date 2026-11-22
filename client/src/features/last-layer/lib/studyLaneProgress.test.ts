import { beforeEach, describe, expect, it } from "vitest";
import { readLaneProgress, writeLaneProgress } from "./studyLaneProgress";

describe("studyLaneProgress", () => {
  beforeEach(() => localStorage.clear());

  it("lưu tiến độ từng chủ đề và đọc lại được", () => {
    writeLaneProgress("cfop", { mastered: 3, total: 624 });
    writeLaneProgress("lastLayer", { mastered: 10, total: 1682 });
    expect(readLaneProgress()).toEqual({
      cfop: { mastered: 3, total: 624 },
      lastLayer: { mastered: 10, total: 1682 },
    });
  });

  it("bỏ qua khi danh mục chưa tải xong (tổng = 0)", () => {
    writeLaneProgress("cfop", { mastered: 3, total: 624 });
    writeLaneProgress("cfop", { mastered: 0, total: 0 });
    expect(readLaneProgress().cfop).toEqual({ mastered: 3, total: 624 });
  });

  it("bỏ qua dữ liệu hỏng trong bộ nhớ", () => {
    localStorage.setItem(
      "cfop-study-lane-progress-v1",
      JSON.stringify({ cfop: { mastered: "x" }, skewb: { mastered: 1, total: 2 } })
    );
    expect(readLaneProgress()).toEqual({ skewb: { mastered: 1, total: 2 } });
  });
});
