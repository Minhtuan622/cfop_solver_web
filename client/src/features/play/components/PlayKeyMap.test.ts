import { describe, expect, it } from "vitest";
import { buildPlayKeyGroups } from "./PlayKeyMap";

const keysFor = (rows: { move: string; keys: string[] }[], move: string) =>
  rows.find(row => row.move === move)?.keys ?? [];

describe("buildPlayKeyGroups", () => {
  const groups = buildPlayKeyGroups();

  it("khớp bộ phím mặt của csTimer", () => {
    expect(keysFor(groups.faces, "R")).toEqual(["i"]);
    expect(keysFor(groups.faces, "R'")).toEqual(["k"]);
    expect(keysFor(groups.faces, "U")).toEqual(["j"]);
    expect(keysFor(groups.faces, "U'")).toEqual(["f"]);
    expect(groups.faces).toHaveLength(12);
  });

  it("tách nhóm rộng, slice và xoay cả khối", () => {
    expect(groups.wide.every(row => /^[a-z]/.test(row.move))).toBe(true);
    expect(groups.slice.every(row => /^[MES]/.test(row.move))).toBe(true);
    expect(groups.rotate.map(row => row.move).sort()).toEqual(
      ["x", "x'", "y", "y'", "z", "z'"].sort()
    );
  });

  it("mỗi phím chỉ xuất hiện một lần", () => {
    const all = Object.values(groups).flatMap(rows => rows.flatMap(row => row.keys));
    expect(new Set(all).size).toBe(all.length);
  });
});
