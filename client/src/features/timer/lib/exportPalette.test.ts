import { describe, expect, it } from "vitest";
import { exportPalette } from "./exportPalette";

describe("exportPalette", () => {
  it("đọc token của trang tính xuất và có giá trị dự phòng", () => {
    const palette = exportPalette();

    expect(palette.paper).toBeTruthy();
    expect(palette.ink).toBeTruthy();
    expect(palette.accent).toBeTruthy();
    expect(palette.worst).toBeTruthy();
    expect(palette.grid).toContain("rgba");
  });
});
