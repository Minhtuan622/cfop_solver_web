import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  countPushSubscriptions: vi.fn(),
  deletePushSubscription: vi.fn(),
  findPushSubscription: vi.fn(),
  updatePushSchedule: vi.fn(),
  upsertPushSubscription: vi.fn(),
}));

import { appRouter } from "./routers";
import { MAX_PUSH_SUBSCRIPTIONS_PER_ACCOUNT } from "./routers/push";
import {
  countPushSubscriptions,
  deletePushSubscription,
  findPushSubscription,
  updatePushSchedule,
  upsertPushSubscription,
} from "./db";

const ctx = {
  cfopAccount: { id: 7 },
  req: {},
  res: {},
} as unknown as TrpcContext;
const anonymous = { cfopAccount: null, req: {}, res: {} } as unknown as TrpcContext;

const subscription = {
  endpoint: "https://fcm.googleapis.com/fcm/send/abc",
  p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
  auth: "tBHItJI5svbpez7KI4CCXg",
  tzOffsetMinutes: -420,
};

function withVapid() {
  vi.stubEnv("VAPID_PUBLIC_KEY", "public");
  vi.stubEnv("VAPID_PRIVATE_KEY", "private");
  vi.stubEnv("VAPID_SUBJECT", "mailto:ops@example.com");
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("VAPID_PUBLIC_KEY", "");
  vi.stubEnv("VAPID_PRIVATE_KEY", "");
  vi.stubEnv("VAPID_SUBJECT", "");
});

describe("push router", () => {
  it("reports the feature as off until VAPID keys exist", async () => {
    expect(await appRouter.createCaller(anonymous).push.config()).toEqual({
      enabled: false,
      publicKey: null,
    });
    withVapid();
    expect(await appRouter.createCaller(anonymous).push.config()).toEqual({
      enabled: true,
      publicKey: "public",
    });
  });

  it("requires a signed-in account", async () => {
    withVapid();
    await expect(
      appRouter.createCaller(anonymous).push.subscribe(subscription)
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("refuses to subscribe while the server has no VAPID keys", async () => {
    await expect(
      appRouter.createCaller(ctx).push.subscribe(subscription)
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
    expect(upsertPushSubscription).not.toHaveBeenCalled();
  });

  it("rejects push endpoints outside the browser push services", async () => {
    withVapid();
    await expect(
      appRouter
        .createCaller(ctx)
        .push.subscribe({ ...subscription, endpoint: "https://internal.example/hook" })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(upsertPushSubscription).not.toHaveBeenCalled();
  });

  it("stores a new subscription for the caller's account", async () => {
    withVapid();
    vi.mocked(findPushSubscription).mockResolvedValue(null);
    vi.mocked(countPushSubscriptions).mockResolvedValue(1);
    await appRouter.createCaller(ctx).push.subscribe(subscription);
    expect(upsertPushSubscription).toHaveBeenCalledWith({
      accountId: 7,
      ...subscription,
    });
  });

  it("caps the browsers per account but lets a known one re-subscribe", async () => {
    withVapid();
    vi.mocked(countPushSubscriptions).mockResolvedValue(
      MAX_PUSH_SUBSCRIPTIONS_PER_ACCOUNT
    );
    vi.mocked(findPushSubscription).mockResolvedValue(null);
    await expect(
      appRouter.createCaller(ctx).push.subscribe(subscription)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    vi.mocked(findPushSubscription).mockResolvedValue({ id: 1 } as never);
    await expect(
      appRouter.createCaller(ctx).push.subscribe(subscription)
    ).resolves.toEqual({ success: true });
  });

  it("only updates a schedule the caller already registered", async () => {
    const input = {
      endpoint: subscription.endpoint,
      nextDueAt: 1_700_000_000_000,
      dueCount: 5,
      tzOffsetMinutes: -420,
    };
    vi.mocked(findPushSubscription).mockResolvedValue(null);
    expect(await appRouter.createCaller(ctx).push.sync(input)).toEqual({
      subscribed: false,
    });
    expect(updatePushSchedule).not.toHaveBeenCalled();

    vi.mocked(findPushSubscription).mockResolvedValue({ id: 1 } as never);
    expect(await appRouter.createCaller(ctx).push.sync(input)).toEqual({
      subscribed: true,
    });
    expect(updatePushSchedule).toHaveBeenCalledWith(7, subscription.endpoint, {
      nextDueAt: 1_700_000_000_000,
      dueCount: 5,
      tzOffsetMinutes: -420,
    });
  });

  it("removes only the caller's own subscription", async () => {
    await appRouter
      .createCaller(ctx)
      .push.unsubscribe({ endpoint: subscription.endpoint });
    expect(deletePushSubscription).toHaveBeenCalledWith(7, subscription.endpoint);
  });
});
