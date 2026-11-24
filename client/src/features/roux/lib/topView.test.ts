import { describe, expect, it } from "vitest";
import { topViewCells } from "./topView";

const SOLVED = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";

describe("topViewCells", () => {
  it("trả rỗng với chuỗi sai độ dài", () => {
    expect(topViewCells("U")).toEqual([]);
  });

  it("khối đã giải: mặt U toàn U và mỗi cạnh mang màu mặt bên tương ứng", () => {
    const cells = topViewCells(SOLVED);
    expect(cells).toHaveLength(9 + 12);
    expect(cells.filter(cell => !cell.side).every(cell => cell.letter === "U")).toBe(true);
    const at = (x: number, y: number) => cells.find(cell => cell.x === x && cell.y === y)?.letter;
    expect(at(2, 0)).toBe("B");
    expect(at(2, 4)).toBe("F");
    expect(at(0, 2)).toBe("L");
    expect(at(4, 2)).toBe("R");
  });

  it("đặt đúng ô: sticker U ở hàng 0 cột 0 nằm ở lưới (1,1)", () => {
    const state = [...SOLVED];
    state[0] = "F";
    expect(topViewCells(state.join("")).find(cell => cell.x === 1 && cell.y === 1)?.letter).toBe("F");
  });
});
