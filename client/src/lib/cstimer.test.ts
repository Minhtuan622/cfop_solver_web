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
    expect(sessionData["1"]?.opt?.scrType).toBe("333mbf");
  });
});
