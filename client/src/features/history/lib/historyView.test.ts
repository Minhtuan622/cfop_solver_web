import { describe, expect, it } from "vitest";
import type { SolveHistoryEntry } from "@/lib/solveHistory";
import {
  average,
  filterHistory,
  historyCsv,
  historyTags,
  historyTrend,
  validTimes,
} from "./historyView";

const solve = (id: string, elapsedMs: number, extra: Partial<SolveHistoryEntry> = {}): SolveHistoryEntry => ({
  id,
  createdAt: 1_700_000_000_000,
  eventId: "333",
  input: `R U ${id}`,
  inputKind: "scramble",
  elapsedMs,
  inspectionMs: 0,
  penalty: "none",
  solution: "",
  moves: 0,
  note: "",
  tags: [],
  ...extra,
});

describe("historyView", () => {
  it("lọc theo loại khối, tag và từ khoá (không phân biệt hoa thường)", () => {
    const entries = [
      solve("a", 10_000, { tags: ["oh"], note: "Sub-10" }),
      solve("b", 12_000, { eventId: "fto", tags: ["oh"] }),
      solve("c", 14_000),
    ];
    const ids = (list: SolveHistoryEntry[]) => list.map(item => item.id);
    expect(ids(filterHistory(entries, { query: "", tag: "all", eventFilter: "all" }))).toEqual(["a", "b", "c"]);
    expect(ids(filterHistory(entries, { query: "", tag: "all", eventFilter: "fto" }))).toEqual(["b"]);
    expect(ids(filterHistory(entries, { query: "", tag: "oh", eventFilter: "all" }))).toEqual(["a", "b"]);
    expect(ids(filterHistory(entries, { query: "  SUB-10 ", tag: "all", eventFilter: "all" }))).toEqual(["a"]);
    expect(historyTags([solve("x", 1, { tags: ["b", "a"] }), solve("y", 1, { tags: ["a"] })])).toEqual(["a", "b"]);
  });

  it("bỏ DNF khỏi thời gian hợp lệ và tính trung bình", () => {
    const valid = validTimes([solve("a", 10_000), solve("b", 9_000, { penalty: "DNF" }), solve("c", 12_000, { penalty: "+2" })]);
    expect(valid).toEqual([10_000, 14_000]);
    expect(average(valid)).toBe(12_000);
    expect(average([])).toBe(0);
  });

  it("vẽ tối đa 30 lượt theo thứ tự thời gian, ao5 từ lượt thứ năm, DNF đứt đường", () => {
    // Mới nhất trước: s0 = 40 s, s1 = 39 s… Theo thứ tự thời gian, 30 lượt cuối là 11 s → 40 s.
    const entries = Array.from({ length: 40 }, (_, index) => solve(`s${index}`, (40 - index) * 1000));
    const chart = historyTrend(entries);
    expect(chart).toHaveLength(30);
    expect(chart[0]).toMatchObject({ solve: 1, seconds: 11, ao5: 9 });
    expect(chart[29]).toMatchObject({ solve: 30, seconds: 40, ao5: 38 });

    const short = historyTrend([solve("b", 2_000, { penalty: "DNF" }), solve("a", 1_000)]);
    expect(short).toEqual([
      { solve: 1, seconds: 1, ao5: null },
      { solve: 2, seconds: null, ao5: null },
    ]);
  });

  it("giữ nguyên cột và định dạng file CSV", () => {
    const csv = historyCsv([solve("a", 12_340, { tags: ["x", "y"], note: 'nói "hay"', multiBlindScrambles: ["R", "U"] })]);
    const [header, row] = csv.split(/\n(?=")/);
    expect(header).toBe('"timestamp","event","base_time_ms","inspection_ms","penalty","result","scramble","mbl_scrambles","solution","note","tags"');
    expect(row).toContain('"2023-11-14T22:13:20.000Z","333","12340","0","none"');
    expect(row).toContain('"R\nU"');
    expect(row).toContain('"nói ""hay"""');
    expect(row.endsWith('"x|y"')).toBe(true);
  });
});
