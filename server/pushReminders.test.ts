import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  due: [] as Array<Record<string, unknown>>,
  notified: [] as Array<[number, number]>,
  removed: [] as number[],
}));

vi.mock("./db", () => ({
  listDuePushSubscriptions: async () => db.due,
  markPushNotified: async (id: number, now: number) => {
    db.notified.push([id, now]);
  },
  deletePushSubscriptionById: async (id: number) => {
    db.removed.push(id);
  },
}));

import {
  MIN_NOTIFY_GAP_MS,
  isAllowedPushEndpoint,
  isQuietHour,
  readVapidConfig,
  runReminderSweep,
} from "./services/pushReminders";

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  p256dh: "p",
  auth: "a",
  tzOffsetMinutes: 0,
  dueCount: 4,
  lastNotifiedAt: null,
  ...over,
});

const NOON = Date.UTC(2026, 10, 23, 12, 0, 0);

beforeEach(() => {
  db.due = [];
  db.notified = [];
  db.removed = [];
});

describe("readVapidConfig", () => {
  it("needs all three values and a mailto or https subject", () => {
    expect(readVapidConfig({})).toBeNull();
    expect(
      readVapidConfig({ VAPID_PUBLIC_KEY: "a", VAPID_PRIVATE_KEY: "b", VAPID_SUBJECT: "admin" })
    ).toBeNull();
    expect(
      readVapidConfig({
        VAPID_PUBLIC_KEY: " a ",
        VAPID_PRIVATE_KEY: "b",
        VAPID_SUBJECT: "mailto:ops@example.com",
      })
    ).toEqual({ publicKey: "a", privateKey: "b", subject: "mailto:ops@example.com" });
  });
});

describe("isAllowedPushEndpoint", () => {
  it("accepts the push services of the major browsers", () => {
    for (const url of [
      "https://fcm.googleapis.com/fcm/send/x",
      "https://updates.push.services.mozilla.com/wpush/v2/x",
      "https://web.push.apple.com/x",
      "https://wns2-par02p.notify.windows.com/w/?token=x",
    ])
      expect(isAllowedPushEndpoint(url)).toBe(true);
  });

  it("rejects other hosts, plain http, credentials and odd ports", () => {
    for (const url of [
      "http://fcm.googleapis.com/x",
      "https://example.com/x",
      "https://fcm.googleapis.com.evil.test/x",
      "https://evilfcm.googleapis.com.example/x",
      "https://user:pw@fcm.googleapis.com/x",
      "https://fcm.googleapis.com:8443/x",
      "http://169.254.169.254/latest",
      "not a url",
    ])
      expect(isAllowedPushEndpoint(url)).toBe(false);
  });
});

describe("isQuietHour", () => {
  it("applies the night window in the browser's own time zone", () => {
    expect(isQuietHour(NOON, 0)).toBe(false);
    expect(isQuietHour(NOON, -420)).toBe(false);
    expect(isQuietHour(NOON + 4 * 3_600_000, -420)).toBe(true);
    expect(isQuietHour(Date.UTC(2026, 10, 23, 3, 0), 0)).toBe(true);
    expect(isQuietHour(Date.UTC(2026, 10, 23, 8, 0), 0)).toBe(false);
  });
});

describe("runReminderSweep", () => {
  it("sends one notification per due subscription and records it", async () => {
    db.due = [row({ id: 1 }), row({ id: 2 })];
    const sent: number[] = [];
    const result = await runReminderSweep(async target => void sent.push(target.id), NOON);
    expect(result).toEqual({ sent: 2, skipped: 0, removed: 0 });
    expect(sent).toEqual([1, 2]);
    expect(db.notified).toEqual([
      [1, NOON],
      [2, NOON],
    ]);
  });

  it("holds back during quiet hours and inside the minimum gap", async () => {
    db.due = [
      row({ id: 1, tzOffsetMinutes: -420 }),
      row({ id: 2, lastNotifiedAt: NOON - MIN_NOTIFY_GAP_MS + 1000 }),
    ];
    const send = vi.fn();
    const quietNow = Date.UTC(2026, 10, 23, 16, 0);
    db.due[1].lastNotifiedAt = quietNow - MIN_NOTIFY_GAP_MS + 1000;
    const result = await runReminderSweep(send, quietNow);
    expect(send).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: 0, skipped: 2, removed: 0 });
    expect(db.notified).toEqual([]);
  });

  it("removes subscriptions the push service reports as gone and keeps others on transient errors", async () => {
    db.due = [row({ id: 1 }), row({ id: 2 }), row({ id: 3 })];
    const result = await runReminderSweep(async target => {
      if (target.id === 1) throw Object.assign(new Error("gone"), { statusCode: 410 });
      if (target.id === 2) throw Object.assign(new Error("busy"), { statusCode: 503 });
    }, NOON);
    expect(result).toEqual({ sent: 1, skipped: 1, removed: 1 });
    expect(db.removed).toEqual([1]);
    expect(db.notified).toEqual([[3, NOON]]);
  });
});
