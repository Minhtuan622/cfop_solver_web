import { describe, expect, it } from "vitest";
import { dailyDigest, dayKey } from "./dailyDigest";

const at = (year: number, month: number, day: number, hour = 12) =>
  new Date(year, month - 1, day, hour).getTime();

describe("dailyDigest", () => {
  it("đếm số solve trong ngày hôm nay", () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const entries = [
      { createdAt: at(y, m, d, 8) },
      { createdAt: at(y, m, d, 9) },
      { createdAt: at(y, m, d, 10) },
      { createdAt: at(y, m, d - 1, 9) },
    ];
    expect(dailyDigest(entries).todayCount).toBe(3);
  });

  it("tính chuỗi ngày liên tục tính từ hôm nay", () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const entries = [
      { createdAt: at(y, m, d) },
      { createdAt: at(y, m, d - 1) },
      { createdAt: at(y, m, d - 2) },
      // gap at d-3 — streak stops at 3
      { createdAt: at(y, m, d - 4) },
    ];
    expect(dailyDigest(entries).streak).toBe(3);
  });

  it("khi hôm nay chưa giải, đếm chuỗi tính từ hôm qua", () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    const entries = [
      { createdAt: at(y, m, d - 1) },
      { createdAt: at(y, m, d - 2) },
    ];
    const digest = dailyDigest(entries);
    expect(digest.todayCount).toBe(0);
    expect(digest.streak).toBe(2);
  });

  it("chuỗi đứt khi thiếu ngày", () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    expect(dailyDigest([{ createdAt: at(y, m, d - 3) }]).streak).toBe(0);
    expect(dayKey(at(y, m, d))).toBe(
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`
    );
  });
});
