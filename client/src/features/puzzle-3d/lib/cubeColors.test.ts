import { describe, expect, it } from "vitest";
import { CUBE_COLORS } from "./cubeColors";
import { CUBE_COLOR } from "@/components/common/CubeNet";

describe("cubeColors", () => {
  it("giữ sáu màu sticker và giá trị mặc định khi gặp mặt lạ", () => {
    expect(Object.keys(CUBE_COLORS).sort()).toEqual(["B", "D", "F", "L", "R", "U"]);
    expect(CUBE_COLORS.F).toBe("#1ba77a");
    expect(CUBE_COLORS["X"]).toBeUndefined();
  });

  it("là nguồn duy nhất cho cube net", () => {
    expect(CUBE_COLOR).toBe(CUBE_COLORS);
  });
});
