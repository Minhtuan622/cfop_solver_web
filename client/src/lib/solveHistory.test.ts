import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteSolveHistory,
  deleteSolveHistoryMany,
  addSolveHistory,
  formatSolveTime,
  exportSolveHistory,
  importSolveHistory,
  readSolveHistory,
  updateSolveHistory,
} from "./solveHistory";

const KEY = "cfop-solve-history-v1";
const solvedScramble = "R U R' U'";

beforeEach(() => {
  window.localStorage.clear();
});

const validEntry = (overrides: Record<string, unknown> = {}) => ({
  id: "entry-1",
  createdAt: 1_700_000_000_000,
  elapsedMs: 12_340,
  inspectionMs: 1_000,
  input: solvedScramble,
  inputKind: "scramble",
  moves: 20,
  penalty: "none",
  solution: "F' U R",
  note: "a note",
  tags: ["one"],
  phaseSplits: [],
  eventId: "333",
  ...overrides,
});

describe("solveHistory: normalization on read", () => {
  it("keeps garbage entries as valid fallback entries instead of crashing", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify(["nope", 42, null, [], {}, { elapsedMs: "5" }]),
    );
    const entries = readSolveHistory();
    expect(entries).toHaveLength(2);
    for (const entry of entries) {
      expect(entry.id).toBeTruthy();
      expect(entry.createdAt).toBeGreaterThan(0);
      expect(entry.elapsedMs).toBe(0);
      expect(entry.penalty).toBe("none");
    }
  });

  it("an array-valued entry is skipped instead of throwing", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([validEntry(), [1, 2, 3]]),
    );
    const entries = readSolveHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("entry-1");
  });

  it("keeps a valid id and replaces an empty one", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([validEntry(), validEntry({ id: "" })]),
    );
    const entries = readSolveHistory();
    expect(entries.map(entry => entry.id)).toEqual(["entry-1", expect.any(String)]);
    expect(entries[1].id).not.toBe("");
  });

  it("only keeps +2 and DNF as penalties, everything else becomes none", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        validEntry({ penalty: "+2" }),
        validEntry({ penalty: "DNF" }),
        validEntry({ penalty: "dnf" }),
        validEntry({ penalty: "???" }),
      ]),
    );
    expect(readSolveHistory().map(entry => entry.penalty)).toEqual([
      "+2",
      "DNF",
      "none",
      "none",
    ]);
  });

  it("trims and dedupes tags, caps the list at 12", () => {
    const tags = [" a ", "a", "b", "", 5, null, ...Array.from({ length: 15 }, (_, i) => `tag${i}`)];
    window.localStorage.setItem(KEY, JSON.stringify([validEntry({ tags })]));
    const [entry] = readSolveHistory();
    expect(entry.tags[0]).toBe("a");
    expect(entry.tags.filter(tag => tag === "a")).toHaveLength(1);
    expect(entry.tags.length).toBeLessThanOrEqual(12);
  });

  it("truncates notes to 500 characters", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([validEntry({ note: "x".repeat(600) })]),
    );
    expect(readSolveHistory()[0].note).toHaveLength(500);
  });

  it("normalises phase splits: monotonic, one per phase, only known phases", () => {
    const entry = validEntry({
      phaseSplits: [
        { phase: "Cross", markedAtMs: 10_000, elapsedMs: 10_000 },
        { phase: "F2L", markedAtMs: 5_000, elapsedMs: 5_000 },
        { phase: "ZZZ", markedAtMs: 20_000, elapsedMs: 20_000 },
        { phase: "F2L", markedAtMs: 20_000, elapsedMs: 20_000 },
        { phase: "OLL", markedAtMs: 20_000, elapsedMs: 22_000 },
        { phase: "PLL", markedAtMs: 30_000, elapsedMs: 32_000 },
        { phase: "PLL", markedAtMs: 35_000, elapsedMs: 35_000 },
      ],
    });
    window.localStorage.setItem(KEY, JSON.stringify([entry]));
    const splits = readSolveHistory()[0].phaseSplits;
    expect(splits.map(split => split.phase)).toEqual(["Cross", "F2L", "OLL", "PLL"]);
    expect(splits.map(split => split.markedAtMs)).toEqual([10_000, 20_000, 20_000, 30_000]);
  });

  it("keeps a valid multiBlind result and drops an inconsistent one", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        validEntry({ multiBlind: { attempted: 3, solved: 2 }, multiBlindScrambles: ["a b c"] }),
        validEntry({ multiBlind: { attempted: 1, solved: 1 } }),
        validEntry({ multiBlind: { attempted: 3, solved: 4 } }),
      ]),
    );
    const entries = readSolveHistory();
    expect(entries[0].multiBlind).toEqual({ attempted: 3, solved: 2 });
    expect(entries[0].multiBlindScrambles).toEqual(["a b c"]);
    expect(entries[1].multiBlind).toBeUndefined();
    expect(entries[2].multiBlind).toBeUndefined();
  });

  it("keeps valid event ids and maps everything else to 333", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([
        validEntry({ eventId: "sq1" }),
        validEntry({ eventId: "nonsense" }),
        validEntry({ eventId: undefined }),
      ]),
    );
    expect(readSolveHistory().map(entry => entry.eventId)).toEqual([
      "sq1",
      "333",
      "333",
    ]);
  });

  it("drops tombstoned entries from reads", () => {
    const live = validEntry({ id: "live" });
    const deleted = validEntry({ id: "deleted", deletedAt: 1_700_000_000_000 });
    window.localStorage.setItem(KEY, JSON.stringify([live, deleted]));
    const entries = readSolveHistory();
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("live");
  });

  it("xoá trả về danh sách còn lại (không kèm lượt vừa xoá) và vẫn ghi tombstone", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify([validEntry({ id: "a" }), validEntry({ id: "b" }), validEntry({ id: "c" }), validEntry({ id: "d" })]),
    );
    const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as { id: string; deletedAt?: number }[];

    expect(deleteSolveHistory("b").map(entry => entry.id)).toEqual(["a", "c", "d"]);
    expect(stored().find(entry => entry.id === "b")?.deletedAt).toBeGreaterThan(0);

    expect(deleteSolveHistoryMany(["a", "d"]).map(entry => entry.id)).toEqual(["c"]);
    expect(stored().filter(entry => entry.deletedAt).map(entry => entry.id)).toEqual(expect.arrayContaining(["a", "d"]));
    expect(readSolveHistory().map(entry => entry.id)).toEqual(["c"]);
  });

  it("giữ tombstone qua các lần ghi sau và giới hạn số tombstone", () => {
    window.localStorage.setItem(KEY, JSON.stringify([validEntry({ id: "a" }), validEntry({ id: "b" })]));
    const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as { id: string; deletedAt?: number }[];
    deleteSolveHistory("b");
    addSolveHistory({ eventId: "333", input: "R U", inputKind: "scramble", elapsedMs: 9000, inspectionMs: 0, moves: 0 });
    deleteSolveHistory("a");
    expect(stored().filter(entry => entry.deletedAt).map(entry => entry.id).sort()).toEqual(["a", "b"]);
    expect(readSolveHistory()).toHaveLength(1);

    const many = Array.from({ length: 130 }, (_, index) => validEntry({ id: `t${index}`, deletedAt: 1_700_000_000_000 + index }));
    window.localStorage.setItem(KEY, JSON.stringify([validEntry({ id: "live" }), ...many]));
    deleteSolveHistory("live");
    const tombstones = stored().filter(entry => entry.deletedAt);
    expect(tombstones).toHaveLength(100);
    expect(tombstones[0].id).toBe("live");
  });
});

describe("solveHistory: formatSolveTime", () => {
  it("cắt tới phần trăm giây, không lệch do sai số dấu phẩy động", () => {
    expect(formatSolveTime(9_870)).toBe("00:09.87");
    expect(formatSolveTime(12_340)).toBe("00:12.34");
    expect(formatSolveTime(12_349)).toBe("00:12.34");
    expect(formatSolveTime(1_204.199999)).toBe("00:01.20");
    expect(formatSolveTime(0)).toBe("00:00.00");
    expect(formatSolveTime(61_005)).toBe("01:01.00");
    expect(formatSolveTime(3_600_000)).toBe("60:00.00");
  });
});

describe("solveHistory: import/export", () => {
  it("rejects a backup that is not a list of entries", () => {
    expect(() => importSolveHistory({ foo: "bar" })).toThrow("Invalid backup");
    expect(() => importSolveHistory(null)).toThrow("Invalid backup");
  });

  it("accepts a bare list of entries or an envelope with an entries array", () => {
    const raw = [validEntry({ id: "one" }), validEntry({ id: "two" })];
    expect(importSolveHistory(raw).map(entry => entry.id)).toEqual(["one", "two"]);
    expect(importSolveHistory({ entries: raw }).map(entry => entry.id)).toEqual([
      "one",
      "two",
    ]);
  });

  it("exports only live entries (tombstones are not part of backups)", () => {
    const live = validEntry({ id: "live" });
    const deleted = validEntry({ id: "deleted", deletedAt: 1_700_000_000_000 });
    importSolveHistory([live, deleted]);
    const exported = exportSolveHistory();
    expect(exported.schema).toBe("cfop-solver-timer-history");
    expect(exported.entries.map(entry => entry.id)).toEqual(["live"]);
    expect(readSolveHistory().map(entry => entry.id)).toEqual(["live"]);
  });

  it("keeps the newest entry first and caps the history at 500", () => {
    const raw = Array.from({ length: 600 }, (_, index) =>
      validEntry({
        id: `entry-${index}`,
        createdAt: 1_700_000_000_000 + index * 1_000,
      }),
    );
    const imported = importSolveHistory(raw);
    expect(imported.length).toBeLessThanOrEqual(500);
    expect(readSolveHistory()[0].id).toBe("entry-599");
  });

  it("addSolveHistory stores a normalized entry and reads it back", () => {
    const entry = addSolveHistory({
      elapsedMs: 10_000,
      inspectionMs: 500,
      input: solvedScramble,
      inputKind: "scramble",
      moves: 12,
    });
    expect(entry.penalty).toBe("none");
    expect(readSolveHistory()[0].id).toBe(entry.id);
  });

  it("addSolveHistory round-trips the bluetooth source and legacy entries stay undefined", () => {
    const fromMat = addSolveHistory({
      elapsedMs: 10_500,
      inspectionMs: 0,
      input: solvedScramble,
      inputKind: "scramble",
      moves: 14,
      source: "bluetooth",
    });
    expect(fromMat.source).toBe("bluetooth");
    expect(readSolveHistory()[0]?.source).toBe("bluetooth");

    const fromCube = addSolveHistory({
      elapsedMs: 9_900,
      inspectionMs: 0,
      input: solvedScramble,
      inputKind: "scramble",
      moves: 16,
      source: "smartcube",
    });
    expect(fromCube.source).toBe("smartcube");
    expect(readSolveHistory()[0]?.source).toBe("smartcube");

    const imported = importSolveHistory([validEntry()]);
    expect(imported[0]?.source).toBeUndefined();
  });

  it("importSolveHistory keeps an unknown source out instead of storing it", () => {
    const imported = importSolveHistory([
      validEntry({ source: "telepathy" }),
    ]);
    expect(imported[0]?.source).toBeUndefined();
  });

  it("giữ thời điểm từng nước của solve smart cube và bỏ khi không khớp lời giải", () => {
    const saved = addSolveHistory({
      elapsedMs: 4_000,
      inspectionMs: 0,
      input: solvedScramble,
      inputKind: "scramble",
      moves: 3,
      source: "smartcube",
      solution: "R U R'",
      moveTimes: [0, 180, 420.4],
    });
    expect(saved.moveTimes).toEqual([0, 180, 420]);
    expect(readSolveHistory()[0]?.moveTimes).toEqual([0, 180, 420]);

    const [edited] = updateSolveHistory(saved.id, { solution: "R U" });
    expect(edited.moveTimes).toBeUndefined();
  });

  it("từ chối nhịp không hợp lệ (giảm dần, âm, không phải số, quá dài)", () => {
    const bad = [
      [0, 200, 100],
      [0, -5, 10],
      [0, "x", 10],
      Array.from({ length: 401 }, (_, index) => index),
    ];
    for (const moveTimes of bad) {
      const [entry] = importSolveHistory([
        validEntry({ solution: "R U R'", moveTimes }),
      ]);
      expect(entry?.moveTimes).toBeUndefined();
    }
  });
});
