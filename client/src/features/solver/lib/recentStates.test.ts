import { beforeEach, describe, expect, it } from "vitest";
import { readRecentStates, recentStateLabel, rememberRecentState, writeRecentStates } from "./recentStates";

const STATE = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB";
const OTHER = "UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBU";

beforeEach(() => localStorage.clear());

describe("the recent cube states", () => {
  it("keeps the newest state at the front and never repeats itself", () => {
    const first = rememberRecentState([], STATE, "U", "vi");
    const second = rememberRecentState(first, OTHER, "U", "vi");
    const again = rememberRecentState(second, STATE, "U", "vi");

    expect(again[0].state).toBe(STATE);
    expect(again).toHaveLength(2);
  });

  it("ignores a state that is not a full cube", () => {
    expect(rememberRecentState([], "RU", "U", "vi")).toEqual([]);
  });

  it("survives a broken entry in the browser storage", () => {
    localStorage.setItem("cfop-studio-recent-states-v1", JSON.stringify([{ state: "RU" }, { state: STATE }]));

    expect(readRecentStates()).toHaveLength(1);
    expect(readRecentStates()[0].state).toBe(STATE);
  });

  it("writes the list back for the next visit", () => {
    writeRecentStates(rememberRecentState([], STATE, "U", "en"));

    expect(readRecentStates()[0].state).toBe(STATE);
  });

  it("labels a state in the language of the interface", () => {
    expect(recentStateLabel("vi", new Date("2026-10-22T09:05:00Z"))).toContain("State");
    expect(recentStateLabel("en", new Date("2026-10-22T09:05:00Z"))).toContain("State");
  });
});
