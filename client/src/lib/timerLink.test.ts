import { describe, expect, it } from "vitest";
import { buildTimerPath, parseTimerLink } from "./timerLink";

describe("link mở Timer với scramble", () => {
  it("đi vòng scramble 3×3 và Square-1", () => {
    for (const [event, scramble] of [
      ["333", "R U R' U' F2 Rw"],
      ["sq1", "(1,0) / (3,3) / (-1,0)"],
    ] as const) {
      const path = buildTimerPath(event, scramble);
      expect(parseTimerLink(path.slice(path.indexOf("?")))).toEqual({ eventId: event, scramble });
    }
  });

  it("từ chối event lạ, thiếu scramble, ký tự lạ hoặc quá dài", () => {
    expect(parseTimerLink("?event=nope&scramble=R")).toBeNull();
    expect(parseTimerLink("?event=333")).toBeNull();
    expect(parseTimerLink("?event=333&scramble=" + encodeURIComponent("R <b>"))).toBeNull();
    expect(parseTimerLink("?event=333&scramble=" + "R ".repeat(400))).toBeNull();
    expect(parseTimerLink("")).toBeNull();
  });
});
