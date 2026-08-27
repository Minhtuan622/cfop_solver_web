import { describe, expect, it } from "vitest";
import { csvCell } from "./browserDownload";

describe("browserDownload", () => {
  it("escapes CSV values without altering ordinary values", () => {
    expect(csvCell("R U R' U'")).toBe('"R U R\' U\'"');
    expect(csvCell('note "quoted"')).toBe('"note ""quoted"""');
    expect(csvCell(1_234)).toBe('"1234"');
  });
});
