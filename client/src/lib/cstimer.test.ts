// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  addSolveHistory,
  importCstimerSolveHistory,
  exportCstimerSolveHistory,
  readSolveHistory,
} from "./solveHistory";
import { parseCstimerExport, buildCstimerExport } from "./cstimer";

const KEY = "cfop-solve-history-v1";

beforeEach(() => {
  window.localStorage.clear();
});

const cstimerFile = () => ({
  session1: [
    [[0, 10_000], "R U R' U'", "", 1_700_000_000],
    [[2000, 11_000], "F R U R' U'", "nice try", 1_700_000_100],
    [[-1, 12_000], "U R U'", "dnf one", 1_700_000_200],
  ],
  session2: [
    [[0, 30_000], "2R2 U2 2R2 Uw2", "parity practice", 1_700_000_300],
  ],
  properties: {
    sessionData: JSON.stringify({
      "1": { name: "222 practice", opt: {}, rank: 1, date: [1_700_000_000, 1_700_000_200], stat: [3, 1, 11_500] },
      "2": { name: "4×4 WCA", opt: { scrType: "444wca" }, rank: 2, date: [1_700_000_300, 1_700_000_300], stat: [1, 0, 30_000] },
    }),
    sessionN: 2,
    session: 1,
  },
});

const cstimerFileAllRegisteredIds = () => ({
  session1: [
    [[0, 10_000], "R U R' U'", "", 1_700_000_000],
  ],
  session2: [
    [[0, 20_000], "Rw2 Uw2 Rw2", "", 1_700_000_100],
  ],
  session3: [
    [[0, 15_000], "F R U R' U'", "", 1_700_000_200],
  ],
  session4: [
    [[0, 25_000], "R U R'", "", 1_700_000_300],
  ],
  session5: [
    [[0, 45_000], "R2 U2 R2 U2", "", 1_700_000_400],
  ],
  session6: [
    [[0, 55_000], "R2 U2 R2 U2", "", 1_700_000_500],
  ],
  session7: [
    [[0, 8_000], "R U R'", "", 1_700_000_600],
  ],
  session8: [
    [[0, 9_000], "R U R'", "", 1_700_000_700],
  ],
  session9: [
    [[0, 35_000], "2R2 U2 2R2", "", 1_700_000_800],
  ],
  session10: [
    [[0, 40_000], "Rw2 Uw2 Rw2", "", 1_700_000_900],
  ],
  session11: [
    [[0, 30_000], "M' U2 M'", "", 1_700_001_000],
  ],
  session12: [
    [[0, 12_000], "s' r U2 r'", "", 1_700_001_100],
  ],
  session13: [
    [[0, 14_000], "L' U L U'", "", 1_700_001_200],
  ],
  session14: [
    [[0, 16_000], "F U' R U F", "", 1_700_001_300],
  ],
  session15: [
    [[0, 25_000], "(1, 0)/(0, 1)", "", 1_700_001_400],
  ],
  session16: [
    [[0, 25_000], "R U' R", "", 1_700_001_500],
  ],
  session17: [
    [[0, 65_000], "r' U2 r", "", 1_700_001_600],
  ],
  session18: [
    [[0, 95_000], "R2 U2 R2 U2", "", 1_700_001_700],
  ],
  properties: {
    sessionData: JSON.stringify({
      "1": { name: "a", opt: {}, rank: 1, date: [1_700_000_000, 1_700_000_000], stat: [1, 0, 10_000] },
      "2": { name: "b", opt: { scrType: "222so" }, rank: 2, date: [1_700_000_100, 1_700_000_100], stat: [1, 0, 20_000] },
      "3": { name: "c", opt: { scrType: "333ni" }, rank: 3, date: [1_700_000_200, 1_700_000_200], stat: [1, 0, 15_000] },
      "4": { name: "d", opt: { scrType: "333oh" }, rank: 4, date: [1_700_000_300, 1_700_000_300], stat: [1, 0, 25_000] },
      "5": { name: "e", opt: { scrType: "444wca" }, rank: 5, date: [1_700_000_400, 1_700_000_400], stat: [1, 0, 45_000] },
      "6": { name: "f", opt: { scrType: "555wca" }, rank: 6, date: [1_700_000_500, 1_700_000_500], stat: [1, 0, 55_000] },
      "7": { name: "g", opt: { scrType: "666wca" }, rank: 7, date: [1_700_000_600, 1_700_000_600], stat: [1, 0, 8_000] },
      "8": { name: "h", opt: { scrType: "777wca" }, rank: 8, date: [1_700_000_700, 1_700_000_700], stat: [1, 0, 9_000] },
      "9": { name: "i", opt: { scrType: "444bld" }, rank: 9, date: [1_700_000_800, 1_700_000_800], stat: [1, 0, 35_000] },
      "10": { name: "j", opt: { scrType: "555bld" }, rank: 10, date: [1_700_000_900, 1_700_000_900], stat: [1, 0, 40_000] },
      "11": { name: "k", opt: { scrType: "333fm" }, rank: 11, date: [1_700_001_000, 1_700_001_000], stat: [1, 0, 30_000] },
      "12": { name: "l", opt: { scrType: "r3ni" }, rank: 12, date: [1_700_001_100, 1_700_001_100], stat: [1, 0, 12_000] },
      "13": { name: "m", opt: { scrType: "pyrso" }, rank: 13, date: [1_700_001_200, 1_700_001_200], stat: [1, 0, 14_000] },
      "14": { name: "n", opt: { scrType: "skbso" }, rank: 14, date: [1_700_001_300, 1_700_001_300], stat: [1, 0, 16_000] },
      "15": { name: "o", opt: { scrType: "sqrs" }, rank: 15, date: [1_700_001_400, 1_700_001_400], stat: [1, 0, 25_000] },
      "16": { name: "p", opt: { scrType: "mgmp" }, rank: 16, date: [1_700_001_500, 1_700_001_500], stat: [1, 0, 25_000] },
      "17": { name: "q", opt: { scrType: "ftoso" }, rank: 17, date: [1_700_001_600, 1_700_001_600], stat: [1, 0, 65_000] },
      "18": { name: "r", opt: { scrType: "clkwca" }, rank: 18, date: [1_700_001_700, 1_700_001_700], stat: [1, 0, 95_000] },
    }),
    sessionN: 18,
    session: 1,
  },
});

describe("parseCstimerExport", () => {
  it("parses sessions, events, penalties and dates", () => {
    const result = parseCstimerExport(cstimerFile());
    expect(result.sessions).toBe(2);
    expect(result.invalidSolves).toBe(0);
    expect(result.entries).toHaveLength(4);

    const threeByThree = result.entries.filter(e => e.eventId === "333");
    expect(threeByThree).toHaveLength(3);
    expect(threeByThree[0]).toMatchObject({
      elapsedMs: 10_000,
      penalty: "none",
      input: "R U R' U'",
      note: "",
      createdAt: 1_700_000_000_000,
    });
    expect(threeByThree[1]).toMatchObject({ elapsedMs: 11_000, penalty: "+2", note: "nice try" });
    expect(threeByThree[2]).toMatchObject({ elapsedMs: 12_000, penalty: "DNF", note: "dnf one" });

    const big = result.entries.find(e => e.eventId === "444");
    expect(big).toMatchObject({ elapsedMs: 30_000, penalty: "none", input: "2R2 U2 2R2 Uw2" });
  });

  it("skips sessions with an unknown scramble type instead of misfiling them", () => {
    const file = {
      ...cstimerFile(),
      session3: [
        [[0, 5_000], "X Y Z", "", 1_700_000_400],
      ],
      properties: {
        ...cstimerFile().properties,
        sessionData: JSON.stringify({
          "1": { name: "a", opt: {}, rank: 1 },
          "2": { name: "b", opt: { scrType: "444wca" }, rank: 2 },
          "3": { name: "odd", opt: { scrType: "99oddtype" }, rank: 3 },
        }),
      },
    };
    const result = parseCstimerExport(file);
    expect(result.skippedSessions).toBe(1);
    expect(result.sessions).toBe(2);
    expect(result.entries).toHaveLength(4);
  });

  it("counts malformed solves without aborting the import", () => {
    const file = {
      session1: [
        [[0, 10_000], "R U R'", "", 1_700_000_000],
        [[7, 10_000], "bad flag", "", 1_700_000_100],
        ["not an array"],
        [[0, "not a time"], "bad time", "", 1_700_000_200],
        null,
      ],
      properties: { sessionData: "{}" },
    };
    const result = parseCstimerExport(file);
    expect(result.entries).toHaveLength(1);
    expect(result.invalidSolves).toBe(4);
  });

  it("treats sessions without scrType as 3×3 (csTimer convention)", () => {
    const file = {
      session1: [[[0, 8_000], "R U R'", "", 1_700_000_000]],
      properties: { sessionData: "{}" },
    };
    expect(parseCstimerExport(file).entries[0]?.eventId).toBe("333");
  });

  it("maps every registered csTimer scramble ID (per csTimer's own scrdata)", () => {
    const file = cstimerFileAllRegisteredIds();
    const result = parseCstimerExport(file);
    expect(result.skippedSessions).toBe(0);
    expect(result.invalidSolves).toBe(0);
    expect(result.entries).toHaveLength(18);
    expect(result.sessions).toBe(18);
    const events = new Set(result.entries.map(entry => entry.eventId));
    expect(events.size).toBe(18);
    expect(new Set([
      "333", "222", "333bf", "333oh", "444", "555", "666", "777",
      "444bf", "555bf", "333fm", "333mbf", "pyram", "skewb", "sq1", "minx", "fto", "clock",
    ])).toEqual(events);
  });

  it("rejects a non-csTimer payload", () => {
    expect(() => parseCstimerExport(42)).toThrow();
    expect(() => parseCstimerExport({ hello: "world" })).toThrow();
    expect(() => parseCstimerExport([])).toThrow();
  });
});

describe("importCstimerSolveHistory", () => {
  it("merges parsed solves and tags them csTimer", () => {
    const summary = importCstimerSolveHistory(cstimerFile());
    expect(summary.imported).toBe(4);
    expect(summary.sessions).toBe(2);
    expect(summary.duplicates).toBe(0);
    const entries = readSolveHistory();
    expect(entries).toHaveLength(4);
    expect(entries.every(entry => entry.tags.includes("csTimer"))).toBe(true);
    expect(entries.every(entry => entry.moves === 0)).toBe(true);
  });

  it("importing the same file twice skips duplicates instead of doubling entries", () => {
    const first = importCstimerSolveHistory(cstimerFile());
    const second = importCstimerSolveHistory(cstimerFile());
    expect(first.imported).toBe(4);
    expect(second.imported).toBe(0);
    expect(second.duplicates).toBe(4);
    expect(readSolveHistory()).toHaveLength(4);
  });

  it("keeps user-timed solves and csTimer imports independent", () => {
    addSolveHistory({
      elapsedMs: 9_900,
      inspectionMs: 0,
      input: "R U R' U'",
      inputKind: "scramble",
      moves: 0,
      eventId: "444",
    });
    const summary = importCstimerSolveHistory(cstimerFile());
    expect(summary.imported).toBe(4);
    expect(readSolveHistory()).toHaveLength(5);
  });

  it("imports a full 600-solve migration without silently dropping entries", () => {
    // Pre-fill 498 solves so the merged history is larger than MAX_ENTRIES.
    for (let i = 0; i < 498; i += 1) {
      addSolveHistory({
        elapsedMs: 8_000 + i,
        inspectionMs: 0,
        input: `R U R' U' ${i}`,
        inputKind: "scramble",
        moves: 0,
        eventId: "333",
      });
    }
    const session1 = Array.from({ length: 20 }, (_, i) => [
      [0, 10_000 + i] as [number, number],
      `F R U R' U' ${i}`,
      "",
      1_700_000_000 + i,
    ] as unknown as unknown[]);
    const summary = importCstimerSolveHistory({
      session1,
      properties: { sessionData: "{}" },
    });
    expect(summary.imported).toBe(20);
    // 498 existing + 20 imported = 518 — nothing silently sliced away.
    expect(readSolveHistory().length).toBe(518);
  });
});

describe("exportCstimerSolveHistory", () => {
  it("rebuilds a csTimer-shaped file and survives a round trip", () => {
    importCstimerSolveHistory(cstimerFile());
    const file = exportCstimerSolveHistory();

    // Shape: sessionN keys + properties.sessionData string
    const sessionKeys = Object.keys(file).filter(key => /^session\d+$/.test(key));
    expect(sessionKeys.length).toBe(2);
    const properties = file.properties as {
      sessionData: string;
      sessionN: number;
      session: number;
    };
    const sessionData = JSON.parse(properties.sessionData);
    expect(sessionData["1"]?.opt?.scrType).toBeUndefined(); // 3×3 → no scrType
    const fourByFourMeta = Object.values(sessionData).find(
      meta => (meta as { opt?: { scrType?: string } }).opt?.scrType === "444wca",
    );
    expect(fourByFourMeta).toBeDefined();

    // Round trip into a fresh store
    window.localStorage.clear();
    const restored = importCstimerSolveHistory(file);
    expect(restored.imported).toBe(4);
    const entries = readSolveHistory();
    expect(entries).toHaveLength(4);
    const byKey = new Map(
      entries.map(entry => [`${entry.eventId}:${entry.input}:${entry.elapsedMs}`, entry]),
    );
    expect(byKey.get("444:2R2 U2 2R2 Uw2:30000")).toMatchObject({
      elapsedMs: 30_000,
      penalty: "none",
      input: "2R2 U2 2R2 Uw2",
      note: "parity practice",
    });
    const plusTwo = entries.find(entry => entry.penalty === "+2");
    expect(plusTwo).toMatchObject({ elapsedMs: 11_000, note: "nice try" });
  });

  it("keeps Multi-Blind solves in a 333mbf session with the full bundle", () => {
    addSolveHistory({
      elapsedMs: 3_000_000,
      inspectionMs: 0,
      input: "R U R' U'",
      inputKind: "scramble",
      moves: 0,
      eventId: "333mbf",
      multiBlind: { attempted: 3, solved: 2 },
      multiBlindScrambles: ["R U R' U'", "F R U R' U'", "U R U' R'"],
    });
    const file = exportCstimerSolveHistory();
    const sessionKeys = Object.keys(file).filter(key => /^session\d+$/.test(key));
    expect(sessionKeys.length).toBe(1);
    const solves = file[sessionKeys[0]!] as Array<[[number, number], string, string, number]>;
    expect(solves[0][1]).toBe("R U R' U'\nF R U R' U'\nU R U' R'");
    const properties = file.properties as { sessionData: string };
    const sessionData = JSON.parse(properties.sessionData);
    expect(sessionData["1"]?.opt?.scrType).toBe("r3ni");
  });
});
