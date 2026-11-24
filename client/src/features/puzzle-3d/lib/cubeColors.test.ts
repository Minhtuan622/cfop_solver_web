import { describe, expect, it } from "vitest";
import { CUBE_COLORS } from "./cubeColors";
import { CUBE_COLOR } from "@/components/common/CubeNet";

describe("cubeColors", () => {
  it("giữ sáu màu sticker và giá trị mặc định khi gặp mặt lạ", () => {
    expect(Object.keys(CUBE_COLORS).sort()).toEqual(["B", "D", "F", "L", "R", "U"]);
    expect(CUBE_COLORS.F).toBe("#009b48");
    expect(CUBE_COLORS["X"]).toBeUndefined();
  });

  it("hiển thị như khi giải thật: U vàng, D trắng, L đỏ, R cam", () => {
    expect(CUBE_COLORS.U).toBe("#ffd500");
    expect(CUBE_COLORS.D).toBe("#f2f2f2");
    expect(CUBE_COLORS.L).toBe("#b71234");
    expect(CUBE_COLORS.R).toBe("#ff5800");
    expect(CUBE_COLORS.B).toBe("#0046ad");
  });

  it("là nguồn duy nhất cho cube net", () => {
    expect(CUBE_COLOR).toBe(CUBE_COLORS);
  });
});
