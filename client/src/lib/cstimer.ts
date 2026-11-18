/**
 * csTimer interop — parse files exported by csTimer (File → Export →
 * Export as file) and rebuild the same shape for our solve history.
 *
 * Format (as produced by csTimer):
 *   {
 *     "session1": [Solve, …], "session2": [Solve, …], …,
 *     "properties": {
 *       "sessionData": "{\"1\": {name, opt: {scrType?}, rank, date, stat}, …}",
 *       "sessionN": N, "session": 3, …
 *     }
 *   }
 * Solve = [ [flag, timeMs], scramble, comment, startedAtUnixSeconds ]
 * flag: 0 = OK, 2000 = +2, -1 = DNF.
 *
 * WCA 3×3×3 sessions carry no `scrType`; other events use ids like
 * "444wca", "333oh", "pyram". The mapping here is deliberately tolerant:
 * unknown scrTypes skip their session rather than mis-file their solves.
 */
import { TIMER_EVENTS, type TimerEventId } from "./timerEvents";

export type CstimerRawEntry = {
  createdAt: number;
  elapsedMs: number;
  penalty: "none" | "+2" | "DNF";
  input: string;
  note: string;
  eventId: TimerEventId;
};

export type CstimerParseResult = {
  entries: CstimerRawEntry[];
  /** Sessions whose solves were imported. */
  sessions: number;
  /** Sessions skipped because their scramble type is unknown. */
  skippedSessions: number;
  /** Malformed solves skipped (wrong shape/flag/values). */
  invalidSolves: number;
};

export type CstimerInputEntry = {
  createdAt: number;
  elapsedMs: number;
  penalty: "none" | "+2" | "DNF";
  input: string;
  note: string;
  eventId?: string | undefined;
  inputKind?: string | undefined;
  multiBlindScrambles?: string[] | undefined;
};

const SCRAMBLE_TYPE_TO_EVENT: Array<{ prefix: string; eventId: TimerEventId }> =
  [
    { prefix: "333mbf", eventId: "333mbf" },
    { prefix: "333bf", eventId: "333bf" },
    { prefix: "333oh", eventId: "333oh" },
    { prefix: "333fm", eventId: "333fm" },
    { prefix: "333", eventId: "333" },
    { prefix: "222", eventId: "222" },
    { prefix: "444bf", eventId: "444bf" },
    { prefix: "555bf", eventId: "555bf" },
    { prefix: "444", eventId: "444" },
    { prefix: "555", eventId: "555" },
    { prefix: "666", eventId: "666" },
    { prefix: "777", eventId: "777" },
    { prefix: "pyraminx", eventId: "pyram" },
    { prefix: "pyram", eventId: "pyram" },
    { prefix: "skewb", eventId: "skewb" },
    { prefix: "megaminx", eventId: "minx" },
    { prefix: "minx", eventId: "minx" },
    { prefix: "fto", eventId: "fto" },
    { prefix: "square1", eventId: "sq1" },
    { prefix: "sq1", eventId: "sq1" },
    { prefix: "clock", eventId: "clock" },
  ];

/** Normalize a cstimer scramble type to a known timer event, or null. */
export function eventForScrambleType(value: unknown): TimerEventId | null {
  if (typeof value !== "string") return "333";
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/wca$/, "");
  if (!normalized) return "333";
  const match = SCRAMBLE_TYPE_TO_EVENT.find(({ prefix }) =>
    normalized.startsWith(prefix),
  );
  return match ? match.eventId : null;
}

const EVENT_TO_SCR_TYPE: Partial<Record<TimerEventId, string>> = {
  "222": "222",
  // WCA 3×3×3 has no scrType in cstimer; exporting one makes it a custom session.
  "333oh": "333oh",
  "333bf": "333bf",
  "333fm": "333fm",
  "333mbf": "333mbf",
  "444": "444wca",
  "444bf": "444bf",
  "555": "555wca",
  "555bf": "555bf",
  "666": "666wca",
  "777": "777wca",
  pyram: "pyram",
  skewb: "skewb",
  minx: "minx",
  fto: "fto",
  sq1: "sq1",
  clock: "clock",
};

function toNumber(value: unknown): number | null {
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Parse a csTimer export payload (already JSON.parsed). Throws when the
 * payload is not a plausible csTimer file — callers should catch and show
 * the localized failure message.
 */
export function parseCstimerExport(payload: unknown): CstimerParseResult {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Not a csTimer export object");
  }
  const record = payload as Record<string, unknown>;

  // Session metadata: properties.sessionData is a JSON-encoded string.
  let sessionData: Record<string, unknown> = {};
  const properties = record.properties;
  if (properties && typeof properties === "object") {
    const raw = (properties as Record<string, unknown>).sessionData;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          sessionData = parsed as Record<string, unknown>;
        }
      } catch {
        // Older/partial exports sometimes skip metadata — sessions still import.
      }
    } else if (raw && typeof raw === "object") {
      sessionData = raw as Record<string, unknown>;
    }
  }

  const sessionKeys = Object.keys(record).filter(key =>
    /^session\d+$/.test(key),
  );
  if (sessionKeys.length === 0) {
    throw new Error("No csTimer sessions found");
  }

  const entries: CstimerRawEntry[] = [];
  let sessions = 0;
  let skippedSessions = 0;
  let invalidSolves = 0;

  for (const key of sessionKeys) {
    const solves = record[key];
    if (!Array.isArray(solves)) {
      invalidSolves += 1;
      continue;
    }
    const meta = sessionData[key.replace(/^session/, "")] as
      | Record<string, unknown>
      | undefined;
    const scrType =
      meta && typeof meta === "object" && meta.opt && typeof meta.opt === "object"
        ? (meta.opt as Record<string, unknown>).scrType
        : undefined;
    const eventId = eventForScrambleType(scrType);
    if (!eventId) {
      skippedSessions += 1;
      continue;
    }

    let importedFromSession = 0;
    for (const solve of solves) {
      if (!Array.isArray(solve) || solve.length < 2) {
        invalidSolves += 1;
        continue;
      }
      const [flagBox, scrambleRaw, commentRaw, startedAtRaw] = solve;
      if (!Array.isArray(flagBox) || flagBox.length < 2) {
        invalidSolves += 1;
        continue;
      }
      const flag = toNumber(flagBox[0]);
      const timeMs = toNumber(flagBox[1]);
      const startedAt = toNumber(startedAtRaw);
      if (flag === null || timeMs === null || timeMs < 0 || startedAt === null) {
        invalidSolves += 1;
        continue;
      }
      let penalty: CstimerRawEntry["penalty"];
      if (flag === 0) penalty = "none";
      else if (flag === 2000) penalty = "+2";
      else if (flag === -1) penalty = "DNF";
      else {
        invalidSolves += 1;
        continue;
      }

      entries.push({
        createdAt: Math.round(startedAt) * 1000,
        elapsedMs: Math.round(timeMs),
        penalty,
        input: typeof scrambleRaw === "string" ? scrambleRaw : "",
        note: typeof commentRaw === "string" ? commentRaw : "",
        eventId,
      });
      importedFromSession += 1;
    }
    if (importedFromSession > 0) sessions += 1;
  }

  return { entries, sessions, skippedSessions, invalidSolves };
}

/** Rebuild a csTimer export file from our entries. */
export function buildCstimerExport(
  entries: readonly CstimerInputEntry[],
): Record<string, unknown> {
  const byEvent = new Map<TimerEventId, CstimerInputEntry[]>();
  for (const entry of entries) {
    if (entry.inputKind === "state") continue; // raw 6-face states don't map to a cstimer scramble
    if (entry.eventId === "333mbf" && Array.isArray(entry.multiBlindScrambles) && entry.multiBlindScrambles.length === 0)
      continue;
    const eventId = eventForInputEventId(entry.eventId);
    if (!eventId) continue;
    const list = byEvent.get(eventId) ?? [];
    list.push(entry);
    byEvent.set(eventId, list);
  }

  const file: Record<string, unknown> = {};
  const sessionData: Record<
    string,
    {
      name: string;
      opt: Record<string, string>;
      rank: number;
      date: [number, number] | null;
      stat: [number, number, number];
    }
  > = {};

  let index = 0;
  for (const { id: eventId } of TIMER_EVENTS) {
    const list = byEvent.get(eventId);
    if (!list?.length) continue;
    index += 1;
    const key = String(index);

    const sorted = [...list].sort((a, b) => a.createdAt - b.createdAt);
    const solves = sorted.map(entry => {
      const penaltyFlag =
        entry.penalty === "+2" ? 2000 : entry.penalty === "DNF" ? -1 : 0;
      const scramble =
        entry.eventId === "333mbf" &&
        entry.multiBlindScrambles &&
        entry.multiBlindScrambles.length > 0
          ? entry.multiBlindScrambles.join("\n")
          : entry.input;
      return [
        [penaltyFlag, Math.round(entry.elapsedMs)],
        scramble,
        entry.note ?? "",
        Math.floor(entry.createdAt / 1000),
      ];
    });

    const validTimes = list.filter(entry => entry.penalty !== "DNF");
    const dnfCount = list.length - validTimes.length;
    const meanMs =
      validTimes.length > 0
        ? Math.round(
            validTimes.reduce((sum, entry) => sum + entry.elapsedMs, 0) /
              validTimes.length,
          )
        : -1;
    const first = Math.floor(sorted[0]!.createdAt / 1000);
    const last = Math.floor(sorted[sorted.length - 1]!.createdAt / 1000);

    const scrType = EVENT_TO_SCR_TYPE[eventId];
    file[`session${key}`] = solves;
    sessionData[key] = {
      name: eventId,
      opt: scrType ? { scrType } : {},
      rank: index,
      date: [first, last],
      stat: [list.length, dnfCount, meanMs],
    };
  }

  file.properties = {
    sessionData: JSON.stringify(sessionData),
    sessionN: index,
    session: 1,
  };
  return file;
}

function eventForInputEventId(value: string | undefined): TimerEventId | null {
  if (!value) return "333";
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = SCRAMBLE_TYPE_TO_EVENT.find(({ prefix }) =>
    normalized.startsWith(prefix),
  );
  return match ? match.eventId : "333";
}
