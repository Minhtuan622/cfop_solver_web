import { describe, expect, it } from "vitest";
import { alignPermFor, highlightedIndexes, indexFor, parseMove } from "./cubeGuideFacelets";

describe("cubeGuideFacelets", () => {
  it("mỗi sticker ngoài của khối 3×3 ứng với đúng một ô trong state 54 ký tự", () => {
    const seen = new Set<number>();
    const faces: [string, (a: number, b: number) => [number, number, number]][] = [
      ["U", (a, b) => [a, 1, b]],
      ["D", (a, b) => [a, -1, b]],
      ["F", (a, b) => [a, b, 1]],
      ["B", (a, b) => [a, b, -1]],
      ["R", (a, b) => [1, a, b]],
      ["L", (a, b) => [-1, a, b]],
    ];
    for (const [face, at] of faces)
      for (const a of [-1, 0, 1]) for (const b of [-1, 0, 1]) seen.add(indexFor(face, ...at(a, b)));
    expect(seen.size).toBe(54);
    expect(Math.min(...seen)).toBe(0);
    expect(Math.max(...seen)).toBe(53);
  });

  it("đọc lệnh xoay tầng, lớp giữa và xoay cả khối", () => {
    expect(parseMove("R")).toEqual({ axis: "x", layers: [1], angle: -Math.PI / 2 });
    expect(parseMove("R'")).toEqual({ axis: "x", layers: [1], angle: Math.PI / 2 });
    expect(parseMove("U2")).toEqual({ axis: "y", layers: [1], angle: -Math.PI });
    expect(parseMove("M")).toEqual({ axis: "x", layers: [0], angle: Math.PI / 2 });
    expect(parseMove("x")).toEqual({ axis: "x", layers: [-1, 0, 1], angle: -Math.PI / 2 });
    expect(parseMove("Rw")).toBeNull();
    expect(parseMove("Q")).toBeNull();
  });

  it("hoán vị căn Cross về D là một hoán vị hợp lệ; Cross trắng D không cần xoay", () => {
    expect(alignPermFor("D")).toBeNull();
    for (const color of ["U", "F", "B", "R", "L"]) {
      const perm = alignPermFor(color)!;
      expect([...perm].sort((a, b) => a - b)).toEqual(Array.from({ length: 54 }, (_, index) => index));
    }
  });

  it("tô sáng sticker của slot XCross, case Last Layer và sticker đặc biệt", () => {
    expect(highlightedIndexes(["FR"], null, undefined).size).toBe(5);
    expect(highlightedIndexes(undefined, { family: "zbll", id: "U-1" }, undefined).size).toBe(54);
    const special = highlightedIndexes(undefined, null, { U: [4] });
    expect([...special.entries()]).toEqual([["U:4", { color: "#fb7185", intensity: 0.7 }]]);
    // Khi đã căn Cross, khoá sticker đổi sang khung gốc nhưng số lượng giữ nguyên.
    expect(highlightedIndexes(["FR"], null, undefined, alignPermFor("U")).size).toBe(5);
  });
});
