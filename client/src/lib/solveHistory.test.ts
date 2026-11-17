import { beforeEach, describe, expect, it } from "vitest";
import {
  addSolveHistory,
  exportSolveHistory,
  importSolveHistory,
  readSolveHistory,
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
      JSON.stringify(["nope", 42, null, {}, { elapsedMs: "5" }]),
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
        { phase: "F2L", markedAtMs: 5_000, elapsedMs: 5_000 }, // out of order -> dropped
        { phase: "ZZZ", markedAtMs: 20_000, elapsedMs: 20_000 }, // unknown -> dropped
        { phase: "F2L", markedAtMs: 20_000, elapsedMs: 20_000 },
        { phase: "OLL", markedAtMs: 20_000, elapsedMs: 22_000 },
        { phase: "PLL", markedAtMs: 30_000, elapsedMs: 32_000 },
        { phase: "PLL", markedAtMs: 35_000, elapsedMs: 35_000 }, // duplicate phase -> dropped
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
});
